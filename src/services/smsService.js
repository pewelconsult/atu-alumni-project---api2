// src/services/smsService.js

class SMSService {
  constructor() {
    this.apiKey = process.env.SMS_API_KEY;
    this.username = process.env.SMS_USERNAME || 'kuminewton@gmail.com';
    this.senderId = 'ATU Alumni';
    this.baseUrl = 'https://frogapi.wigal.com.gh/api/v3';
    this.isConfigured = false;
    
    this.initialize();
  }

  initialize() {
    if (!this.apiKey) {
      console.warn('⚠️ SMS not configured. Set SMS_API_KEY in .env');
      return;
    }
    
    this.isConfigured = true;
    console.log('✅ SMS Service configured');
  }

  async sendSMS(phone, message) {
    if (!this.isConfigured) {
      return { success: false, error: 'SMS not configured' };
    }

    try {
      const cleanPhone = this.cleanPhoneNumber(phone);
      
      if (!this.isValidPhoneNumber(cleanPhone)) {
        return { success: false, error: 'Invalid phone' };
      }

      const postData = {
        senderid: this.senderId,
        destinations: [{
          destination: cleanPhone,
          message: message,
          msgid: `MSG${Date.now()}`,
          smstype: 'text'
        }]
      };

      const response = await fetch(`${this.baseUrl}/sms/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'API-KEY': this.apiKey,
          'USERNAME': this.username
        },
        body: JSON.stringify(postData)
      });

      const data = await response.json();

      if (data.status === 'ACCEPTD' || data.status === 'SUCCESS') {
        console.log(`✅ SMS sent to ${cleanPhone}`);
        return { success: true };
      }
      return { success: false, error: 'SMS failed' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  cleanPhoneNumber(phone) {
    if (!phone) return '';
    let cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('233')) return cleaned;
    if (cleaned.startsWith('0')) return '233' + cleaned.substring(1);
    if (cleaned.length === 9) return '233' + cleaned;
    return cleaned;
  }

  isValidPhoneNumber(phone) {
    return /^233[0-9]{9}$/.test(phone);
  }
}

export default new SMSService();