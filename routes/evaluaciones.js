import express from 'express';
import evaluacionController from '../controllers/evaluacionController.js';
import { authenticate } from '../middleware/auth.js';
import { validateEvaluacion } from '../middleware/validateTaller.js';

const router = express.Router();

// Rutas públicas
router.get('/', evaluacionController.getAllEvaluaciones);

// Rutas protegidas
router.get('/mis-evaluaciones', authenticate, evaluacionController.getMyEvaluaciones);
router.get('/:id', authenticate, evaluacionController.getEvaluacionById);
router.get('/:id/reparaciones', authenticate, evaluacionController.getEvaluacionReparaciones);
router.post('/', authenticate, validateEvaluacion.create, evaluacionController.createEvaluacion);
router.put('/:id', authenticate, validateEvaluacion.update, evaluacionController.updateEvaluacion);
router.put('/:id/completar', authenticate, validateEvaluacion.complete, evaluacionController.completeEvaluacion);
router.put('/:id/iniciar', authenticate, evaluacionController.startEvaluacion);
router.delete('/:id', authenticate, evaluacionController.deleteEvaluacion);

export default router;
