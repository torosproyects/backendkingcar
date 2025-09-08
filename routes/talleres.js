import express from 'express';
import tallerController from '../controllers/tallerController.js';
import { authenticate } from '../middleware/auth.js';
import { validateTaller } from '../middleware/validateTaller.js';

const router = express.Router();

// Rutas públicas
router.get('/', tallerController.getAllTalleres);
router.get('/:id', tallerController.getTallerById);
router.get('/:id/evaluaciones', tallerController.getTallerEvaluaciones);
router.get('/:id/horarios', tallerController.getTallerHorarios);
router.get('/:id/citas', tallerController.getTallerCitas);
router.get('/:id/disponibilidad', tallerController.getTallerDisponibilidad);

// Rutas protegidas
router.post('/', authenticate, validateTaller.create, tallerController.createTaller);
router.put('/:id', authenticate, validateTaller.update, tallerController.updateTaller);
router.delete('/:id', authenticate, tallerController.deleteTaller);
router.get('/mis-talleres', authenticate, tallerController.getMyTalleres);

export default router;
