import express from 'express';
import reparacionController from '../controllers/reparacionController.js';
import { authenticate } from '../middleware/auth.js';
import { validateReparacion } from '../middleware/validateTaller.js';

const router = express.Router();

// Rutas públicas
router.get('/', reparacionController.getAllReparaciones);
router.get('/evaluacion/:evaluacionId', reparacionController.getReparacionesByEvaluacion);
router.get('/taller/:tallerId', reparacionController.getReparacionesByTaller);

// Rutas protegidas
router.get('/mis-reparaciones', authenticate, reparacionController.getMyReparaciones);
router.get('/taller/:tallerId/estadisticas', authenticate, reparacionController.getTallerStats);
router.get('/:id', authenticate, reparacionController.getReparacionById);
router.post('/', authenticate, validateReparacion.create, reparacionController.createReparacion);
router.post('/multiples', authenticate, validateReparacion.createMultiple, reparacionController.createMultipleReparaciones);
router.put('/:id', authenticate, validateReparacion.update, reparacionController.updateReparacion);
router.put('/:id/aceptar', authenticate, validateReparacion.accept, reparacionController.acceptReparacion);
router.put('/:id/rechazar', authenticate, validateReparacion.reject, reparacionController.rejectReparacion);
router.put('/:id/completar', authenticate, validateReparacion.complete, reparacionController.completeReparacion);
router.delete('/:id', authenticate, reparacionController.deleteReparacion);

export default router;
