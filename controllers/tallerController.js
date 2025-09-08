import Taller from '../models/Taller.js';
import { logger } from '../utils/logger.js';

// GET /api/talleres - Obtener todos los talleres
export const getAllTalleres = async (req, res, next) => {
  try {
    const filters = {
      estado: req.query.estado || 'activo',
      limit: parseInt(req.query.limit) || 50,
      offset: parseInt(req.query.offset) || 0,
      latitud: req.query.latitud,
      longitud: req.query.longitud,
      radio: parseFloat(req.query.radio) || 10
    };

    const talleres = await Taller.getAll(filters);
    
    res.status(200).json({
      success: true,
      data: talleres,
      count: talleres.length,
      filters
    });
  } catch (error) {
    logger.error('Error en getAllTalleres:', error);
    next(error);
  }
};

// GET /api/talleres/:id - Obtener taller por ID
export const getTallerById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const taller = await Taller.getById(id);

    if (!taller) {
      return res.status(404).json({
        success: false,
        error: 'Taller no encontrado'
      });
    }

    res.status(200).json({
      success: true,
      data: taller
    });
  } catch (error) {
    logger.error('Error en getTallerById:', error);
    next(error);
  }
};

// POST /api/talleres - Crear nuevo taller
export const createTaller = async (req, res, next) => {
  try {
    const {
      nombre, descripcion, direccion, telefono, email,
      latitud, longitud, horario_apertura, horario_cierre,
      dias_trabajo, servicios_ofrecidos
    } = req.body;

    // Obtener documento del usuario desde el token
    const usuarioDocumento = req.user.documento || req.user.id;

    const tallerData = {
      nombre, descripcion, direccion, telefono, email,
      latitud, longitud, horario_apertura, horario_cierre,
      dias_trabajo, servicios_ofrecidos, usuario_propietario: usuarioDocumento
    };

    const tallerId = await Taller.create(tallerData);
    const nuevoTaller = await Taller.getById(tallerId);

    res.status(201).json({
      success: true,
      message: 'Taller creado exitosamente',
      data: nuevoTaller
    });
  } catch (error) {
    logger.error('Error en createTaller:', error);
    next(error);
  }
};

// PUT /api/talleres/:id - Actualizar taller
export const updateTaller = async (req, res, next) => {
  try {
    const { id } = req.params;
    const usuarioDocumento = req.user.documento || req.user.id;

    // Verificar si el usuario es propietario del taller
    const isOwner = await Taller.isOwner(id, usuarioDocumento);
    if (!isOwner) {
      return res.status(403).json({
        success: false,
        error: 'No tienes permisos para actualizar este taller'
      });
    }

    const tallerData = req.body;
    const updated = await Taller.update(id, tallerData);

    if (!updated) {
      return res.status(404).json({
        success: false,
        error: 'Taller no encontrado'
      });
    }

    const tallerActualizado = await Taller.getById(id);

    res.status(200).json({
      success: true,
      message: 'Taller actualizado exitosamente',
      data: tallerActualizado
    });
  } catch (error) {
    logger.error('Error en updateTaller:', error);
    next(error);
  }
};

// DELETE /api/talleres/:id - Eliminar taller
export const deleteTaller = async (req, res, next) => {
  try {
    const { id } = req.params;
    const usuarioDocumento = req.user.documento || req.user.id;

    // Verificar si el usuario es propietario del taller
    const isOwner = await Taller.isOwner(id, usuarioDocumento);
    if (!isOwner) {
      return res.status(403).json({
        success: false,
        error: 'No tienes permisos para eliminar este taller'
      });
    }

    const deleted = await Taller.delete(id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'Taller no encontrado'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Taller eliminado exitosamente'
    });
  } catch (error) {
    logger.error('Error en deleteTaller:', error);
    next(error);
  }
};

// GET /api/talleres/mis-talleres - Obtener talleres del usuario
export const getMyTalleres = async (req, res, next) => {
  try {
    const usuarioDocumento = req.user.documento || req.user.id;
    const talleres = await Taller.getByOwner(usuarioDocumento);

    res.status(200).json({
      success: true,
      data: talleres,
      count: talleres.length
    });
  } catch (error) {
    logger.error('Error en getMyTalleres:', error);
    next(error);
  }
};

