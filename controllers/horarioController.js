import Horario from '../models/Horario.js';
import HorarioDia from '../models/HorarioDia.js';
import { logger } from '../utils/logger.js';

// GET /api/horarios - Obtener todos los horarios
export const getAllHorarios = async (req, res, next) => {
  try {
    const filters = {
      taller_id: req.query.taller_id,
      dia_semana: req.query.dia_semana,
      esta_abierto: req.query.esta_abierto !== undefined ? req.query.esta_abierto === 'true' : undefined,
      fecha_desde: req.query.fecha_desde,
      fecha_hasta: req.query.fecha_hasta,
      limit: parseInt(req.query.limit) || 50,
      offset: parseInt(req.query.offset) || 0
    };

    const horarios = await Horario.getAll(filters);
    
    res.status(200).json({
      success: true,
      data: horarios,
      count: horarios.length,
      filters
    });
  } catch (error) {
    logger.error('Error en getAllHorarios:', error);
    next(error);
  }
};

// GET /api/horarios/:id - Obtener horario por ID
export const getHorarioById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const horario = await Horario.getById(id);

    if (!horario) {
      return res.status(404).json({
        success: false,
        error: 'Horario no encontrado'
      });
    }

    res.status(200).json({
      success: true,
      data: horario
    });
  } catch (error) {
    logger.error('Error en getHorarioById:', error);
    next(error);
  }
};

// POST /api/horarios - Crear nuevo horario
export const createHorario = async (req, res, next) => {
  try {
    const {
      taller_id, dia_semana, hora_apertura, hora_cierre,
      esta_abierto, duracion_cita_minutos, citas_maximas_por_dia,
      fecha_desde, fecha_hasta, notas
    } = req.body;

    const usuarioDocumento = req.user.documento || req.user.id;

    // Verificar si el usuario es propietario del taller
    const Taller = (await import('../models/Taller.js')).default;
    const isOwner = await Taller.isOwner(taller_id, usuarioDocumento);
    if (!isOwner) {
      return res.status(403).json({
        success: false,
        error: 'No tienes permisos para crear horarios en este taller'
      });
    }

    const horarioData = {
      taller_id, dia_semana, hora_apertura, hora_cierre,
      esta_abierto, duracion_cita_minutos, citas_maximas_por_dia,
      fecha_desde, fecha_hasta, notas
    };

    const horarioId = await Horario.create(horarioData);
    const nuevoHorario = await Horario.getById(horarioId);

    res.status(201).json({
      success: true,
      message: 'Horario creado exitosamente',
      data: nuevoHorario
    });
  } catch (error) {
    logger.error('Error en createHorario:', error);
    next(error);
  }
};

// PUT /api/horarios/:id - Actualizar horario
export const updateHorario = async (req, res, next) => {
  try {
    const { id } = req.params;
    const usuarioDocumento = req.user.documento || req.user.id;

    // Verificar acceso
    const canAccess = await Horario.canAccess(id, usuarioDocumento);
    if (!canAccess) {
      return res.status(403).json({
        success: false,
        error: 'No tienes permisos para actualizar este horario'
      });
    }

    const horarioData = req.body;
    const updated = await Horario.update(id, horarioData);

    if (!updated) {
      return res.status(404).json({
        success: false,
        error: 'Horario no encontrado'
      });
    }

    const horarioActualizado = await Horario.getById(id);

    res.status(200).json({
      success: true,
      message: 'Horario actualizado exitosamente',
      data: horarioActualizado
    });
  } catch (error) {
    logger.error('Error en updateHorario:', error);
    next(error);
  }
};

// DELETE /api/horarios/:id - Eliminar horario
export const deleteHorario = async (req, res, next) => {
  try {
    const { id } = req.params;
    const usuarioDocumento = req.user.documento || req.user.id;

    // Verificar acceso
    const canAccess = await Horario.canAccess(id, usuarioDocumento);
    if (!canAccess) {
      return res.status(403).json({
        success: false,
        error: 'No tienes permisos para eliminar este horario'
      });
    }

    const deleted = await Horario.delete(id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'Horario no encontrado'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Horario eliminado exitosamente'
    });
  } catch (error) {
    logger.error('Error en deleteHorario:', error);
    next(error);
  }
};

