import express from 'express';
import citaController from '../controllers/citaController.js';
import { authenticate } from '../middleware/auth.js';
import { validateCita } from '../middleware/validateTaller.js';

const router = express.Router();

// Rutas públicas
router.get('/', citaController.getAllCitas);
router.get('/taller/:tallerId', citaController.getCitasByTaller);
router.get('/proximas', citaController.getCitasProximas);

// Rutas protegidas
router.get('/mis-citas', authenticate, citaController.getMyCitas);
router.get('/:id', authenticate, citaController.getCitaById);
router.post('/', authenticate, validateCita.create, citaController.createCita);
router.put('/:id', authenticate, validateCita.update, citaController.updateCita);
router.put('/:id/confirmar', authenticate, citaController.confirmCita);
router.put('/:id/cancelar', authenticate, validateCita.cancel, citaController.cancelCita);
router.put('/:id/completar', authenticate, validateCita.complete, citaController.completeCita);
router.put('/:id/calificar', authenticate, validateCita.rate, citaController.rateCita);
router.delete('/:id', authenticate, citaController.deleteCita);

export default router;