// GET /api/talleres/:id/evaluaciones - Obtener evaluaciones del taller
export const getTallerEvaluaciones = async (req, res, next) => {
  try {
    const { id } = req.params;
    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;

    // Verificar si el taller existe
    const taller = await Taller.getById(id);
    if (!taller) {
      return res.status(404).json({
        success: false,
        error: 'Taller no encontrado'
      });
    }

    // Importar Evaluacion aquí para evitar dependencias circulares
    const Evaluacion = (await import('../models/Evaluacion.js')).default;
    const evaluaciones = await Evaluacion.getByTaller(id, limit, offset);

    res.status(200).json({
      success: true,
      data: evaluaciones,
      count: evaluaciones.length,
      taller: {
        id: taller.id,
        nombre: taller.nombre
      }
    });
  } catch (error) {
    logger.error('Error en getTallerEvaluaciones:', error);
    next(error);
  }
};

// GET /api/talleres/:id/horarios - Obtener horarios del taller
export const getTallerHorarios = async (req, res, next) => {
  try {
    const { id } = req.params;
    const fechaEspecifica = req.query.fecha || null;

    // Verificar si el taller existe
    const taller = await Taller.getById(id);
    if (!taller) {
      return res.status(404).json({
        success: false,
        error: 'Taller no encontrado'
      });
    }

    // Importar Horario aquí para evitar dependencias circulares
    const Horario = (await import('../models/Horario.js')).default;
    const horarios = await Horario.getByTaller(id, fechaEspecifica);

    res.status(200).json({
      success: true,
      data: horarios,
      count: horarios.length,
      taller: {
        id: taller.id,
        nombre: taller.nombre
      }
    });
  } catch (error) {
    logger.error('Error en getTallerHorarios:', error);
    next(error);
  }
};

// GET /api/talleres/:id/citas - Obtener citas del taller
export const getTallerCitas = async (req, res, next) => {
  try {
    const { id } = req.params;
    const fecha = req.query.fecha || null;
    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;

    // Verificar si el taller existe
    const taller = await Taller.getById(id);
    if (!taller) {
      return res.status(404).json({
        success: false,
        error: 'Taller no encontrado'
      });
    }

    // Importar Cita aquí para evitar dependencias circulares
    const Cita = (await import('../models/Cita.js')).default;
    const citas = await Cita.getByTaller(id, fecha, limit, offset);

    res.status(200).json({
      success: true,
      data: citas,
      count: citas.length,
      taller: {
        id: taller.id,
        nombre: taller.nombre
      }
    });
  } catch (error) {
    logger.error('Error en getTallerCitas:', error);
    next(error);
  }
};

// GET /api/talleres/:id/disponibilidad - Verificar disponibilidad
export const getTallerDisponibilidad = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { fecha } = req.query;

    if (!fecha) {
      return res.status(400).json({
        success: false,
        error: 'La fecha es requerida'
      });
    }

    // Verificar si el taller existe
    const taller = await Taller.getById(id);
    if (!taller) {
      return res.status(404).json({
        success: false,
        error: 'Taller no encontrado'
      });
    }

    // Importar Horario aquí para evitar dependencias circulares
    const Horario = (await import('../models/Horario.js')).default;
    const slotsDisponibles = await Horario.getAvailableSlots(id, fecha);

    res.status(200).json({
      success: true,
      data: slotsDisponibles,
      fecha,
      taller: {
        id: taller.id,
        nombre: taller.nombre
      }
    });
  } catch (error) {
    logger.error('Error en getTallerDisponibilidad:', error);
    next(error);
  }
};

export default {
  getAllTalleres,
  getTallerById,
  createTaller,
  updateTaller,
  deleteTaller,
  getMyTalleres,
  getTallerEvaluaciones,
  getTallerHorarios,
  getTallerCitas,
  getTallerDisponibilidad
};