// GET /api/horarios/taller/:tallerId - Obtener horarios por taller
export const getHorariosByTaller = async (req, res, next) => {
  try {
    const { tallerId } = req.params;
    const fechaEspecifica = req.query.fecha || null;

    const horarios = await Horario.getByTaller(tallerId, fechaEspecifica);

    res.status(200).json({
      success: true,
      data: horarios,
      count: horarios.length,
      taller_id: tallerId,
      fecha: fechaEspecifica
    });
  } catch (error) {
    logger.error('Error en getHorariosByTaller:', error);
    next(error);
  }
};

// GET /api/horarios/:tallerId/disponibilidad - Obtener slots disponibles
export const getDisponibilidad = async (req, res, next) => {
  try {
    const { tallerId } = req.params;
    const { fecha } = req.query;

    if (!fecha) {
      return res.status(400).json({
        success: false,
        error: 'La fecha es requerida'
      });
    }

    const slotsDisponibles = await Horario.getAvailableSlots(tallerId, fecha);

    res.status(200).json({
      success: true,
      data: slotsDisponibles,
      fecha,
      taller_id: tallerId
    });
  } catch (error) {
    logger.error('Error en getDisponibilidad:', error);
    next(error);
  }
};

// POST /api/horarios/semanal - Crear horario semanal completo
export const createHorarioSemanal = async (req, res, next) => {
  try {
    const {
      taller_id, hora_apertura, hora_cierre, duracion_cita_minutos,
      citas_maximas_por_dia, fecha_desde, fecha_hasta, notas
    } = req.body;

    const usuarioDocumento = req.user.documento || req.user.id;

    // Verificar si el usuario es propietario del taller
    const Taller = (await import('../models/Taller.js')).default;
    const isOwner = await Taller.isOwner(taller_id, usuarioDocumento);
    if (!isOwner) {
      return res.status(403).json({
        success: false,
        error: 'No tienes permisos para crear horarios en este taller'
      });
    }

    const scheduleData = {
      taller_id, hora_apertura, hora_cierre, duracion_cita_minutos,
      citas_maximas_por_dia, fecha_desde, fecha_hasta, notas
    };

    const created = await Horario.createWeeklySchedule(taller_id, scheduleData);

    if (!created) {
      return res.status(400).json({
        success: false,
        error: 'No se pudo crear el horario semanal'
      });
    }

    // Obtener los horarios creados
    const horariosCreados = await Horario.getByTaller(taller_id, fecha_desde);

    res.status(201).json({
      success: true,
      message: 'Horario semanal creado exitosamente',
      data: horariosCreados,
      count: horariosCreados.length
    });
  } catch (error) {
    logger.error('Error en createHorarioSemanal:', error);
    next(error);
  }
};

// PUT /api/horarios/semanal/:tallerId - Actualizar horario semanal completo
export const updateHorarioSemanal = async (req, res, next) => {
  try {
    const { tallerId } = req.params;
    const {
      hora_apertura, hora_cierre, duracion_cita_minutos,
      citas_maximas_por_dia, fecha_desde, fecha_hasta, notas
    } = req.body;

    const usuarioDocumento = req.user.documento || req.user.id;

    // Verificar si el usuario es propietario del taller
    const Taller = (await import('../models/Taller.js')).default;
    const isOwner = await Taller.isOwner(tallerId, usuarioDocumento);
    if (!isOwner) {
      return res.status(403).json({
        success: false,
        error: 'No tienes permisos para actualizar horarios en este taller'
      });
    }

    const scheduleData = {
      taller_id: tallerId, hora_apertura, hora_cierre, duracion_cita_minutos,
      citas_maximas_por_dia, fecha_desde, fecha_hasta, notas
    };

    const updated = await Horario.updateWeeklySchedule(tallerId, scheduleData);

    if (!updated) {
      return res.status(400).json({
        success: false,
        error: 'No se pudo actualizar el horario semanal'
      });
    }

    // Obtener los horarios actualizados
    const horariosActualizados = await Horario.getByTaller(tallerId, fecha_desde);

    res.status(200).json({
      success: true,
      message: 'Horario semanal actualizado exitosamente',
      data: horariosActualizados,
      count: horariosActualizados.length
    });
  } catch (error) {
    logger.error('Error en updateHorarioSemanal:', error);
    next(error);
  }
};

