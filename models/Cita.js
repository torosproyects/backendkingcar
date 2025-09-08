import { query, transaction } from '../config/database.js';
import { logger } from '../utils/logger.js';

export default class Cita {
  // Obtener todas las citas con filtros
  static async getAll(filters = {}) {
    const { 
      taller_id, usuario_cliente, estado, tipo_cita,
      fecha_desde, fecha_hasta, limit = 50, offset = 0 
    } = filters;
    
    let whereClause = 'WHERE 1=1';
    const params = [];

    if (taller_id) {
      whereClause += ' AND c.taller_id = ?';
      params.push(taller_id);
    }

    if (usuario_cliente) {
      whereClause += ' AND c.usuario_cliente = ?';
      params.push(usuario_cliente);
    }

    if (estado) {
      whereClause += ' AND c.estado = ?';
      params.push(estado);
    }

    if (tipo_cita) {
      whereClause += ' AND c.tipo_cita = ?';
      params.push(tipo_cita);
    }

    if (fecha_desde) {
      whereClause += ' AND c.fecha_cita >= ?';
      params.push(fecha_desde);
    }

    if (fecha_hasta) {
      whereClause += ' AND c.fecha_cita <= ?';
      params.push(fecha_hasta);
    }

    const sql = `
      SELECT 
        c.id, c.taller_id, c.carro_id, c.usuario_cliente,
        c.tipo_cita, c.fecha_cita, c.hora_inicio, c.hora_fin,
        c.estado, c.descripcion_problema, c.servicios_solicitados,
        c.costo_estimado, c.costo_final, c.telefono_contacto,
        c.email_contacto, c.notas_taller, c.notas_cliente,
        c.recordatorio_enviado, c.fecha_recordatorio,
        c.calificacion_atencion, c.calificacion_calidad, c.comentario_cliente,
        t.nombre as taller_nombre, t.direccion as taller_direccion, t.telefono as taller_telefono,
        CONCAT(m.nombre, ' ', mo.nombre) as vehiculo_info,
        car.placa as vehiculo_placa, car.year as vehiculo_year,
        u.nombre as cliente_nombre, u.apellido as cliente_apellido,
        c.fecha_creacion, c.fecha_actualizacion
      FROM citas_taller c
      JOIN talleres t ON c.taller_id = t.id
      JOIN carrosx car ON c.carro_id = car.id
      JOIN modelos mo ON car.modelo_id = mo.id
      JOIN marcas m ON mo.marca_id = m.id
      JOIN usuario u ON c.usuario_cliente = u.documento
      ${whereClause}
      ORDER BY c.fecha_cita DESC, c.hora_inicio DESC
      LIMIT ? OFFSET ?
    `;
    
    params.push(limit, offset);

    try {
      const rows = await query(sql, params);
      return rows;
    } catch (error) {
      logger.error('Error en Cita.getAll():', error);
      throw error;
    }
  }

  // Obtener cita por ID
  static async getById(id) {
    const sql = `
      SELECT 
        c.*,
        t.nombre as taller_nombre, t.direccion as taller_direccion, t.telefono as taller_telefono,
        CONCAT(m.nombre, ' ', mo.nombre) as vehiculo_info,
        car.placa as vehiculo_placa, car.year as vehiculo_year, car.color as vehiculo_color,
        u.nombre as cliente_nombre, u.apellido as cliente_apellido, u.telefono as cliente_telefono
      FROM citas_taller c
      JOIN talleres t ON c.taller_id = t.id
      JOIN carrosx car ON c.carro_id = car.id
      JOIN modelos mo ON car.modelo_id = mo.id
      JOIN marcas m ON mo.marca_id = m.id
      JOIN usuario u ON c.usuario_cliente = u.documento
      WHERE c.id = ?
    `;

    try {
      const rows = await query(sql, [id]);
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      logger.error('Error en Cita.getById():', error);
      throw error;
    }
  }

