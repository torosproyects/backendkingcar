// routes/verificationRoutes.js
import { Router } from 'express';
import { createVerificationRequestCtrl } from '../controllers/verificationUController.js';
import { authenticate } from '../middleware/auth.js'; 
import {verificationUpload } from '../config/upload.js'; 

const router = Router();

router.post(
  '/verify-profile',
  authenticate, 
  verificationUpload.single('documentPhoto'), 
  createVerificationRequestCtrl 
);

export default router;