// GET /api/horarios/:tallerId/mes/:año/:mes - Obtener horarios por mes
export const getHorariosByMonth = async (req, res, next) => {
  try {
    const { tallerId, año, mes } = req.params;
    
    // Validar parámetros
    const añoNum = parseInt(año);
    const mesNum = parseInt(mes);
    
    if (isNaN(añoNum) || añoNum < 2020 || añoNum > 2030) {
      return res.status(400).json({
        success: false,
        error: 'El año debe ser un número válido entre 2020 y 2030'
      });
    }
    
    if (isNaN(mesNum) || mesNum < 1 || mesNum > 12) {
      return res.status(400).json({
        success: false,
        error: 'El mes debe ser un número entre 1 y 12'
      });
    }

    const horarios = await HorarioDia.getByMonth(tallerId, añoNum, mesNum);

    res.status(200).json({
      success: true,
      data: horarios,
      count: horarios.length,
      taller_id: tallerId,
      año: añoNum,
      mes: mesNum
    });
  } catch (error) {
    logger.error('Error en getHorariosByMonth:', error);
    next(error);
  }
};

// GET /api/horarios/:tallerId/dia/:fecha - Obtener horarios por día
export const getHorariosByDay = async (req, res, next) => {
  try {
    const { tallerId, fecha } = req.params;
    
    // Validar formato de fecha (YYYY-MM-DD)
    const fechaRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!fechaRegex.test(fecha)) {
      return res.status(400).json({
        success: false,
        error: 'La fecha debe estar en formato YYYY-MM-DD'
      });
    }

    // Validar que la fecha sea válida
    const fechaObj = new Date(fecha);
    if (isNaN(fechaObj.getTime())) {
      return res.status(400).json({
        success: false,
        error: 'La fecha proporcionada no es válida'
      });
    }

    const horario = await HorarioDia.getByDay(tallerId, fecha);

    res.status(200).json({
      success: true,
      data: horario,
      taller_id: tallerId,
      fecha
    });
  } catch (error) {
    logger.error('Error en getHorariosByDay:', error);
    next(error);
  }
};

// POST /api/horarios/:tallerId/dia - Crear horario para un día específico
export const createDaySchedule = async (req, res, next) => {
  try {
    const { tallerId } = req.params;
    const { fecha, hora_apertura, hora_cierre, esta_abierto, duracion_cita_minutos, citas_maximas_por_dia, notas } = req.body;
    
    const usuarioDocumento = req.user.documento || req.user.id;

    // Verificar si el usuario es propietario del taller
    const Taller = (await import('../models/Taller.js')).default;
    const isOwner = await Taller.isOwner(tallerId, usuarioDocumento);
    if (!isOwner) {
      return res.status(403).json({
        success: false,
        error: 'No tienes permisos para crear horarios en este taller'
      });
    }

    // Validar formato de fecha
    const fechaRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!fechaRegex.test(fecha)) {
      return res.status(400).json({
        success: false,
        error: 'La fecha debe estar en formato YYYY-MM-DD'
      });
    }

    const horarioData = {
      horarios: req.body.horarios || [],
      bloqueado: req.body.bloqueado || false,
      motivoBloqueo: req.body.motivoBloqueo
    };

    const horarioId = await HorarioDia.createDaySchedule(tallerId, fecha, horarioData);
    const nuevoHorario = await HorarioDia.getByDay(tallerId, fecha);

    res.status(201).json({
      success: true,
      message: 'Horario diario creado exitosamente',
      data: nuevoHorario
    });
  } catch (error) {
    logger.error('Error en createDaySchedule:', error);
    next(error);
  }
};

// PUT /api/horarios/:tallerId/dia/:fecha - Actualizar horario para un día específico
export const updateDaySchedule = async (req, res, next) => {
  try {
    const { tallerId, fecha } = req.params;
    const { hora_apertura, hora_cierre, esta_abierto, duracion_cita_minutos, citas_maximas_por_dia, notas } = req.body;
    
    const usuarioDocumento = req.user.documento || req.user.id;

    // Verificar si el usuario es propietario del taller
    const Taller = (await import('../models/Taller.js')).default;
    const isOwner = await Taller.isOwner(tallerId, usuarioDocumento);
    if (!isOwner) {
      return res.status(403).json({
        success: false,
        error: 'No tienes permisos para actualizar horarios en este taller'
      });
    }

    // Validar formato de fecha
    const fechaRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!fechaRegex.test(fecha)) {
      return res.status(400).json({
        success: false,
        error: 'La fecha debe estar en formato YYYY-MM-DD'
      });
    }

    const horarioData = {
      horarios: req.body.horarios || [],
      bloqueado: req.body.bloqueado,
      motivoBloqueo: req.body.motivoBloqueo
    };

    const updated = await HorarioDia.updateDaySchedule(tallerId, fecha, horarioData);

    if (!updated) {
      return res.status(404).json({
        success: false,
        error: 'No se encontró horario para actualizar en esa fecha'
      });
    }

    const horarioActualizado = await HorarioDia.getByDay(tallerId, fecha);

    res.status(200).json({
      success: true,
      message: 'Horario diario actualizado exitosamente',
      data: horarioActualizado
    });
  } catch (error) {
    logger.error('Error en updateDaySchedule:', error);
    next(error);
  }
};

