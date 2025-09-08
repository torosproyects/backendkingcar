import express from 'express';
import tallerController from '../controllers/tallerController.js';
import evaluacionController from '../controllers/evaluacionController.js';
import horarioController from '../controllers/horarioController.js';
import citaController from '../controllers/citaController.js';
import { authenticate } from '../middleware/auth.js';
import { validateTaller, validateEvaluacion, validateHorario, validateCita } from '../middleware/validateTaller.js';

const router = express.Router();

// =====================================================
// EVALUACIONES - Endpoints específicos del frontend
// =====================================================

// GET /api/taller/evaluaciones/:tallerId - Obtener evaluaciones por taller
router.get('/evaluaciones/:tallerId', evaluacionController.getTallerEvaluaciones);

// GET /api/taller/evaluaciones/:id - Obtener evaluación por ID
router.get('/evaluaciones/:id', authenticate, evaluacionController.getEvaluacionById);

// POST /api/taller/evaluaciones/entrada - Crear evaluación de entrada
router.post('/evaluaciones/entrada', authenticate, validateEvaluacion.createEntrada, evaluacionController.createEvaluacionEntrada);

// PUT /api/taller/evaluaciones/pruebas - Actualizar pruebas técnicas
router.put('/evaluaciones/pruebas', authenticate, validateEvaluacion.updatePruebas, evaluacionController.updatePruebasTecnicas);

// POST /api/taller/evaluaciones/final - Crear evaluación final
router.post('/evaluaciones/final', authenticate, validateEvaluacion.createFinal, evaluacionController.createEvaluacionFinal);

// =====================================================
// HORARIOS - Endpoints específicos del frontend
// =====================================================

// GET /api/taller/horarios/:tallerId - Obtener horarios por taller
router.get('/horarios/:tallerId', horarioController.getHorariosByTaller);

// POST /api/taller/horarios - Crear horario
router.post('/horarios', authenticate, validateHorario.create, horarioController.createHorario);

// PUT /api/taller/horarios/:id - Actualizar horario
router.put('/horarios/:id', authenticate, validateHorario.update, horarioController.updateHorario);

// DELETE /api/taller/horarios/:id - Eliminar horario
router.delete('/horarios/:id', authenticate, horarioController.deleteHorario);

// GET /api/taller/horarios/:tallerId/mes/:año/:mes - Horarios por mes
router.get('/horarios/:tallerId/mes/:año/:mes', horarioController.getHorariosByMonth);

// GET /api/taller/horarios/:tallerId/dia/:fecha - Horario por día
router.get('/horarios/:tallerId/dia/:fecha', horarioController.getHorariosByDay);

// POST /api/taller/horarios/:tallerId/dia - Crear horario del día
router.post('/horarios/:tallerId/dia', authenticate, validateHorario.createDay, horarioController.createDaySchedule);

// PUT /api/taller/horarios/:tallerId/dia/:fecha - Actualizar horario del día
router.put('/horarios/:tallerId/dia/:fecha', authenticate, validateHorario.updateDay, horarioController.updateDaySchedule);

// DELETE /api/taller/horarios/:tallerId/dia/:fecha - Eliminar horario del día
router.delete('/horarios/:tallerId/dia/:fecha', authenticate, horarioController.deleteDaySchedule);

// POST /api/taller/horarios/:tallerId/copiar - Copiar horarios
router.post('/horarios/:tallerId/copiar', authenticate, validateHorario.copyDay, horarioController.copyDaySchedule);

// =====================================================
// CITAS - Endpoints específicos del frontend
// =====================================================

// GET /api/taller/citas/:tallerId - Obtener citas por taller
router.get('/citas/:tallerId', citaController.getCitasByTaller);

// GET /api/taller/citas/:tallerId/hoy - Obtener citas de hoy
router.get('/citas/:tallerId/hoy', citaController.getCitasHoy);

// PUT /api/taller/citas/:id/estado - Actualizar estado de cita
router.put('/citas/:id/estado', authenticate, validateCita.updateEstado, citaController.updateEstadoCita);

export default router;
