import express from 'express';
import VerificationController from '../controllers/verificationController.js';
import { rateLimiter } from '../middleware/rateLimitersms.js';

const router = express.Router();

// Limitar a 3 solicitudes por 10 minutos
router.post('/send-code', 
  rateLimiter(3, 10 * 60 * 1000), 
  VerificationController.sendVerificationCode
);

router.post('/verify-code', VerificationController.verifyCode);

export default router;