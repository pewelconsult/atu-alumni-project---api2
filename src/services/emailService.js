// src/services/emailService.js
import nodemailer from 'nodemailer';

class EmailService {
  constructor() {
    this.transporter = null;
    this.isConfigured = false;
    this.initializeTransporter();
  }

  initializeTransporter() {
    try {
      console.log('🔧 Initializing email transporter...');
      
      const smtpUser = process.env.SMTP_USER;
      const smtpPassword = process.env.SMTP_PASSWORD;
      const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
      
      if (!smtpUser || !smtpPassword) {
        console.warn('⚠️ Email service not configured. Set SMTP_USER and SMTP_PASSWORD in .env');
        return;
      }

      this.transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: smtpUser,
          pass: smtpPassword
        }
      });

      this.isConfigured = true;
      console.log('✅ Email service configured');

      this.verifyConnection();
    } catch (error) {
      console.error('❌ Email service initialization failed:', error.message);
      this.isConfigured = false;
    }
  }

  async verifyConnection() {
    if (!this.transporter) return;
    try {
      await this.transporter.verify();
      console.log('✅ Email server connection verified');
    } catch (error) {
      console.error('❌ Email connection failed:', error.message);
      this.isConfigured = false;
    }
  }

  async sendEmail(options) {
    let to, subject, html, text;
    
    if (typeof options === 'object' && !Array.isArray(options)) {
      ({ to, subject, html, text } = options);
    } else {
      to = arguments[0];
      subject = arguments[1];
      html = arguments[2];
      text = arguments[3];
    }

    if (!this.isConfigured) {
      console.warn('⚠️ Email service not configured');
      return { success: false, error: 'Email service not configured' };
    }

    try {
      const fromEmail = process.env.FROM_EMAIL || process.env.SMTP_USER;
      
      if (!html && !text) {
        return { success: false, error: 'No email content' };
      }
      
      const mailOptions = {
        from: `"ATU Alumni Network" <${fromEmail}>`,
        to: Array.isArray(to) ? to.join(', ') : to,
        subject: subject || 'No Subject',
        html: html || `<p>${text}</p>`,
        text: text || this.stripHtml(html) || ''
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log(`✅ Email sent to ${to}`);
      
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('❌ Email send error:', error);
      return { success: false, error: error.message };
    }
  }

  stripHtml(html) {
    if (!html || typeof html !== 'string') return '';
    return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  }
}

export default new EmailService();