import { query, transaction } from '../config/database.js';
import { logger } from '../utils/logger.js';

export default class Taller {
  // Obtener todos los talleres con filtros
  static async getAll(filters = {}) {
    const { estado = 'activo', limit = 50, offset = 0, latitud, longitud, radio = 10 } = filters;
    
    let whereClause = 'WHERE t.estado = ?';
    const params = [estado];

    // Filtro por ubicación (radio en km)
    if (latitud && longitud) {
      whereClause += ` AND (
        6371 * acos(
          cos(radians(?)) * cos(radians(t.latitud)) * 
          cos(radians(t.longitud) - radians(?)) + 
          sin(radians(?)) * sin(radians(t.latitud))
        )
      ) <= ?`;
      params.push(latitud, longitud, latitud, radio);
    }

    const sql = `
      SELECT 
        t.id, t.nombre, t.descripcion, t.direccion, t.telefono, t.email,
        t.latitud, t.longitud, t.horario_apertura, t.horario_cierre,
        t.dias_trabajo, t.servicios_ofrecidos, t.estado,
        t.calificacion_promedio, t.total_evaluaciones,
        u.nombre as propietario_nombre, u.apellido as propietario_apellido,
        t.fecha_creacion, t.fecha_actualizacion
      FROM talleres t
      JOIN usuario u ON t.usuario_propietario = u.documento
      ${whereClause}
      ORDER BY t.calificacion_promedio DESC, t.total_evaluaciones DESC
      LIMIT ? OFFSET ?
    `;
    
    params.push(limit, offset);

    try {
      const rows = await query(sql, params);
      return rows;
    } catch (error) {
      logger.error('Error en Taller.getAll():', error);
      throw error;
    }
  }

  // Obtener taller por ID
  static async getById(id) {
    const sql = `
      SELECT 
        t.*,
        u.nombre as propietario_nombre, u.apellido as propietario_apellido,
        u.telefono as propietario_telefono
      FROM talleres t
      JOIN usuario u ON t.usuario_propietario = u.documento
      WHERE t.id = ?
    `;

    try {
      const rows = await query(sql, [id]);
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      logger.error('Error en Taller.getById():', error);
      throw error;
    }
  }

  // Crear nuevo taller
  static async create(tallerData) {
    const {
      nombre, descripcion, direccion, telefono, email,
      latitud, longitud, horario_apertura, horario_cierre,
      dias_trabajo, servicios_ofrecidos, usuario_propietario
    } = tallerData;

    const sql = `
      INSERT INTO talleres (
        nombre, descripcion, direccion, telefono, email,
        latitud, longitud, horario_apertura, horario_cierre,
        dias_trabajo, servicios_ofrecidos, usuario_propietario
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      nombre, descripcion, direccion, telefono, email,
      latitud, longitud, horario_apertura, horario_cierre,
      JSON.stringify(dias_trabajo), JSON.stringify(servicios_ofrecidos), usuario_propietario
    ];

    try {
      const result = await query(sql, params);
      logger.info(`Taller creado con ID: ${result.insertId}`);
      return result.insertId;
    } catch (error) {
      logger.error('Error en Taller.create():', error);
      throw error;
    }
  }

  // Actualizar taller
  static async update(id, tallerData) {
    const {
      nombre, descripcion, direccion, telefono, email,
      latitud, longitud, horario_apertura, horario_cierre,
      dias_trabajo, servicios_ofrecidos, estado
    } = tallerData;

    const sql = `
      UPDATE talleres SET
        nombre = COALESCE(?, nombre),
        descripcion = COALESCE(?, descripcion),
        direccion = COALESCE(?, direccion),
        telefono = COALESCE(?, telefono),
        email = COALESCE(?, email),
        latitud = COALESCE(?, latitud),
        longitud = COALESCE(?, longitud),
        horario_apertura = COALESCE(?, horario_apertura),
        horario_cierre = COALESCE(?, horario_cierre),
        dias_trabajo = COALESCE(?, dias_trabajo),
        servicios_ofrecidos = COALESCE(?, servicios_ofrecidos),
        estado = COALESCE(?, estado),
        fecha_actualizacion = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    const params = [
      nombre, descripcion, direccion, telefono, email,
      latitud, longitud, horario_apertura, horario_cierre,
      dias_trabajo ? JSON.stringify(dias_trabajo) : null,
      servicios_ofrecidos ? JSON.stringify(servicios_ofrecidos) : null,
      estado, id
    ];

    try {
      const result = await query(sql, params);
      logger.info(`Taller ${id} actualizado`);
      return result.affectedRows > 0;
    } catch (error) {
      logger.error('Error en Taller.update():', error);
      throw error;
    }
  }

  // Eliminar taller (soft delete)
  static async delete(id) {
    const sql = 'UPDATE talleres SET estado = "inactivo" WHERE id = ?';

    try {
      const result = await query(sql, [id]);
      logger.info(`Taller ${id} eliminado (soft delete)`);
      return result.affectedRows > 0;
    } catch (error) {
      logger.error('Error en Taller.delete():', error);
      throw error;
    }
  }

  // Verificar si el usuario es propietario del taller
  static async isOwner(tallerId, usuarioDocumento) {
    const sql = 'SELECT id FROM talleres WHERE id = ? AND usuario_propietario = ?';
    
    try {
      const rows = await query(sql, [tallerId, usuarioDocumento]);
      return rows.length > 0;
    } catch (error) {
      logger.error('Error en Taller.isOwner():', error);
      throw error;
    }
  }

  // Obtener talleres por propietario
  static async getByOwner(usuarioDocumento) {
    const sql = `
      SELECT 
        t.*,
        COUNT(e.id) as total_evaluaciones_realizadas,
        AVG(e.calificacion_servicio) as calificacion_promedio_real
      FROM talleres t
      LEFT JOIN evaluaciones_taller e ON t.id = e.taller_id
      WHERE t.usuario_propietario = ?
      GROUP BY t.id
      ORDER BY t.fecha_creacion DESC
    `;

    try {
      const rows = await query(sql, [usuarioDocumento]);
      return rows;
    } catch (error) {
      logger.error('Error en Taller.getByOwner():', error);
      throw error;
    }
  }

  // Actualizar calificación promedio (llamado por trigger)
  static async updateRating(tallerId) {
    const sql = `
      UPDATE talleres SET
        calificacion_promedio = (
          SELECT COALESCE(AVG(calificacion_servicio), 0)
          FROM evaluaciones_taller
          WHERE taller_id = ? AND calificacion_servicio IS NOT NULL
        ),
        total_evaluaciones = (
          SELECT COUNT(*)
          FROM evaluaciones_taller
          WHERE taller_id = ? AND calificacion_servicio IS NOT NULL
        )
      WHERE id = ?
    `;

    try {
      await query(sql, [tallerId, tallerId, tallerId]);
      logger.info(`Calificación del taller ${tallerId} actualizada`);
    } catch (error) {
      logger.error('Error en Taller.updateRating():', error);
      throw error;
    }
  }
}
