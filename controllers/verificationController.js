import SMSService from '../service/smsService.js';
import { logger } from '../utils/logger.js';
import { rateLimiter } from '../middleware/rateLimitersms.js';

class VerificationController {
  static async sendVerificationCode(req, res) {
    try {
      const { phone } = req.body;
      
      if (!phone) {
        return res.status(400).json({ error: 'Número de teléfono requerido' });
      }

      await SMSService.sendVerificationCode(phone);
      
      res.json({ 
        success: true,
        message: 'Código de verificación enviado'
      });
    } catch (error) {
      logger.error('Error in sendVerificationCode:', error);
      res.status(400).json({ 
        error: error.message || 'Error al enviar código de verificación' 
      });
    }
  }

  static async verifyCode(req, res) {
    try {
      const { phone, code } = req.body;
      
      if (!phone || !code) {
        return res.status(400).json({ error: 'Teléfono y código requeridos' });
      }

      const isValid = await SMSService.verifyPhoneCode(phone, code);
      
      if (!isValid) {
        const remainingAttempts = await SMSService.getRemainingAttempts(phone);
        return res.status(400).json({ 
          error: 'Verificación fallida',
          remainingAttempts
        });
      }

      res.json({ 
        success: true,
        message: 'Teléfono verificado exitosamente'
      });
    } catch (error) {
      logger.error('Error in verifyCode:', error);
      res.status(400).json({ 
        error: 'Error al verificar el código' 
      });
    }
  }
}

export default VerificationController;