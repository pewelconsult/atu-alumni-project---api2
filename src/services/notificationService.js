// src/services/notificationService.js
import emailService from "./emailService.js";
import smsService from "./smsService.js";
import pool from "../config/db.js";

class NotificationService {
    // ==================== CONNECTION REQUEST NOTIFICATIONS ====================
    
    async notifyConnectionRequest(senderId, receiverId) {
        try {
            // Get sender and receiver details
            const result = await pool.query(
                `SELECT 
                    sender.id as sender_id,
                    sender.first_name as sender_first_name,
                    sender.last_name as sender_last_name,
                    sender.email as sender_email,
                    sender.current_company as sender_company,
                    sender.job_title as sender_title,
                    receiver.id as receiver_id,
                    receiver.first_name as receiver_first_name,
                    receiver.last_name as receiver_last_name,
                    receiver.email as receiver_email,
                    receiver.phone_number as receiver_phone
                FROM users sender, users receiver
                WHERE sender.id = $1 AND receiver.id = $2`,
                [senderId, receiverId]
            );

            if (result.rows.length === 0) return;

            const { 
                sender_first_name, sender_last_name, sender_company, sender_title,
                receiver_first_name, receiver_email, receiver_phone 
            } = result.rows[0];

            const frontendUrl = process.env.FRONTEND_URL || 'https://alumni.atu.edu.gh';

            // Send Email
            const emailHtml = this.getConnectionRequestEmailTemplate(
                receiver_first_name,
                sender_first_name,
                sender_last_name,
                sender_company,
                sender_title,
                frontendUrl
            );

            await emailService.sendEmail({
                to: receiver_email,
                subject: `${sender_first_name} ${sender_last_name} wants to connect with you`,
                html: emailHtml
            });

            // Send SMS if phone number exists
            if (receiver_phone) {
                const smsMessage = `New connection request from ${sender_first_name} ${sender_last_name}. Login to ATU Alumni Network to respond: ${frontendUrl}`;
                await smsService.sendSMS(receiver_phone, smsMessage);
            }

        } catch (error) {
            console.error('Connection request notification error:', error);
        }
    }

    async notifyConnectionAccepted(requesterId, accepterId) {
        try {
            const result = await pool.query(
                `SELECT 
                    requester.first_name as requester_first_name,
                    requester.last_name as requester_last_name,
                    requester.email as requester_email,
                    requester.phone_number as requester_phone,
                    accepter.first_name as accepter_first_name,
                    accepter.last_name as accepter_last_name
                FROM users requester, users accepter
                WHERE requester.id = $1 AND accepter.id = $2`,
                [requesterId, accepterId]
            );

            if (result.rows.length === 0) return;

            const { 
                requester_first_name, requester_email, requester_phone,
                accepter_first_name, accepter_last_name 
            } = result.rows[0];

            const frontendUrl = process.env.FRONTEND_URL || 'https://alumni.atu.edu.gh';

            // Send Email
            const emailHtml = this.getConnectionAcceptedEmailTemplate(
                requester_first_name,
                accepter_first_name,
                accepter_last_name,
                frontendUrl
            );

            await emailService.sendEmail({
                to: requester_email,
                subject: `${accepter_first_name} ${accepter_last_name} accepted your connection request`,
                html: emailHtml
            });

            // Send SMS
            if (requester_phone) {
                const smsMessage = `${accepter_first_name} ${accepter_last_name} accepted your connection request! View profile: ${frontendUrl}`;
                await smsService.sendSMS(requester_phone, smsMessage);
            }

        } catch (error) {
            console.error('Connection accepted notification error:', error);
        }
    }

    // ==================== EVENT NOTIFICATIONS ====================
    
