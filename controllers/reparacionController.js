import Reparacion from '../models/Reparacion.js';
import { logger } from '../utils/logger.js';

// GET /api/reparaciones - Obtener todas las reparaciones
export const getAllReparaciones = async (req, res, next) => {
  try {
    const filters = {
      evaluacion_id: req.query.evaluacion_id,
      tipo_reparacion: req.query.tipo_reparacion,
      prioridad: req.query.prioridad,
      estado: req.query.estado,
      componente: req.query.componente,
      limit: parseInt(req.query.limit) || 50,
      offset: parseInt(req.query.offset) || 0
    };

    const reparaciones = await Reparacion.getAll(filters);
    
    res.status(200).json({
      success: true,
      data: reparaciones,
      count: reparaciones.length,
      filters
    });
  } catch (error) {
    logger.error('Error en getAllReparaciones:', error);
    next(error);
  }
};

// GET /api/reparaciones/:id - Obtener reparación por ID
export const getReparacionById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const usuarioDocumento = req.user.documento || req.user.id;

    // Verificar acceso
    const canAccess = await Reparacion.canAccess(id, usuarioDocumento);
    if (!canAccess) {
      return res.status(403).json({
        success: false,
        error: 'No tienes permisos para acceder a esta reparación'
      });
    }

    const reparacion = await Reparacion.getById(id);

    if (!reparacion) {
      return res.status(404).json({
        success: false,
        error: 'Reparación no encontrada'
      });
    }

    res.status(200).json({
      success: true,
      data: reparacion
    });
  } catch (error) {
    logger.error('Error en getReparacionById:', error);
    next(error);
  }
};

// POST /api/reparaciones - Crear nueva reparación recomendada
export const createReparacion = async (req, res, next) => {
  try {
    const {
      evaluacion_id, tipo_reparacion, componente,
      descripcion_problema, descripcion_solucion, prioridad,
      costo_estimado, tiempo_estimado_horas, kilometraje_recomendado,
      proveedor_recomendado, garantia_meses, notas_adicionales
    } = req.body;

    const usuarioDocumento = req.user.documento || req.user.id;

    // Verificar acceso a la evaluación
    const Evaluacion = (await import('../models/Evaluacion.js')).default;
    const canAccessEvaluacion = await Evaluacion.canAccess(evaluacion_id, usuarioDocumento);
    if (!canAccessEvaluacion) {
      return res.status(403).json({
        success: false,
        error: 'No tienes permisos para crear reparaciones en esta evaluación'
      });
    }

    const reparacionData = {
      evaluacion_id, tipo_reparacion, componente,
      descripcion_problema, descripcion_solucion, prioridad,
      costo_estimado, tiempo_estimado_horas, kilometraje_recomendado,
      proveedor_recomendado, garantia_meses, notas_adicionales
    };

    const reparacionId = await Reparacion.create(reparacionData);
    const nuevaReparacion = await Reparacion.getById(reparacionId);

    res.status(201).json({
      success: true,
      message: 'Reparación recomendada creada exitosamente',
      data: nuevaReparacion
    });
  } catch (error) {
    logger.error('Error en createReparacion:', error);
    next(error);
  }
};

// PUT /api/reparaciones/:id - Actualizar reparación
export const updateReparacion = async (req, res, next) => {
  try {
    const { id } = req.params;
    const usuarioDocumento = req.user.documento || req.user.id;

    // Verificar acceso
    const canAccess = await Reparacion.canAccess(id, usuarioDocumento);
    if (!canAccess) {
      return res.status(403).json({
        success: false,
        error: 'No tienes permisos para actualizar esta reparación'
      });
    }

    const reparacionData = req.body;
    const updated = await Reparacion.update(id, reparacionData);

    if (!updated) {
      return res.status(404).json({
        success: false,
        error: 'Reparación no encontrada'
      });
    }

    const reparacionActualizada = await Reparacion.getById(id);

    res.status(200).json({
      success: true,
      message: 'Reparación actualizada exitosamente',
      data: reparacionActualizada
    });
  } catch (error) {
    logger.error('Error en updateReparacion:', error);
    next(error);
  }
};

// DELETE /api/reparaciones/:id - Eliminar reparación
export const deleteReparacion = async (req, res, next) => {
  try {
    const { id } = req.params;
    const usuarioDocumento = req.user.documento || req.user.id;

    // Verificar acceso
    const canAccess = await Reparacion.canAccess(id, usuarioDocumento);
    if (!canAccess) {
      return res.status(403).json({
        success: false,
        error: 'No tienes permisos para eliminar esta reparación'
      });
    }

    const deleted = await Reparacion.delete(id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'Reparación no encontrada'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Reparación eliminada exitosamente'
    });
  } catch (error) {
    logger.error('Error en deleteReparacion:', error);
    next(error);
  }
};