  // Crear nueva cita
  static async create(citaData) {
    const {
      taller_id, carro_id, usuario_cliente, tipo_cita,
      fecha_cita, hora_inicio, hora_fin, descripcion_problema,
      servicios_solicitados, costo_estimado, telefono_contacto,
      email_contacto, notas_cliente, estado = 'pendiente'
    } = citaData;

    const sql = `
      INSERT INTO citas_taller (
        taller_id, carro_id, usuario_cliente, tipo_cita,
        fecha_cita, hora_inicio, hora_fin, descripcion_problema,
        servicios_solicitados, costo_estimado, telefono_contacto,
        email_contacto, notas_cliente, estado, fecha_creacion, fecha_actualizacion
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;

    const params = [
      taller_id, carro_id, usuario_cliente, tipo_cita,
      fecha_cita, hora_inicio, hora_fin, descripcion_problema,
      servicios_solicitados ? JSON.stringify(servicios_solicitados) : null,
      costo_estimado, telefono_contacto, email_contacto, notas_cliente, estado
    ];

    try {
      const result = await query(sql, params);
      logger.info(`Cita creada con ID: ${result.insertId}`);
      return result.insertId;
    } catch (error) {
      logger.error('Error en Cita.create():', error);
      throw error;
    }
  }

  // Actualizar cita
  static async update(id, citaData) {
    const {
      tipo_cita, fecha_cita, hora_inicio, hora_fin, estado,
      descripcion_problema, servicios_solicitados,
      costo_estimado, costo_final, telefono_contacto,
      email_contacto, notas_taller, notas_cliente,
      recordatorio_enviado, fecha_recordatorio,
      calificacion_atencion, calificacion_calidad, comentario_cliente
    } = citaData;

    const sql = `
      UPDATE citas_taller SET
        tipo_cita = COALESCE(?, tipo_cita),
        fecha_cita = COALESCE(?, fecha_cita),
        hora_inicio = COALESCE(?, hora_inicio),
        hora_fin = COALESCE(?, hora_fin),
        estado = COALESCE(?, estado),
        descripcion_problema = COALESCE(?, descripcion_problema),
        servicios_solicitados = COALESCE(?, servicios_solicitados),
        costo_estimado = COALESCE(?, costo_estimado),
        costo_final = COALESCE(?, costo_final),
        telefono_contacto = COALESCE(?, telefono_contacto),
        email_contacto = COALESCE(?, email_contacto),
        notas_taller = COALESCE(?, notas_taller),
        notas_cliente = COALESCE(?, notas_cliente),
        recordatorio_enviado = COALESCE(?, recordatorio_enviado),
        fecha_recordatorio = COALESCE(?, fecha_recordatorio),
        calificacion_atencion = COALESCE(?, calificacion_atencion),
        calificacion_calidad = COALESCE(?, calificacion_calidad),
        comentario_cliente = COALESCE(?, comentario_cliente),
        fecha_actualizacion = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    const params = [
      tipo_cita, fecha_cita, hora_inicio, hora_fin, estado,
      descripcion_problema,
      servicios_solicitados ? JSON.stringify(servicios_solicitados) : null,
      costo_estimado, costo_final, telefono_contacto,
      email_contacto, notas_taller, notas_cliente,
      recordatorio_enviado, fecha_recordatorio,
      calificacion_atencion, calificacion_calidad, comentario_cliente, id
    ];

    try {
      const result = await query(sql, params);
      logger.info(`Cita ${id} actualizada`);
      return result.affectedRows > 0;
    } catch (error) {
      logger.error('Error en Cita.update():', error);
      throw error;
    }
  }

  // Eliminar cita
  static async delete(id) {
    const sql = 'DELETE FROM citas_taller WHERE id = ?';

    try {
      const result = await query(sql, [id]);
      logger.info(`Cita ${id} eliminada`);
      return result.affectedRows > 0;
    } catch (error) {
      logger.error('Error en Cita.delete():', error);
      throw error;
    }
  }

  // Verificar si el usuario puede acceder a la cita
  static async canAccess(citaId, usuarioDocumento) {
    const sql = `
      SELECT id FROM citas_taller 
      WHERE id = ? AND (
        usuario_cliente = ? OR 
        taller_id IN (SELECT id FROM talleres WHERE usuario_propietario = ?)
      )
    `;
    
    try {
      const rows = await query(sql, [citaId, usuarioDocumento, usuarioDocumento]);
      return rows.length > 0;
    } catch (error) {
      logger.error('Error en Cita.canAccess():', error);
      throw error;
    }
  }

  // Obtener citas por taller
  static async getByTaller(tallerId, fecha = null, limit = 20, offset = 0) {
    let whereClause = 'WHERE c.taller_id = ?';
    const params = [tallerId];

    if (fecha) {
      whereClause += ' AND c.fecha_cita = ?';
      params.push(fecha);
    }

    const sql = `
      SELECT 
        c.*,
        CONCAT(m.nombre, ' ', mo.nombre) as vehiculo_info,
        car.placa as vehiculo_placa,
        u.nombre as cliente_nombre, u.apellido as cliente_apellido
      FROM citas_taller c
      JOIN carrosx car ON c.carro_id = car.id
      JOIN modelos mo ON car.modelo_id = mo.id
      JOIN marcas m ON mo.marca_id = m.id
      JOIN usuario u ON c.usuario_cliente = u.documento
      ${whereClause}
      ORDER BY c.fecha_cita ASC, c.hora_inicio ASC
      LIMIT ? OFFSET ?
    `;

    params.push(limit, offset);

    try {
      const rows = await query(sql, params);
      return rows;
    } catch (error) {
      logger.error('Error en Cita.getByTaller():', error);
      throw error;
    }
  }

