import Cita from '../models/Cita.js';
import { logger } from '../utils/logger.js';

// GET /api/citas - Obtener todas las citas
export const getAllCitas = async (req, res, next) => {
  try {
    const filters = {
      taller_id: req.query.taller_id,
      usuario_cliente: req.query.usuario_cliente,
      estado: req.query.estado,
      tipo_cita: req.query.tipo_cita,
      fecha_desde: req.query.fecha_desde,
      fecha_hasta: req.query.fecha_hasta,
      limit: parseInt(req.query.limit) || 50,
      offset: parseInt(req.query.offset) || 0
    };

    const citas = await Cita.getAll(filters);
    
    res.status(200).json({
      success: true,
      data: citas,
      count: citas.length,
      filters
    });
  } catch (error) {
    logger.error('Error en getAllCitas:', error);
    next(error);
  }
};

// GET /api/citas/:id - Obtener cita por ID
export const getCitaById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const usuarioDocumento = req.user.documento || req.user.id;

    // Verificar acceso
    const canAccess = await Cita.canAccess(id, usuarioDocumento);
    if (!canAccess) {
      return res.status(403).json({
        success: false,
        error: 'No tienes permisos para acceder a esta cita'
      });
    }

    const cita = await Cita.getById(id);

    if (!cita) {
      return res.status(404).json({
        success: false,
        error: 'Cita no encontrada'
      });
    }

    res.status(200).json({
      success: true,
      data: cita
    });
  } catch (error) {
    logger.error('Error en getCitaById:', error);
    next(error);
  }
};

// POST /api/citas - Crear nueva cita
export const createCita = async (req, res, next) => {
  try {
    const {
      taller_id, carro_id, tipo_cita, fecha_cita, hora_inicio, hora_fin,
      descripcion_problema, servicios_solicitados, costo_estimado,
      telefono_contacto, email_contacto, notas_cliente
    } = req.body;

    const usuarioDocumento = req.user.documento || req.user.id;

    // Verificar disponibilidad
    const isAvailable = await Cita.checkAvailability(taller_id, fecha_cita, hora_inicio, hora_fin);
    if (!isAvailable) {
      return res.status(400).json({
        success: false,
        error: 'El horario seleccionado no está disponible'
      });
    }

    const citaData = {
      taller_id, carro_id, usuario_cliente: usuarioDocumento, tipo_cita,
      fecha_cita, hora_inicio, hora_fin, descripcion_problema,
      servicios_solicitados, costo_estimado, telefono_contacto,
      email_contacto, notas_cliente
    };

    const citaId = await Cita.create(citaData);
    const nuevaCita = await Cita.getById(citaId);

    res.status(201).json({
      success: true,
      message: 'Cita creada exitosamente',
      data: nuevaCita
    });
  } catch (error) {
    logger.error('Error en createCita:', error);
    next(error);
  }
};

// PUT /api/citas/:id - Actualizar cita
export const updateCita = async (req, res, next) => {
  try {
    const { id } = req.params;
    const usuarioDocumento = req.user.documento || req.user.id;

    // Verificar acceso
    const canAccess = await Cita.canAccess(id, usuarioDocumento);
    if (!canAccess) {
      return res.status(403).json({
        success: false,
        error: 'No tienes permisos para actualizar esta cita'
      });
    }

    const citaData = req.body;
    
    // Si se está cambiando la fecha/hora, verificar disponibilidad
    if (citaData.fecha_cita || citaData.hora_inicio || citaData.hora_fin) {
      const citaActual = await Cita.getById(id);
      const fecha = citaData.fecha_cita || citaActual.fecha_cita;
      const horaInicio = citaData.hora_inicio || citaActual.hora_inicio;
      const horaFin = citaData.hora_fin || citaActual.hora_fin;

      const isAvailable = await Cita.checkAvailability(citaActual.taller_id, fecha, horaInicio, horaFin);
      if (!isAvailable) {
        return res.status(400).json({
          success: false,
          error: 'El nuevo horario seleccionado no está disponible'
        });
      }
    }

    const updated = await Cita.update(id, citaData);

    if (!updated) {
      return res.status(404).json({
        success: false,
        error: 'Cita no encontrada'
      });
    }

    const citaActualizada = await Cita.getById(id);

    res.status(200).json({
      success: true,
      message: 'Cita actualizada exitosamente',
      data: citaActualizada
    });
  } catch (error) {
    logger.error('Error en updateCita:', error);
    next(error);
  }
};

