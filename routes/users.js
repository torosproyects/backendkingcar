import express from 'express'
import userController from '../controllers/userController.js'
import { authenticate, isVerified } from '../middleware/auth.js'
import { changePasswordValidation } from '../middleware/validator.js'

const router = express.Router()
// Todas las rutas requieren autenticación
router.use(authenticate)
router.use(isVerified)

router.put("/profile", userController.updateProfile)
router.put("/change-password", changePasswordValidation, userController.changePassword)

export default router;