    async notifyEventRSVP(userId, eventId) {
        try {
            const result = await pool.query(
                `SELECT 
                    u.first_name, u.email, u.phone_number,
                    e.title, e.start_date, e.location, e.event_type
                FROM users u, events e
                WHERE u.id = $1 AND e.id = $2`,
                [userId, eventId]
            );

            if (result.rows.length === 0) return;

            const { first_name, email, phone_number, title, start_date, location, event_type } = result.rows[0];
            const frontendUrl = process.env.FRONTEND_URL || 'https://alumni.atu.edu.gh';

            // Send Email
            const emailHtml = this.getEventConfirmationEmailTemplate(
                first_name,
                title,
                start_date,
                location,
                event_type,
                frontendUrl
            );

            await emailService.sendEmail({
                to: email,
                subject: `RSVP Confirmed: ${title}`,
                html: emailHtml
            });

            // Send SMS
            if (phone_number) {
                const eventDate = new Date(start_date).toLocaleDateString();
                const smsMessage = `RSVP confirmed for ${title} on ${eventDate}. Location: ${location || 'TBA'}. See details: ${frontendUrl}/events`;
                await smsService.sendSMS(phone_number, smsMessage);
            }

        } catch (error) {
            console.error('Event RSVP notification error:', error);
        }
    }

    async sendEventReminders(eventId, reminderType = 'tomorrow') {
        try {
            // Get all attendees for the event
            const result = await pool.query(
                `SELECT 
                    u.id, u.first_name, u.email, u.phone_number,
                    e.title, e.start_date, e.location
                FROM event_rsvps er
                JOIN users u ON er.user_id = u.id
                JOIN events e ON er.event_id = e.id
                WHERE er.event_id = $1 AND er.status = 'going'`,
                [eventId]
            );

            if (result.rows.length === 0) return;

            const attendees = result.rows;
            const event = {
                title: result.rows[0].title,
                start_date: result.rows[0].start_date,
                location: result.rows[0].location
            };

            // Send reminders to all attendees
            for (const attendee of attendees) {
                await this.sendEventReminder(attendee, event, reminderType);
            }

        } catch (error) {
            console.error('Event reminders error:', error);
        }
    }

    async sendEventReminder(user, event, reminderType) {
        const frontendUrl = process.env.FRONTEND_URL || 'https://alumni.atu.edu.gh';
        let subject, emailHtml, smsMessage;

        switch (reminderType) {
            case 'tomorrow':
                subject = `Reminder: ${event.title} - Tomorrow!`;
                emailHtml = this.getEventReminderEmailTemplate(user.first_name, event, 'tomorrow', frontendUrl);
                smsMessage = `Reminder: ${event.title} is tomorrow! Location: ${event.location || 'TBA'}`;
                break;
            
            case 'today':
                subject = `Today: ${event.title}`;
                emailHtml = this.getEventReminderEmailTemplate(user.first_name, event, 'today', frontendUrl);
                smsMessage = `Today: ${event.title}. Location: ${event.location || 'TBA'}. See you there!`;
                break;
            
            default:
                subject = `Upcoming: ${event.title}`;
                emailHtml = this.getEventReminderEmailTemplate(user.first_name, event, 'upcoming', frontendUrl);
                smsMessage = `Don't forget: ${event.title} on ${new Date(event.start_date).toLocaleDateString()}`;
        }

        // Send Email
        await emailService.sendEmail({
            to: user.email,
            subject,
            html: emailHtml
        });

        // Send SMS
        if (user.phone_number) {
            await smsService.sendSMS(user.phone_number, smsMessage);
        }
    }

    // ==================== JOB NOTIFICATIONS ====================
    