// GET /api/reparaciones/evaluacion/:evaluacionId - Obtener reparaciones por evaluación
export const getReparacionesByEvaluacion = async (req, res, next) => {
  try {
    const { evaluacionId } = req.params;
    const usuarioDocumento = req.user.documento || req.user.id;

    // Verificar acceso a la evaluación
    const Evaluacion = (await import('../models/Evaluacion.js')).default;
    const canAccessEvaluacion = await Evaluacion.canAccess(evaluacionId, usuarioDocumento);
    if (!canAccessEvaluacion) {
      return res.status(403).json({
        success: false,
        error: 'No tienes permisos para acceder a esta evaluación'
      });
    }

    const reparaciones = await Reparacion.getByEvaluacion(evaluacionId);

    res.status(200).json({
      success: true,
      data: reparaciones,
      count: reparaciones.length,
      evaluacion_id: evaluacionId
    });
  } catch (error) {
    logger.error('Error en getReparacionesByEvaluacion:', error);
    next(error);
  }
};

// GET /api/reparaciones/mis-reparaciones - Obtener reparaciones del usuario
export const getMyReparaciones = async (req, res, next) => {
  try {
    const usuarioDocumento = req.user.documento || req.user.id;
    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;

    const reparaciones = await Reparacion.getByUser(usuarioDocumento, limit, offset);

    res.status(200).json({
      success: true,
      data: reparaciones,
      count: reparaciones.length
    });
  } catch (error) {
    logger.error('Error en getMyReparaciones:', error);
    next(error);
  }
};

// GET /api/reparaciones/taller/:tallerId - Obtener reparaciones por taller
export const getReparacionesByTaller = async (req, res, next) => {
  try {
    const { tallerId } = req.params;
    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;

    const reparaciones = await Reparacion.getByTaller(tallerId, limit, offset);

    res.status(200).json({
      success: true,
      data: reparaciones,
      count: reparaciones.length,
      taller_id: tallerId
    });
  } catch (error) {
    logger.error('Error en getReparacionesByTaller:', error);
    next(error);
  }
};

// PUT /api/reparaciones/:id/aceptar - Aceptar reparación
export const acceptReparacion = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { proveedor_recomendado } = req.body;
    const usuarioDocumento = req.user.documento || req.user.id;

    // Verificar acceso (solo el cliente puede aceptar)
    const reparacion = await Reparacion.getById(id);
    if (!reparacion) {
      return res.status(404).json({
        success: false,
        error: 'Reparación no encontrada'
      });
    }

    if (reparacion.usuario_solicitante !== usuarioDocumento) {
      return res.status(403).json({
        success: false,
        error: 'Solo el cliente puede aceptar la reparación'
      });
    }

    if (reparacion.estado !== 'pendiente') {
      return res.status(400).json({
        success: false,
        error: 'Solo se pueden aceptar reparaciones pendientes'
      });
    }

    const accepted = await Reparacion.accept(id, proveedor_recomendado);

    if (!accepted) {
      return res.status(400).json({
        success: false,
        error: 'No se pudo aceptar la reparación'
      });
    }

    const reparacionAceptada = await Reparacion.getById(id);

    res.status(200).json({
      success: true,
      message: 'Reparación aceptada exitosamente',
      data: reparacionAceptada
    });
  } catch (error) {
    logger.error('Error en acceptReparacion:', error);
    next(error);
  }
};

// PUT /api/reparaciones/:id/rechazar - Rechazar reparación
export const rejectReparacion = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { motivo } = req.body;
    const usuarioDocumento = req.user.documento || req.user.id;

    // Verificar acceso (solo el cliente puede rechazar)
    const reparacion = await Reparacion.getById(id);
    if (!reparacion) {
      return res.status(404).json({
        success: false,
        error: 'Reparación no encontrada'
      });
    }

    if (reparacion.usuario_solicitante !== usuarioDocumento) {
      return res.status(403).json({
        success: false,
        error: 'Solo el cliente puede rechazar la reparación'
      });
    }

    if (reparacion.estado !== 'pendiente') {
      return res.status(400).json({
        success: false,
        error: 'Solo se pueden rechazar reparaciones pendientes'
      });
    }

    const rejected = await Reparacion.reject(id, motivo);

    if (!rejected) {
      return res.status(400).json({
        success: false,
        error: 'No se pudo rechazar la reparación'
      });
    }

    const reparacionRechazada = await Reparacion.getById(id);

    res.status(200).json({
      success: true,
      message: 'Reparación rechazada exitosamente',
      data: reparacionRechazada
    });
  } catch (error) {
    logger.error('Error en rejectReparacion:', error);
    next(error);
  }
};

