import Evaluacion from '../models/Evaluacion.js';
import { logger } from '../utils/logger.js';

// GET /api/evaluaciones - Obtener todas las evaluaciones
export const getAllEvaluaciones = async (req, res, next) => {
  try {
    const filters = {
      taller_id: req.query.taller_id,
      usuario_solicitante: req.query.usuario_solicitante,
      estado: req.query.estado,
      fecha_desde: req.query.fecha_desde,
      fecha_hasta: req.query.fecha_hasta,
      limit: parseInt(req.query.limit) || 50,
      offset: parseInt(req.query.offset) || 0
    };

    const evaluaciones = await Evaluacion.getAll(filters);
    
    res.status(200).json({
      success: true,
      data: evaluaciones,
      count: evaluaciones.length,
      filters
    });
  } catch (error) {
    logger.error('Error en getAllEvaluaciones:', error);
    next(error);
  }
};

// GET /api/evaluaciones/:id - Obtener evaluación por ID
export const getEvaluacionById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const usuarioDocumento = req.user.documento || req.user.id;

    // Verificar acceso
    const canAccess = await Evaluacion.canAccess(id, usuarioDocumento);
    if (!canAccess) {
      return res.status(403).json({
        success: false,
        error: 'No tienes permisos para acceder a esta evaluación'
      });
    }

    const evaluacion = await Evaluacion.getById(id);

    if (!evaluacion) {
      return res.status(404).json({
        success: false,
        error: 'Evaluación no encontrada'
      });
    }

    res.status(200).json({
      success: true,
      data: evaluacion
    });
  } catch (error) {
    logger.error('Error en getEvaluacionById:', error);
    next(error);
  }
};

// POST /api/evaluaciones - Crear nueva evaluación
export const createEvaluacion = async (req, res, next) => {
  try {
    const {
      taller_id, carro_id, tipo_evaluacion, fecha_evaluacion, hora_evaluacion,
      kilometraje_actual, nivel_aceite, nivel_refrigerante, estado_frenos,
      estado_neumaticos, estado_bateria, estado_motor, observaciones_generales,
      problemas_detectados, recomendaciones_urgentes, costo_estimado
    } = req.body;

    const usuarioDocumento = req.user.documento || req.user.id;

    const evaluacionData = {
      taller_id, carro_id, usuario_solicitante: usuarioDocumento, tipo_evaluacion,
      fecha_evaluacion, hora_evaluacion, kilometraje_actual,
      nivel_aceite, nivel_refrigerante, estado_frenos,
      estado_neumaticos, estado_bateria, estado_motor,
      observaciones_generales, problemas_detectados, recomendaciones_urgentes,
      costo_estimado
    };

    const evaluacionId = await Evaluacion.create(evaluacionData);
    const nuevaEvaluacion = await Evaluacion.getById(evaluacionId);

    res.status(201).json({
      success: true,
      message: 'Evaluación creada exitosamente',
      data: nuevaEvaluacion
    });
  } catch (error) {
    logger.error('Error en createEvaluacion:', error);
    next(error);
  }
};

// PUT /api/evaluaciones/:id - Actualizar evaluación
export const updateEvaluacion = async (req, res, next) => {
  try {
    const { id } = req.params;
    const usuarioDocumento = req.user.documento || req.user.id;

    // Verificar acceso
    const canAccess = await Evaluacion.canAccess(id, usuarioDocumento);
    if (!canAccess) {
      return res.status(403).json({
        success: false,
        error: 'No tienes permisos para actualizar esta evaluación'
      });
    }

    const evaluacionData = req.body;
    const updated = await Evaluacion.update(id, evaluacionData);

    if (!updated) {
      return res.status(404).json({
        success: false,
        error: 'Evaluación no encontrada'
      });
    }

    const evaluacionActualizada = await Evaluacion.getById(id);

    res.status(200).json({
      success: true,
      message: 'Evaluación actualizada exitosamente',
      data: evaluacionActualizada
    });
  } catch (error) {
    logger.error('Error en updateEvaluacion:', error);
    next(error);
  }
};

// DELETE /api/evaluaciones/:id - Eliminar evaluación
export const deleteEvaluacion = async (req, res, next) => {
  try {
    const { id } = req.params;
    const usuarioDocumento = req.user.documento || req.user.id;

    // Verificar acceso
    const canAccess = await Evaluacion.canAccess(id, usuarioDocumento);
    if (!canAccess) {
      return res.status(403).json({
        success: false,
        error: 'No tienes permisos para eliminar esta evaluación'
      });
    }

    const deleted = await Evaluacion.delete(id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'Evaluación no encontrada'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Evaluación eliminada exitosamente'
    });
  } catch (error) {
    logger.error('Error en deleteEvaluacion:', error);
    next(error);
  }
};

// GET /api/evaluaciones/mis-evaluaciones - Obtener evaluaciones del usuario
export const getMyEvaluaciones = async (req, res, next) => {
  try {
    const usuarioDocumento = req.user.documento || req.user.id;
    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;

    const evaluaciones = await Evaluacion.getByUser(usuarioDocumento, limit, offset);

    res.status(200).json({
      success: true,
      data: evaluaciones,
      count: evaluaciones.length
    });
  } catch (error) {
    logger.error('Error en getMyEvaluaciones:', error);
    next(error);
  }
};