// DELETE /api/citas/:id - Eliminar cita
export const deleteCita = async (req, res, next) => {
  try {
    const { id } = req.params;
    const usuarioDocumento = req.user.documento || req.user.id;

    // Verificar acceso
    const canAccess = await Cita.canAccess(id, usuarioDocumento);
    if (!canAccess) {
      return res.status(403).json({
        success: false,
        error: 'No tienes permisos para eliminar esta cita'
      });
    }

    const deleted = await Cita.delete(id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'Cita no encontrada'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Cita eliminada exitosamente'
    });
  } catch (error) {
    logger.error('Error en deleteCita:', error);
    next(error);
  }
};

// GET /api/citas/mis-citas - Obtener citas del usuario
export const getMyCitas = async (req, res, next) => {
  try {
    const usuarioDocumento = req.user.documento || req.user.id;
    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;

    const citas = await Cita.getByUser(usuarioDocumento, limit, offset);

    res.status(200).json({
      success: true,
      data: citas,
      count: citas.length
    });
  } catch (error) {
    logger.error('Error en getMyCitas:', error);
    next(error);
  }
};

// PUT /api/citas/:id/confirmar - Confirmar cita
export const confirmCita = async (req, res, next) => {
  try {
    const { id } = req.params;
    const usuarioDocumento = req.user.documento || req.user.id;

    // Verificar acceso
    const canAccess = await Cita.canAccess(id, usuarioDocumento);
    if (!canAccess) {
      return res.status(403).json({
        success: false,
        error: 'No tienes permisos para confirmar esta cita'
      });
    }

    const cita = await Cita.getById(id);
    if (!cita) {
      return res.status(404).json({
        success: false,
        error: 'Cita no encontrada'
      });
    }

    if (cita.estado !== 'programada') {
      return res.status(400).json({
        success: false,
        error: 'Solo se pueden confirmar citas programadas'
      });
    }

    const confirmed = await Cita.confirm(id);

    if (!confirmed) {
      return res.status(400).json({
        success: false,
        error: 'No se pudo confirmar la cita'
      });
    }

    const citaConfirmada = await Cita.getById(id);

    res.status(200).json({
      success: true,
      message: 'Cita confirmada exitosamente',
      data: citaConfirmada
    });
  } catch (error) {
    logger.error('Error en confirmCita:', error);
    next(error);
  }
};

// PUT /api/citas/:id/cancelar - Cancelar cita
export const cancelCita = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { motivo } = req.body;
    const usuarioDocumento = req.user.documento || req.user.id;

    // Verificar acceso
    const canAccess = await Cita.canAccess(id, usuarioDocumento);
    if (!canAccess) {
      return res.status(403).json({
        success: false,
        error: 'No tienes permisos para cancelar esta cita'
      });
    }

    const cita = await Cita.getById(id);
    if (!cita) {
      return res.status(404).json({
        success: false,
        error: 'Cita no encontrada'
      });
    }

    if (cita.estado === 'cancelada' || cita.estado === 'completada') {
      return res.status(400).json({
        success: false,
        error: 'No se puede cancelar una cita ya cancelada o completada'
      });
    }

    const cancelled = await Cita.cancel(id, motivo);

    if (!cancelled) {
      return res.status(400).json({
        success: false,
        error: 'No se pudo cancelar la cita'
      });
    }

    const citaCancelada = await Cita.getById(id);

    res.status(200).json({
      success: true,
      message: 'Cita cancelada exitosamente',
      data: citaCancelada
    });
  } catch (error) {
    logger.error('Error en cancelCita:', error);
    next(error);
  }
};

// PUT /api/citas/:id/completar - Completar cita
export const completeCita = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { costo_final, notas_taller } = req.body;
    const usuarioDocumento = req.user.documento || req.user.id;

    // Verificar acceso (solo el taller puede completar)
    const cita = await Cita.getById(id);
    if (!cita) {
      return res.status(404).json({
        success: false,
        error: 'Cita no encontrada'
      });
    }

    // Verificar si el usuario es propietario del taller
    const Taller = (await import('../models/Taller.js')).default;
    const isOwner = await Taller.isOwner(cita.taller_id, usuarioDocumento);
    if (!isOwner) {
      return res.status(403).json({
        success: false,
        error: 'Solo el propietario del taller puede completar la cita'
      });
    }

    if (cita.estado !== 'en_proceso' && cita.estado !== 'confirmada') {
      return res.status(400).json({
        success: false,
        error: 'La cita debe estar en proceso o confirmada para completarla'
      });
    }

    const completed = await Cita.complete(id, costo_final, notas_taller);

    if (!completed) {
      return res.status(400).json({
        success: false,
        error: 'No se pudo completar la cita'
      });
    }

    const citaCompletada = await Cita.getById(id);

    res.status(200).json({
      success: true,
      message: 'Cita completada exitosamente',
      data: citaCompletada
    });
  } catch (error) {
    logger.error('Error en completeCita:', error);
    next(error);
  }
};