// PUT /api/reparaciones/:id/completar - Completar reparación
export const completeReparacion = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { costo_final, notas_completado } = req.body;
    const usuarioDocumento = req.user.documento || req.user.id;

    // Verificar acceso (solo el taller puede completar)
    const reparacion = await Reparacion.getById(id);
    if (!reparacion) {
      return res.status(404).json({
        success: false,
        error: 'Reparación no encontrada'
      });
    }

    // Verificar si el usuario es propietario del taller
    const Taller = (await import('../models/Taller.js')).default;
    const isOwner = await Taller.isOwner(reparacion.taller_id, usuarioDocumento);
    if (!isOwner) {
      return res.status(403).json({
        success: false,
        error: 'Solo el propietario del taller puede completar la reparación'
      });
    }

    if (reparacion.estado !== 'aceptada') {
      return res.status(400).json({
        success: false,
        error: 'Solo se pueden completar reparaciones aceptadas'
      });
    }

    const completed = await Reparacion.complete(id, costo_final, notas_completado);

    if (!completed) {
      return res.status(400).json({
        success: false,
        error: 'No se pudo completar la reparación'
      });
    }

    const reparacionCompletada = await Reparacion.getById(id);

    res.status(200).json({
      success: true,
      message: 'Reparación completada exitosamente',
      data: reparacionCompletada
    });
  } catch (error) {
    logger.error('Error en completeReparacion:', error);
    next(error);
  }
};

// GET /api/reparaciones/taller/:tallerId/estadisticas - Obtener estadísticas del taller
export const getTallerStats = async (req, res, next) => {
  try {
    const { tallerId } = req.params;
    const usuarioDocumento = req.user.documento || req.user.id;

    // Verificar si el usuario es propietario del taller
    const Taller = (await import('../models/Taller.js')).default;
    const isOwner = await Taller.isOwner(tallerId, usuarioDocumento);
    if (!isOwner) {
      return res.status(403).json({
        success: false,
        error: 'No tienes permisos para ver las estadísticas de este taller'
      });
    }

    const stats = await Reparacion.getStatsByTaller(tallerId);

    res.status(200).json({
      success: true,
      data: stats,
      taller_id: tallerId
    });
  } catch (error) {
    logger.error('Error en getTallerStats:', error);
    next(error);
  }
};

// POST /api/reparaciones/multiples - Crear múltiples reparaciones
export const createMultipleReparaciones = async (req, res, next) => {
  try {
    const { evaluacion_id, reparaciones } = req.body;
    const usuarioDocumento = req.user.documento || req.user.id;

    if (!reparaciones || !Array.isArray(reparaciones) || reparaciones.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Se requiere un array de reparaciones'
      });
    }

    // Verificar acceso a la evaluación
    const Evaluacion = (await import('../models/Evaluacion.js')).default;
    const canAccessEvaluacion = await Evaluacion.canAccess(evaluacion_id, usuarioDocumento);
    if (!canAccessEvaluacion) {
      return res.status(403).json({
        success: false,
        error: 'No tienes permisos para crear reparaciones en esta evaluación'
      });
    }

    const created = await Reparacion.createMultiple(evaluacion_id, reparaciones);

    if (!created) {
      return res.status(400).json({
        success: false,
        error: 'No se pudieron crear las reparaciones'
      });
    }

    // Obtener las reparaciones creadas
    const reparacionesCreadas = await Reparacion.getByEvaluacion(evaluacion_id);

    res.status(201).json({
      success: true,
      message: `${reparaciones.length} reparaciones creadas exitosamente`,
      data: reparacionesCreadas,
      count: reparacionesCreadas.length
    });
  } catch (error) {
    logger.error('Error en createMultipleReparaciones:', error);
    next(error);
  }
};

export default {
  getAllReparaciones,
  getReparacionById,
  createReparacion,
  updateReparacion,
  deleteReparacion,
  getReparacionesByEvaluacion,
  getMyReparaciones,
  getReparacionesByTaller,
  acceptReparacion,
  rejectReparacion,
  completeReparacion,
  getTallerStats,
  createMultipleReparaciones
};