// PUT /api/evaluaciones/:id/completar - Completar evaluación
export const completeEvaluacion = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { calificacion_servicio, comentario_cliente } = req.body;
    const usuarioDocumento = req.user.documento || req.user.id;

    // Verificar acceso (solo el cliente puede completar)
    const evaluacion = await Evaluacion.getById(id);
    if (!evaluacion) {
      return res.status(404).json({
        success: false,
        error: 'Evaluación no encontrada'
      });
    }

    if (evaluacion.usuario_solicitante !== usuarioDocumento) {
      return res.status(403).json({
        success: false,
        error: 'Solo el cliente puede completar la evaluación'
      });
    }

    if (evaluacion.estado !== 'en_proceso') {
      return res.status(400).json({
        success: false,
        error: 'La evaluación debe estar en proceso para completarla'
      });
    }

    const completed = await Evaluacion.complete(id, calificacion_servicio, comentario_cliente);

    if (!completed) {
      return res.status(400).json({
        success: false,
        error: 'No se pudo completar la evaluación'
      });
    }

    const evaluacionCompletada = await Evaluacion.getById(id);

    res.status(200).json({
      success: true,
      message: 'Evaluación completada exitosamente',
      data: evaluacionCompletada
    });
  } catch (error) {
    logger.error('Error en completeEvaluacion:', error);
    next(error);
  }
};

// PUT /api/evaluaciones/:id/iniciar - Iniciar evaluación (para talleres)
export const startEvaluacion = async (req, res, next) => {
  try {
    const { id } = req.params;
    const usuarioDocumento = req.user.documento || req.user.id;

    // Verificar acceso (solo el taller puede iniciar)
    const evaluacion = await Evaluacion.getById(id);
    if (!evaluacion) {
      return res.status(404).json({
        success: false,
        error: 'Evaluación no encontrada'
      });
    }

    // Verificar si el usuario es propietario del taller
    const Taller = (await import('../models/Taller.js')).default;
    const isOwner = await Taller.isOwner(evaluacion.taller_id, usuarioDocumento);
    if (!isOwner) {
      return res.status(403).json({
        success: false,
        error: 'Solo el propietario del taller puede iniciar la evaluación'
      });
    }

    if (evaluacion.estado !== 'pendiente') {
      return res.status(400).json({
        success: false,
        error: 'La evaluación debe estar pendiente para iniciarla'
      });
    }

    const started = await Evaluacion.update(id, { estado: 'en_proceso' });

    if (!started) {
      return res.status(400).json({
        success: false,
        error: 'No se pudo iniciar la evaluación'
      });
    }

    const evaluacionIniciada = await Evaluacion.getById(id);

    res.status(200).json({
      success: true,
      message: 'Evaluación iniciada exitosamente',
      data: evaluacionIniciada
    });
  } catch (error) {
    logger.error('Error en startEvaluacion:', error);
    next(error);
  }
};

// GET /api/evaluaciones/:id/reparaciones - Obtener reparaciones de la evaluación
export const getEvaluacionReparaciones = async (req, res, next) => {
  try {
    const { id } = req.params;
    const usuarioDocumento = req.user.documento || req.user.id;

    // Verificar acceso
    const canAccess = await Evaluacion.canAccess(id, usuarioDocumento);
    if (!canAccess) {
      return res.status(403).json({
        success: false,
        error: 'No tienes permisos para acceder a esta evaluación'
      });
    }

    // Importar Reparacion aquí para evitar dependencias circulares
    const Reparacion = (await import('../models/Reparacion.js')).default;
    const reparaciones = await Reparacion.getByEvaluacion(id);

    res.status(200).json({
      success: true,
      data: reparaciones,
      count: reparaciones.length,
      evaluacion_id: id
    });
  } catch (error) {
    logger.error('Error en getEvaluacionReparaciones:', error);
    next(error);
  }
};

// POST /api/taller/evaluaciones/entrada - Crear evaluación de entrada (específico del frontend)
export const createEvaluacionEntrada = async (req, res, next) => {
  try {
    const {
      carroId, kilometrajeEntrada, estadoExterior, estadoInterior,
      observacionesGenerales, tecnicoResponsable, fotosEntrada
    } = req.body;

    const usuarioDocumento = req.user.documento || req.user.id;

    // Crear evaluación básica primero
    const evaluacionData = {
      taller_id: req.body.tallerId, // Se debe pasar desde el frontend
      carro_id: carroId,
      usuario_solicitante: usuarioDocumento,
      tipo_evaluacion: 'diagnostica',
      fecha_evaluacion: new Date().toISOString().split('T')[0],
      hora_evaluacion: new Date().toTimeString().split(' ')[0].substring(0, 5),
      kilometraje_actual: kilometrajeEntrada,
      observaciones_generales: observacionesGenerales,
      estado: 'en_proceso'
    };

    const evaluacionId = await Evaluacion.create(evaluacionData);

    // Aquí podrías procesar las fotos si es necesario
    // Por ahora solo guardamos la información básica

    const nuevaEvaluacion = await Evaluacion.getById(evaluacionId);

    res.status(201).json({
      success: true,
      message: 'Evaluación de entrada creada exitosamente',
      data: nuevaEvaluacion
    });
  } catch (error) {
    logger.error('Error en createEvaluacionEntrada:', error);
    next(error);
  }
};