// PUT /api/citas/:id/calificar - Calificar cita
export const rateCita = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { calificacion_atencion, calificacion_calidad, comentario_cliente } = req.body;
    const usuarioDocumento = req.user.documento || req.user.id;

    // Verificar acceso (solo el cliente puede calificar)
    const cita = await Cita.getById(id);
    if (!cita) {
      return res.status(404).json({
        success: false,
        error: 'Cita no encontrada'
      });
    }

    if (cita.usuario_cliente !== usuarioDocumento) {
      return res.status(403).json({
        success: false,
        error: 'Solo el cliente puede calificar la cita'
      });
    }

    if (cita.estado !== 'completada') {
      return res.status(400).json({
        success: false,
        error: 'Solo se pueden calificar citas completadas'
      });
    }

    const rated = await Cita.rate(id, calificacion_atencion, calificacion_calidad, comentario_cliente);

    if (!rated) {
      return res.status(400).json({
        success: false,
        error: 'No se pudo calificar la cita'
      });
    }

    const citaCalificada = await Cita.getById(id);

    res.status(200).json({
      success: true,
      message: 'Cita calificada exitosamente',
      data: citaCalificada
    });
  } catch (error) {
    logger.error('Error en rateCita:', error);
    next(error);
  }
};

// GET /api/citas/taller/:tallerId - Obtener citas por taller
export const getCitasByTaller = async (req, res, next) => {
  try {
    const { tallerId } = req.params;
    const fecha = req.query.fecha || null;
    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;

    const citas = await Cita.getByTaller(tallerId, fecha, limit, offset);

    res.status(200).json({
      success: true,
      data: citas,
      count: citas.length,
      taller_id: tallerId,
      fecha
    });
  } catch (error) {
    logger.error('Error en getCitasByTaller:', error);
    next(error);
  }
};

// GET /api/citas/proximas - Obtener citas próximas (para recordatorios)
export const getCitasProximas = async (req, res, next) => {
  try {
    const horasAntes = parseInt(req.query.horas_antes) || 24;
    const citas = await Cita.getUpcoming(horasAntes);

    res.status(200).json({
      success: true,
      data: citas,
      count: citas.length,
      horas_antes: horasAntes
    });
  } catch (error) {
    logger.error('Error en getCitasProximas:', error);
    next(error);
  }
};

// GET /api/taller/citas/:tallerId/hoy - Obtener citas de hoy (específico del frontend)
export const getCitasHoy = async (req, res, next) => {
  try {
    const { tallerId } = req.params;
    const hoy = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    const citas = await Cita.getByTaller(tallerId, hoy);

    res.status(200).json({
      success: true,
      data: citas,
      count: citas.length,
      taller_id: tallerId,
      fecha: hoy
    });
  } catch (error) {
    logger.error('Error en getCitasHoy:', error);
    next(error);
  }
};

// PUT /api/taller/citas/:id/estado - Actualizar estado de cita (específico del frontend)
export const updateEstadoCita = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;
    const usuarioDocumento = req.user.documento || req.user.id;

    // Verificar acceso
    const canAccess = await Cita.canAccess(id, usuarioDocumento);
    if (!canAccess) {
      return res.status(403).json({
        success: false,
        error: 'No tienes permisos para actualizar esta cita'
      });
    }

    // Validar estado
    const estadosValidos = ['programada', 'confirmada', 'en_proceso', 'completada', 'cancelada', 'no_asistio'];
    if (!estadosValidos.includes(estado)) {
      return res.status(400).json({
        success: false,
        error: `Estado inválido. Debe ser uno de: ${estadosValidos.join(', ')}`
      });
    }

    const updated = await Cita.update(id, { estado });

    if (!updated) {
      return res.status(404).json({
        success: false,
        error: 'Cita no encontrada'
      });
    }

    const citaActualizada = await Cita.getById(id);

    res.status(200).json({
      success: true,
      message: 'Estado de cita actualizado exitosamente',
      data: citaActualizada
    });
  } catch (error) {
    logger.error('Error en updateEstadoCita:', error);
    next(error);
  }
};

export default {
  getAllCitas,
  getCitaById,
  createCita,
  updateCita,
  deleteCita,
  getMyCitas,
  confirmCita,
  cancelCita,
  completeCita,
  rateCita,
  getCitasByTaller,
  getCitasProximas,
  getCitasHoy,
  updateEstadoCita
};