  // Obtener citas por usuario
  static async getByUser(usuarioDocumento, limit = 20, offset = 0) {
    const sql = `
      SELECT 
        c.*,
        t.nombre as taller_nombre, t.direccion as taller_direccion,
        CONCAT(m.nombre, ' ', mo.nombre) as vehiculo_info,
        car.placa as vehiculo_placa
      FROM citas_taller c
      JOIN talleres t ON c.taller_id = t.id
      JOIN carrosx car ON c.carro_id = car.id
      JOIN modelos mo ON car.modelo_id = mo.id
      JOIN marcas m ON mo.marca_id = m.id
      WHERE c.usuario_cliente = ?
      ORDER BY c.fecha_cita DESC, c.hora_inicio DESC
      LIMIT ? OFFSET ?
    `;

    try {
      const rows = await query(sql, [usuarioDocumento, limit, offset]);
      return rows;
    } catch (error) {
      logger.error('Error en Cita.getByUser():', error);
      throw error;
    }
  }

  // Verificar disponibilidad de horario
  static async checkAvailability(tallerId, fecha, horaInicio, horaFin) {
    const sql = `
      SELECT COUNT(*) as citas_existentes
      FROM citas_taller
      WHERE taller_id = ? 
        AND fecha_cita = ?
        AND estado IN ('programada', 'confirmada', 'en_proceso')
        AND (
          (hora_inicio < ? AND hora_fin > ?) OR
          (hora_inicio < ? AND hora_fin > ?) OR
          (hora_inicio >= ? AND hora_fin <= ?)
        )
    `;

    try {
      const rows = await query(sql, [
        tallerId, fecha, horaFin, horaInicio, horaInicio, horaFin, horaInicio, horaFin
      ]);
      return rows[0].citas_existentes === 0;
    } catch (error) {
      logger.error('Error en Cita.checkAvailability():', error);
      throw error;
    }
  }

  // Confirmar cita
  static async confirm(id) {
    const sql = `
      UPDATE citas_taller SET
        estado = 'confirmada',
        fecha_actualizacion = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    try {
      const result = await query(sql, [id]);
      logger.info(`Cita ${id} confirmada`);
      return result.affectedRows > 0;
    } catch (error) {
      logger.error('Error en Cita.confirm():', error);
      throw error;
    }
  }

  // Cancelar cita
  static async cancel(id, motivo = null) {
    const sql = `
      UPDATE citas_taller SET
        estado = 'cancelada',
        notas_taller = COALESCE(?, notas_taller),
        fecha_actualizacion = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    try {
      const result = await query(sql, [motivo, id]);
      logger.info(`Cita ${id} cancelada`);
      return result.affectedRows > 0;
    } catch (error) {
      logger.error('Error en Cita.cancel():', error);
      throw error;
    }
  }

  // Completar cita
  static async complete(id, costoFinal, notasTaller) {
    const sql = `
      UPDATE citas_taller SET
        estado = 'completada',
        costo_final = ?,
        notas_taller = ?,
        fecha_actualizacion = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    try {
      const result = await query(sql, [costoFinal, notasTaller, id]);
      logger.info(`Cita ${id} completada`);
      return result.affectedRows > 0;
    } catch (error) {
      logger.error('Error en Cita.complete():', error);
      throw error;
    }
  }

  // Calificar cita
  static async rate(id, calificacionAtencion, calificacionCalidad, comentarioCliente) {
    const sql = `
      UPDATE citas_taller SET
        calificacion_atencion = ?,
        calificacion_calidad = ?,
        comentario_cliente = ?,
        fecha_actualizacion = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    try {
      const result = await query(sql, [calificacionAtencion, calificacionCalidad, comentarioCliente, id]);
      logger.info(`Cita ${id} calificada`);
      return result.affectedRows > 0;
    } catch (error) {
      logger.error('Error en Cita.rate():', error);
      throw error;
    }
  }

  // Obtener citas próximas (para recordatorios)
  static async getUpcoming(horasAntes = 24) {
    const sql = `
      SELECT 
        c.*,
        t.nombre as taller_nombre, t.telefono as taller_telefono,
        u.nombre as cliente_nombre, u.apellido as cliente_apellido,
        u.telefono as cliente_telefono, u.email as cliente_email
      FROM citas_taller c
      JOIN talleres t ON c.taller_id = t.id
      JOIN usuario u ON c.usuario_cliente = u.documento
      WHERE c.estado IN ('programada', 'confirmada')
        AND c.fecha_cita = CURDATE()
        AND c.hora_inicio BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL ? HOUR)
        AND c.recordatorio_enviado = 0
    `;

    try {
      const rows = await query(sql, [horasAntes]);
      return rows;
    } catch (error) {
      logger.error('Error en Cita.getUpcoming():', error);
      throw error;
    }
  }

  // Marcar recordatorio como enviado
  static async markReminderSent(id) {
    const sql = `
      UPDATE citas_taller SET
        recordatorio_enviado = 1,
        fecha_recordatorio = NOW(),
        fecha_actualizacion = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    try {
      const result = await query(sql, [id]);
      return result.affectedRows > 0;
    } catch (error) {
      logger.error('Error en Cita.markReminderSent():', error);
      throw error;
    }
  }
}
