import express from 'express'
import authController from '../controllers/authController.js'
import { authenticate } from '../middleware/auth.js'
import { registerValidation, loginValidation, verifyEmailValidation } from '../middleware/validator.js'
import { loginLimiter, registerLimiter, verifyEmailLimiter } from '../middleware/rateLimiter.js'

const router = express.Router()
// Rutas públicas
router.post("/pre-register", registerLimiter, registerValidation, authController.preRegister) // Cambiado
router.post("/verify-and-register", verifyEmailLimiter, verifyEmailValidation, authController.verifyAndRegister) // Cambiado
router.post("/login", loginLimiter, loginValidation, authController.login)
router.post("/resend-verification", verifyEmailLimiter, authController.resendVerificationCode)
router.post("/logout", authController.logout)

// Rutas protegidas
router.get("/profile", authenticate, authController.getProfile)

export default router;