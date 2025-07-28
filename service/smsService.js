import PhoneVerification from '../models/PhoneVerification.js';
import { logger } from '../utils/logger.js';
import twilio from 'twilio';

// Configura Twilio (o tu proveedor SMS)
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

class SMSService {
  static async sendVerificationCode(phone) {
    try {
      // Verificar rate limiting
      const canSend = await PhoneVerification.canSendNewCode(phone);
      if (!canSend) {
        throw new Error('Debes esperar antes de solicitar un nuevo código');
      }

      // Generar código de 6 dígitos
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Enviar SMS (simulado en desarrollo)
      /*if (process.env.NODE_ENV !== 'production') {
        logger.info(`Código de verificación para ${phone}: ${code}`);
      } else {*/
       console.log(phone,code)
        await twilioClient.messages.create({
          body: `Tu código de verificación es: ${code}`,
          from: process.env.TWILIO_PHONE_NUMBER,
          to: phone
        });
      

      // Guardar en base de datos
      await PhoneVerification.createVerificationCode(phone, code);

      return true;
    } catch (error) {
      logger.error('Error sending verification SMS:', error);
      throw error;
    }
  }

  static async verifyPhoneCode(phone, code) {
    try {
      return await PhoneVerification.verifyCode(phone, code);
    } catch (error) {
      logger.error('Error verifying phone code:', error);
      throw error;
    }
  }

  static async getRemainingAttempts(phone) {
    try {
      return await PhoneVerification.getRemainingAttempts(phone);
    } catch (error) {
      logger.error('Error getting remaining attempts:', error);
      return 5; // Valor por defecto si hay error
    }
  }
}

export default SMSService;