import { query } from '../config/database.js';
import { logger } from '../utils/logger.js';

class PhoneVerification {
  static async createVerificationCode(phone, code) {
    try {
      // Código expira en 10 minutos
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); 
      
      const result = await query(
        `INSERT INTO phone_verifications 
        (phone_number, verification_code, expires_at, attempts) 
        VALUES (?, ?, ?, 0) 
        ON DUPLICATE KEY UPDATE 
        verification_code = ?, expires_at = ?, attempts = 0, created_at = NOW()`,
        [phone, code, expiresAt, code, expiresAt]
      );
      
      return result.insertId || result.affectedRows > 0;
    } catch (error) {
      logger.error('Error creating verification code:', error);
      throw error;
    }
  }

  static async verifyCode(phone, code) {
    try {
      const [verification] = await query(
        `SELECT * FROM phone_verifications 
        WHERE phone_number = ? AND verification_code = ? 
        AND expires_at > NOW() AND attempts < 5`,
        [phone, code]
      );

      if (!verification) {
        // Incrementar intentos fallidos
        await query(
          `UPDATE phone_verifications 
          SET attempts = attempts + 1 
          WHERE phone_number = ?`,
          [phone]
        );
        return false;
      }

      // Eliminar el código después de verificación exitosa
      await query(
        `DELETE FROM phone_verifications WHERE phone_number = ?`,
        [phone]
      );

      return true;
    } catch (error) {
      logger.error('Error verifying code:', error);
      throw error;
    }
  }

  static async canSendNewCode(phone) {
    try {
      const [verification] = await query(
        `SELECT created_at FROM phone_verifications 
        WHERE phone_number = ? AND created_at > DATE_SUB(NOW(), INTERVAL 1 MINUTE)`,
        [phone]
      );
      return !verification;
    } catch (error) {
      logger.error('Error checking code send limit:', error);
      throw error;
    }
  }

  static async getRemainingAttempts(phone) {
    try {
      const [verification] = await query(
        `SELECT attempts FROM phone_verifications 
        WHERE phone_number = ?`,
        [phone]
      );
      return verification ? 5 - verification.attempts : 5;
    } catch (error) {
      logger.error('Error getting remaining attempts:', error);
      throw error;
    }
  }
}

export default PhoneVerification;