// DELETE /api/horarios/:tallerId/dia/:fecha - Eliminar horario para un día específico
export const deleteDaySchedule = async (req, res, next) => {
  try {
    const { tallerId, fecha } = req.params;
    const usuarioDocumento = req.user.documento || req.user.id;

    // Verificar si el usuario es propietario del taller
    const Taller = (await import('../models/Taller.js')).default;
    const isOwner = await Taller.isOwner(tallerId, usuarioDocumento);
    if (!isOwner) {
      return res.status(403).json({
        success: false,
        error: 'No tienes permisos para eliminar horarios en este taller'
      });
    }

    // Validar formato de fecha
    const fechaRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!fechaRegex.test(fecha)) {
      return res.status(400).json({
        success: false,
        error: 'La fecha debe estar en formato YYYY-MM-DD'
      });
    }

    const deleted = await HorarioDia.deleteDaySchedule(tallerId, fecha);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'No se encontró horario para eliminar en esa fecha'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Horario diario eliminado exitosamente'
    });
  } catch (error) {
    logger.error('Error en deleteDaySchedule:', error);
    next(error);
  }
};

// POST /api/horarios/:tallerId/copiar - Copiar horarios de un día a otro
export const copyDaySchedule = async (req, res, next) => {
  try {
    const { tallerId } = req.params;
    const { fecha_origen, fecha_destino, hora_apertura, hora_cierre, esta_abierto, duracion_cita_minutos, citas_maximas_por_dia, notas } = req.body;
    
    const usuarioDocumento = req.user.documento || req.user.id;

    // Verificar si el usuario es propietario del taller
    const Taller = (await import('../models/Taller.js')).default;
    const isOwner = await Taller.isOwner(tallerId, usuarioDocumento);
    if (!isOwner) {
      return res.status(403).json({
        success: false,
        error: 'No tienes permisos para copiar horarios en este taller'
      });
    }

    // Validar formato de fechas
    const fechaRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!fechaRegex.test(fecha_origen) || !fechaRegex.test(fecha_destino)) {
      return res.status(400).json({
        success: false,
        error: 'Las fechas deben estar en formato YYYY-MM-DD'
      });
    }

    // Validar que las fechas sean válidas
    const fechaOrigenObj = new Date(fecha_origen);
    const fechaDestinoObj = new Date(fecha_destino);
    if (isNaN(fechaOrigenObj.getTime()) || isNaN(fechaDestinoObj.getTime())) {
      return res.status(400).json({
        success: false,
        error: 'Las fechas proporcionadas no son válidas'
      });
    }

    const horarioData = {
      horarios: req.body.horarios || [],
      bloqueado: req.body.bloqueado || false,
      motivoBloqueo: req.body.motivoBloqueo
    };

    const horarioId = await HorarioDia.copyDaySchedule(tallerId, fecha_origen, fecha_destino, horarioData);
    const nuevoHorario = await HorarioDia.getByDay(tallerId, fecha_destino);

    res.status(201).json({
      success: true,
      message: 'Horario copiado exitosamente',
      data: nuevoHorario,
      fecha_origen,
      fecha_destino
    });
  } catch (error) {
    logger.error('Error en copyDaySchedule:', error);
    next(error);
  }
};

export default {
  getAllHorarios,
  getHorarioById,
  createHorario,
  updateHorario,
  deleteHorario,
  getHorariosByTaller,
  getDisponibilidad,
  createHorarioSemanal,
  updateHorarioSemanal,
  getHorariosByMonth,
  getHorariosByDay,
  createDaySchedule,
  updateDaySchedule,
  deleteDaySchedule,
  copyDaySchedule
};
