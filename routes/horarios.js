import express from 'express';
import horarioController from '../controllers/horarioController.js';
import { authenticate } from '../middleware/auth.js';
import { validateHorario } from '../middleware/validateTaller.js';

const router = express.Router();

// Rutas públicas
router.get('/', horarioController.getAllHorarios);
router.get('/taller/:tallerId', horarioController.getHorariosByTaller);
router.get('/:tallerId/disponibilidad', horarioController.getDisponibilidad);
router.get('/:tallerId/mes/:año/:mes', horarioController.getHorariosByMonth);
router.get('/:tallerId/dia/:fecha', horarioController.getHorariosByDay);

// Rutas protegidas
router.get('/:id', authenticate, horarioController.getHorarioById);
router.post('/', authenticate, validateHorario.create, horarioController.createHorario);
router.post('/semanal', authenticate, validateHorario.createWeekly, horarioController.createHorarioSemanal);
router.post('/:tallerId/dia', authenticate, validateHorario.createDay, horarioController.createDaySchedule);
router.post('/:tallerId/copiar', authenticate, validateHorario.copyDay, horarioController.copyDaySchedule);
router.put('/:id', authenticate, validateHorario.update, horarioController.updateHorario);
router.put('/semanal/:tallerId', authenticate, validateHorario.updateWeekly, horarioController.updateHorarioSemanal);
router.put('/:tallerId/dia/:fecha', authenticate, validateHorario.updateDay, horarioController.updateDaySchedule);
router.delete('/:id', authenticate, horarioController.deleteHorario);
router.delete('/:tallerId/dia/:fecha', authenticate, horarioController.deleteDaySchedule);

export default router;