    async notifyJobApplication(jobId, applicantId) {
        try {
            const result = await pool.query(
                `SELECT 
                    poster.email as poster_email,
                    poster.phone_number as poster_phone,
                    poster.first_name as poster_first_name,
                    applicant.first_name as applicant_first_name,
                    applicant.last_name as applicant_last_name,
                    j.job_title, j.company_name
                FROM jobs j
                JOIN users poster ON j.posted_by = poster.id
                JOIN users applicant ON applicant.id = $2
                WHERE j.id = $1`,
                [jobId, applicantId]
            );

            if (result.rows.length === 0) return;

            const { 
                poster_email, poster_phone, poster_first_name,
                applicant_first_name, applicant_last_name,
                job_title, company_name 
            } = result.rows[0];

            const frontendUrl = process.env.FRONTEND_URL || 'https://alumni.atu.edu.gh';

            // Email to job poster
            const emailHtml = this.getJobApplicationNotificationEmailTemplate(
                poster_first_name,
                applicant_first_name,
                applicant_last_name,
                job_title,
                company_name,
                frontendUrl
            );

            await emailService.sendEmail({
                to: poster_email,
                subject: `New Application: ${job_title}`,
                html: emailHtml
            });

            // SMS to job poster
            if (poster_phone) {
                const smsMessage = `New application from ${applicant_first_name} ${applicant_last_name} for ${job_title}. Check: ${frontendUrl}/jobs`;
                await smsService.sendSMS(poster_phone, smsMessage);
            }

        } catch (error) {
            console.error('Job application notification error:', error);
        }
    }

    // ==================== EMAIL TEMPLATES ====================
    