// PUT /api/taller/evaluaciones/pruebas - Actualizar pruebas técnicas (específico del frontend)
export const updatePruebasTecnicas = async (req, res, next) => {
  try {
    const {
      evaluacionId, motor, frenos, suspension, direccion, luces,
      neumaticos, sistemaElectrico, transmision, aireAcondicionado,
      liquidos, observacionesTecnicas, fotosPruebas
    } = req.body;

    const usuarioDocumento = req.user.documento || req.user.id;

    // Verificar acceso
    const canAccess = await Evaluacion.canAccess(evaluacionId, usuarioDocumento);
    if (!canAccess) {
      return res.status(403).json({
        success: false,
        error: 'No tienes permisos para actualizar esta evaluación'
      });
    }

    // Crear objeto con los datos de las pruebas técnicas
    const pruebasData = {
      motor, frenos, suspension, direccion, luces,
      neumaticos, sistemaElectrico, transmision, aireAcondicionado,
      liquidos, observacionesTecnicas
    };

    // Actualizar la evaluación con los datos de las pruebas
    const updated = await Evaluacion.update(evaluacionId, {
      problemas_detectados: JSON.stringify(pruebasData),
      observaciones_generales: observacionesTecnicas,
      estado: 'en_proceso'
    });

    if (!updated) {
      return res.status(404).json({
        success: false,
        error: 'Evaluación no encontrada'
      });
    }

    const evaluacionActualizada = await Evaluacion.getById(evaluacionId);

    res.status(200).json({
      success: true,
      message: 'Pruebas técnicas actualizadas exitosamente',
      data: evaluacionActualizada
    });
  } catch (error) {
    logger.error('Error en updatePruebasTecnicas:', error);
    next(error);
  }
};

// POST /api/taller/evaluaciones/final - Crear evaluación final (específico del frontend)
export const createEvaluacionFinal = async (req, res, next) => {
  try {
    const {
      evaluacionId, resumenHallazgos, prioridadReparaciones,
      tiempoEstimadoReparacion, observacionesFinales,
      tecnicoEvaluador, reparacionesRecomendadas, fotosFinales
    } = req.body;

    const usuarioDocumento = req.user.documento || req.user.id;

    // Verificar acceso
    const canAccess = await Evaluacion.canAccess(evaluacionId, usuarioDocumento);
    if (!canAccess) {
      return res.status(403).json({
        success: false,
        error: 'No tienes permisos para completar esta evaluación'
      });
    }

    // Actualizar la evaluación con los datos finales
    const updated = await Evaluacion.update(evaluacionId, {
      observaciones_generales: observacionesFinales,
      recomendaciones_urgentes: JSON.stringify(reparacionesRecomendadas),
      costo_estimado: tiempoEstimadoReparacion,
      estado: 'completada'
    });

    if (!updated) {
      return res.status(404).json({
        success: false,
        error: 'Evaluación no encontrada'
      });
    }

    // Crear reparaciones recomendadas si se proporcionan
    if (reparacionesRecomendadas && reparacionesRecomendadas.length > 0) {
      const Reparacion = (await import('../models/Reparacion.js')).default;
      await Reparacion.createMultiple(evaluacionId, reparacionesRecomendadas);
    }

    const evaluacionCompletada = await Evaluacion.getById(evaluacionId);

    res.status(200).json({
      success: true,
      message: 'Evaluación final completada exitosamente',
      data: evaluacionCompletada
    });
  } catch (error) {
    logger.error('Error en createEvaluacionFinal:', error);
    next(error);
  }
};

// GET /api/taller/evaluaciones/:tallerId - Obtener evaluaciones por taller (específico del frontend)
export const getTallerEvaluaciones = async (req, res, next) => {
  try {
    const { tallerId } = req.params;
    const evaluaciones = await Evaluacion.getByTaller(tallerId);

    res.status(200).json({
      success: true,
      data: evaluaciones,
      count: evaluaciones.length,
      taller_id: tallerId
    });
  } catch (error) {
    logger.error('Error en getTallerEvaluaciones:', error);
    next(error);
  }
};

export default {
  getAllEvaluaciones,
  getEvaluacionById,
  createEvaluacion,
  updateEvaluacion,
  deleteEvaluacion,
  getMyEvaluaciones,
  completeEvaluacion,
  startEvaluacion,
  getEvaluacionReparaciones,
  createEvaluacionEntrada,
  updatePruebasTecnicas,
  createEvaluacionFinal,
  getTallerEvaluaciones
};
