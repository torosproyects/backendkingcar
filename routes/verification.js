import express from 'express';
import { authenticate, isAdminDB } from '../middleware/auth.js';
import { verificationSubmitUpload } from '../config/upload.js';
import { validateVerificationSubmission } from '../middleware/validateVerification.js';
import {
  submitVerification,
  getVerificationStatus,
  getMyVerification,
  downloadArchivo,
  getPendingVerifications,
  getVerificationById,
  updateVerificationStatus
} from '../controllers/verificationController.js';

const router = express.Router();

// POST /api/verification/submit - Enviar solicitud de verificación
router.post(
  '/submit',
  authenticate,
  verificationSubmitUpload.fields([
    { name: 'reciboServicio', maxCount: 1 },
    { name: 'certificadoBancario', maxCount: 1 },
    { name: 'altaAutonomo', maxCount: 1 },
    { name: 'reta', maxCount: 1 },
    { name: 'escriturasConstitucion', maxCount: 1 },
    { name: 'iaeAno', maxCount: 1 },
    { name: 'tarjetaCif', maxCount: 1 },
    { name: 'certificadoTitularidadBancaria', maxCount: 1 }
  ]),
  validateVerificationSubmission,
  submitVerification
);

// GET /api/verification/status/:id - Obtener estado de verificación específica
router.get(
  '/status/:id',
  authenticate,
  getVerificationStatus
);

// GET /api/verification/my-verification - Obtener mi verificación
router.get(
  '/my-verification',
  authenticate,
  getMyVerification
);

// GET /api/verification/download/:archivoId - Descargar archivo
router.get(
  '/download/:archivoId',
  authenticate,
  downloadArchivo
);

// ===== RUTAS DE ADMINISTRADOR =====

// GET /api/verification/pending - Obtener todas las verificaciones pendientes (Solo Admin)
router.get(
  '/pending',
  authenticate,
  isAdminDB,
  getPendingVerifications
);

// GET /api/verification/:id - Obtener una verificación específica con todos sus documentos (Solo Admin)
router.get(
  '/:id',
  authenticate,
  isAdminDB,
  getVerificationById
);

// PUT /api/verification/:id/status - Actualizar estado de verificación (Solo Admin)
router.put(
  '/:id/status',
  authenticate,
  isAdminDB,
  updateVerificationStatus
);

export default router;