    getConnectionRequestEmailTemplate(receiverName, senderFirstName, senderLastName, senderCompany, senderTitle, frontendUrl) {
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
                <div style="max-width: 600px; margin: 0 auto; background-color: white;">
                    <div style="background: linear-gradient(135deg, #1e3a8a, #f59e0b); padding: 30px; text-align: center;">
                        <h1 style="color: white; margin: 0; font-size: 24px;">🤝 New Connection Request</h1>
                    </div>

                    <div style="padding: 30px;">
                        <h2 style="color: #1e3a8a;">Hello ${receiverName}!</h2>
                        
                        <p style="font-size: 16px; color: #374151; line-height: 1.6;">
                            <strong>${senderFirstName} ${senderLastName}</strong> wants to connect with you on ATU Alumni Network.
                        </p>

                        ${senderCompany || senderTitle ? `
                            <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
                                ${senderTitle ? `<p style="margin: 0 0 10px 0; color: #374151;"><strong>Title:</strong> ${senderTitle}</p>` : ''}
                                ${senderCompany ? `<p style="margin: 0; color: #374151;"><strong>Company:</strong> ${senderCompany}</p>` : ''}
                            </div>
                        ` : ''}

                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${frontendUrl}/connections" 
                               style="background: linear-gradient(135deg, #1e3a8a, #1e40af); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                                View Request →
                            </a>
                        </div>

                        <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
                            You can accept or decline this connection request by logging into your account.
                        </p>
                    </div>

                    <div style="background: #f9fafb; padding: 20px 30px; border-top: 1px solid #e5e7eb; text-align: center;">
                        <p style="font-size: 14px; color: #6b7280; margin: 0;">
                            © ${new Date().getFullYear()} ATU Alumni Network
                        </p>
                    </div>
                </div>
            </body>
            </html>
        `;
    }

    getConnectionAcceptedEmailTemplate(requesterName, accepterFirstName, accepterLastName, frontendUrl) {
        return `
            <!DOCTYPE html>
            <html>
            <body style="margin: 0; padding: 0; font-family: Arial, sans-serif;">
                <div style="max-width: 600px; margin: 0 auto; background-color: white;">
                    <div style="background: linear-gradient(135deg, #10b981, #059669); padding: 30px; text-align: center;">
                        <h1 style="color: white; margin: 0;">✅ Connection Accepted</h1>
                    </div>

                    <div style="padding: 30px;">
                        <h2 style="color: #1e3a8a;">Great news, ${requesterName}!</h2>
                        
                        <p style="font-size: 16px; color: #374151;">
                            <strong>${accepterFirstName} ${accepterLastName}</strong> accepted your connection request.
                        </p>

                        <p style="font-size: 16px; color: #374151;">
                            You can now message each other and view each other's full profiles.
                        </p>

                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${frontendUrl}/connections" 
                               style="background: #10b981; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                                View Connection →
                            </a>
                        </div>
                    </div>
                </div>
            </body>
            </html>
        `;
    }

    getEventConfirmationEmailTemplate(userName, eventTitle, startDate, location, eventType, frontendUrl) {
        return `
            <!DOCTYPE html>
            <html>
            <body style="margin: 0; padding: 0; font-family: Arial, sans-serif;">
                <div style="max-width: 600px; margin: 0 auto; background-color: white;">
                    <div style="background: linear-gradient(135deg, #f59e0b, #d97706); padding: 30px; text-align: center;">
                        <h1 style="color: white; margin: 0;">🎉 RSVP Confirmed</h1>
                    </div>

                    <div style="padding: 30px;">
                        <h2 style="color: #1e3a8a;">Hello ${userName}!</h2>
                        
                        <p style="font-size: 16px; color: #374151;">
                            Your RSVP for <strong>${eventTitle}</strong> has been confirmed!
                        </p>

                        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
                            <p style="margin: 0 0 10px 0;"><strong>📅 Date:</strong> ${new Date(startDate).toLocaleDateString()}</p>
                            <p style="margin: 0 0 10px 0;"><strong>🕐 Time:</strong> ${new Date(startDate).toLocaleTimeString()}</p>
                            <p style="margin: 0;"><strong>📍 Location:</strong> ${location || 'TBA'}</p>
                        </div>

                        <p style="font-size: 16px; color: #374151;">
                            We look forward to seeing you there!
                        </p>

                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${frontendUrl}/events" 
                               style="background: #f59e0b; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                                View Event Details →
                            </a>
                        </div>
                    </div>
                </div>
            </body>
            </html>
        `;
    }

    getEventReminderEmailTemplate(userName, event, reminderType, frontendUrl) {
        const timeText = reminderType === 'today' ? 'today' : reminderType === 'tomorrow' ? 'tomorrow' : 'soon';
        
        return `
            <!DOCTYPE html>
            <html>
            <body style="margin: 0; padding: 0; font-family: Arial, sans-serif;">
                <div style="max-width: 600px; margin: 0 auto; background-color: white;">
                    <div style="background: #1e3a8a; padding: 30px; text-align: center;">
                        <h1 style="color: white; margin: 0;">⏰ Event Reminder</h1>
                    </div>

                    <div style="padding: 30px;">
                        <h2>Hi ${userName}!</h2>
                        
                        <p style="font-size: 18px; color: #374151;">
                            Reminder: <strong>${event.title}</strong> is ${timeText}!
                        </p>

                        <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0;">
                            <p style="margin: 0 0 10px 0; color: #92400e;"><strong>📍 Location:</strong> ${event.location || 'TBA'}</p>
                            <p style="margin: 0; color: #92400e;"><strong>📅 Date:</strong> ${new Date(event.start_date).toLocaleString()}</p>
                        </div>

                        <p>Don't forget to attend! We're looking forward to seeing you there.</p>
                    </div>
                </div>
            </body>
            </html>
        `;
    }

    getJobApplicationNotificationEmailTemplate(posterName, applicantFirstName, applicantLastName, jobTitle, companyName, frontendUrl) {
        return `
            <!DOCTYPE html>
            <html>
            <body style="margin: 0; padding: 0; font-family: Arial, sans-serif;">
                <div style="max-width: 600px; margin: 0 auto; background-color: white;">
                    <div style="background: linear-gradient(135deg, #8b5cf6, #7c3aed); padding: 30px; text-align: center;">
                        <h1 style="color: white; margin: 0;">💼 New Job Application</h1>
                    </div>

                    <div style="padding: 30px;">
                        <h2>Hi ${posterName}!</h2>
                        
                        <p style="font-size: 16px; color: #374151;">
                            You have received a new application for:
                        </p>

                        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
                            <p style="margin: 0 0 10px 0;"><strong>Position:</strong> ${jobTitle}</p>
                            <p style="margin: 0 0 10px 0;"><strong>Company:</strong> ${companyName}</p>
                            <p style="margin: 0;"><strong>Applicant:</strong> ${applicantFirstName} ${applicantLastName}</p>
                        </div>

                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${frontendUrl}/jobs/applications" 
                               style="background: #8b5cf6; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                                View Application →
                            </a>
                        </div>
                    </div>
                </div>
            </body>
            </html>
        `;
    }
}

export default new NotificationService();