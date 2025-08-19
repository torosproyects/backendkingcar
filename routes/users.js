import express from 'express'
import userController from '../controllers/userController.js'
import { authenticate, isVerified } from '../middleware/auth.js'
import { changePasswordValidation } from '../middleware/validator.js'

const router = express.Router()


router.put("/profile",authenticate, isVerified ,userController.updateProfile)
router.put("/change-password",authenticate, isVerified, changePasswordValidation, userController.changePassword)


export default router;
