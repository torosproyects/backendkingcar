import { query, transaction } from '../config/database.js';
import { logger } from '../utils/logger.js';

export default class Evaluacion {
  // Obtener todas las evaluaciones con filtros
  static async getAll(filters = {}) {
    const { 
      taller_id, usuario_solicitante, estado, 
      fecha_desde, fecha_hasta, limit = 50, offset = 0 
    } = filters;
    
    let whereClause = 'WHERE 1=1';
    const params = [];

    if (taller_id) {
      whereClause += ' AND e.taller_id = ?';
      params.push(taller_id);
    }

    if (usuario_solicitante) {
      whereClause += ' AND e.usuario_solicitante = ?';
      params.push(usuario_solicitante);
    }

    if (estado) {
      whereClause += ' AND e.estado = ?';
      params.push(estado);
    }

    if (fecha_desde) {
      whereClause += ' AND e.fecha_evaluacion >= ?';
      params.push(fecha_desde);
    }

    if (fecha_hasta) {
      whereClause += ' AND e.fecha_evaluacion <= ?';
      params.push(fecha_hasta);
    }

    const sql = `
      SELECT 
        e.id, e.taller_id, e.carro_id, e.usuario_solicitante,
        e.tipo_evaluacion, e.fecha_evaluacion, e.hora_evaluacion, e.estado,
        e.kilometraje_actual, e.nivel_aceite, e.nivel_refrigerante,
        e.estado_frenos, e.estado_neumaticos, e.estado_bateria, e.estado_motor,
        e.observaciones_generales, e.problemas_detectados, e.recomendaciones_urgentes,
        e.costo_estimado, e.calificacion_servicio, e.comentario_cliente,
        t.nombre as taller_nombre, t.direccion as taller_direccion,
        CONCAT(m.nombre, ' ', mo.nombre) as vehiculo_info,
        c.placa as vehiculo_placa, c.year as vehiculo_year,
        u.nombre as cliente_nombre, u.apellido as cliente_apellido,
        e.fecha_creacion, e.fecha_actualizacion
      FROM evaluaciones_taller e
      JOIN talleres t ON e.taller_id = t.id
      JOIN carrosx c ON e.carro_id = c.id
      JOIN modelos mo ON c.modelo_id = mo.id
      JOIN marcas m ON mo.marca_id = m.id
      JOIN usuario u ON e.usuario_solicitante = u.documento
      ${whereClause}
      ORDER BY e.fecha_evaluacion DESC, e.hora_evaluacion DESC
      LIMIT ? OFFSET ?
    `;
    
    params.push(limit, offset);

    try {
      const rows = await query(sql, params);
      return rows;
    } catch (error) {
      logger.error('Error en Evaluacion.getAll():', error);
      throw error;
    }
  }

  // Obtener evaluación por ID
  static async getById(id) {
    const sql = `
      SELECT 
        e.*,
        t.nombre as taller_nombre, t.direccion as taller_direccion, t.telefono as taller_telefono,
        CONCAT(m.nombre, ' ', mo.nombre) as vehiculo_info,
        c.placa as vehiculo_placa, c.year as vehiculo_year, c.color as vehiculo_color,
        u.nombre as cliente_nombre, u.apellido as cliente_apellido, u.telefono as cliente_telefono
      FROM evaluaciones_taller e
      JOIN talleres t ON e.taller_id = t.id
      JOIN carrosx c ON e.carro_id = c.id
      JOIN modelos mo ON c.modelo_id = mo.id
      JOIN marcas m ON mo.marca_id = m.id
      JOIN usuario u ON e.usuario_solicitante = u.documento
      WHERE e.id = ?
    `;

    try {
      const rows = await query(sql, [id]);
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      logger.error('Error en Evaluacion.getById():', error);
      throw error;
    }
  }

  // Crear nueva evaluación
  static async create(evaluacionData) {
    const {
      taller_id, carro_id, usuario_solicitante, tipo_evaluacion,
      fecha_evaluacion, hora_evaluacion, kilometraje_actual,
      observaciones_generales, estado = 'en_evaluacion',
      evaluacion_entrada, pruebas_tecnicas, evaluacion_final,
      nivel_aceite, nivel_refrigerante, estado_frenos,
      estado_neumaticos, estado_bateria, estado_motor,
      problemas_detectados, recomendaciones_urgentes, costo_estimado
    } = evaluacionData;

    const sql = `
      INSERT INTO evaluaciones_taller (
        taller_id, carro_id, usuario_solicitante, tipo_evaluacion,
        fecha_evaluacion, hora_evaluacion, kilometraje_actual,
        observaciones_generales, estado, evaluacion_entrada,
        pruebas_tecnicas, evaluacion_final, nivel_aceite, 
        nivel_refrigerante, estado_frenos, estado_neumaticos, 
        estado_bateria, estado_motor, problemas_detectados,
        recomendaciones_urgentes, costo_estimado, fecha_creacion, fecha_actualizacion
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;

    const params = [
      taller_id, carro_id, usuario_solicitante, tipo_evaluacion,
      fecha_evaluacion, hora_evaluacion, kilometraje_actual,
      observaciones_generales, estado,
      evaluacion_entrada ? JSON.stringify(evaluacion_entrada) : null,
      pruebas_tecnicas ? JSON.stringify(pruebas_tecnicas) : null,
      evaluacion_final ? JSON.stringify(evaluacion_final) : null,
      nivel_aceite, nivel_refrigerante, estado_frenos,
      estado_neumaticos, estado_bateria, estado_motor,
      problemas_detectados ? JSON.stringify(problemas_detectados) : null,
      recomendaciones_urgentes ? JSON.stringify(recomendaciones_urgentes) : null,
      costo_estimado
    ];

    try {
      const result = await query(sql, params);
      logger.info(`Evaluación creada con ID: ${result.insertId}`);
      return result.insertId;
    } catch (error) {
      logger.error('Error en Evaluacion.create():', error);
      throw error;
    }
  }

  // Actualizar evaluación
  static async update(id, evaluacionData) {
    const {
      tipo_evaluacion, fecha_evaluacion, hora_evaluacion, estado,
      kilometraje_actual, observaciones_generales, evaluacion_entrada,
      pruebas_tecnicas, evaluacion_final, nivel_aceite, nivel_refrigerante,
      estado_frenos, estado_neumaticos, estado_bateria, estado_motor,
      problemas_detectados, recomendaciones_urgentes, costo_estimado,
      calificacion_servicio, comentario_cliente
    } = evaluacionData;

    const sql = `
      UPDATE evaluaciones_taller SET
        tipo_evaluacion = COALESCE(?, tipo_evaluacion),
        fecha_evaluacion = COALESCE(?, fecha_evaluacion),
        hora_evaluacion = COALESCE(?, hora_evaluacion),
        estado = COALESCE(?, estado),
        kilometraje_actual = COALESCE(?, kilometraje_actual),
        observaciones_generales = COALESCE(?, observaciones_generales),
        evaluacion_entrada = COALESCE(?, evaluacion_entrada),
        pruebas_tecnicas = COALESCE(?, pruebas_tecnicas),
        evaluacion_final = COALESCE(?, evaluacion_final),
        nivel_aceite = COALESCE(?, nivel_aceite),
        nivel_refrigerante = COALESCE(?, nivel_refrigerante),
        estado_frenos = COALESCE(?, estado_frenos),
        estado_neumaticos = COALESCE(?, estado_neumaticos),
        estado_bateria = COALESCE(?, estado_bateria),
        estado_motor = COALESCE(?, estado_motor),
        problemas_detectados = COALESCE(?, problemas_detectados),
        recomendaciones_urgentes = COALESCE(?, recomendaciones_urgentes),
        costo_estimado = COALESCE(?, costo_estimado),
        calificacion_servicio = COALESCE(?, calificacion_servicio),
        comentario_cliente = COALESCE(?, comentario_cliente),
        fecha_actualizacion = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    const params = [
      tipo_evaluacion, fecha_evaluacion, hora_evaluacion, estado,
      kilometraje_actual, observaciones_generales,
      evaluacion_entrada ? JSON.stringify(evaluacion_entrada) : null,
      pruebas_tecnicas ? JSON.stringify(pruebas_tecnicas) : null,
      evaluacion_final ? JSON.stringify(evaluacion_final) : null,
      nivel_aceite, nivel_refrigerante, estado_frenos,
      estado_neumaticos, estado_bateria, estado_motor,
      problemas_detectados ? JSON.stringify(problemas_detectados) : null,
      recomendaciones_urgentes ? JSON.stringify(recomendaciones_urgentes) : null,
      costo_estimado, calificacion_servicio, comentario_cliente, id
    ];

    try {
      const result = await query(sql, params);
      logger.info(`Evaluación ${id} actualizada`);
      return result.affectedRows > 0;
    } catch (error) {
      logger.error('Error en Evaluacion.update():', error);
      throw error;
    }
  }

  // Eliminar evaluación
  static async delete(id) {
    const sql = 'DELETE FROM evaluaciones_taller WHERE id = ?';

    try {
      const result = await query(sql, [id]);
      logger.info(`Evaluación ${id} eliminada`);
      return result.affectedRows > 0;
    } catch (error) {
      logger.error('Error en Evaluacion.delete():', error);
      throw error;
    }
  }

  // Verificar si el usuario puede acceder a la evaluación
  static async canAccess(evaluacionId, usuarioDocumento) {
    const sql = `
      SELECT id FROM evaluaciones_taller 
      WHERE id = ? AND (
        usuario_solicitante = ? OR 
        taller_id IN (SELECT id FROM talleres WHERE usuario_propietario = ?)
      )
    `;
    
    try {
      const rows = await query(sql, [evaluacionId, usuarioDocumento, usuarioDocumento]);
      return rows.length > 0;
    } catch (error) {
      logger.error('Error en Evaluacion.canAccess():', error);
      throw error;
    }
  }

  // Obtener evaluaciones por taller
  static async getByTaller(tallerId, limit = 20, offset = 0) {
    const sql = `
      SELECT 
        e.*,
        CONCAT(m.nombre, ' ', mo.nombre) as vehiculo_info,
        c.placa as vehiculo_placa,
        u.nombre as cliente_nombre, u.apellido as cliente_apellido
      FROM evaluaciones_taller e
      JOIN carrosx c ON e.carro_id = c.id
      JOIN modelos mo ON c.modelo_id = mo.id
      JOIN marcas m ON mo.marca_id = m.id
      JOIN usuario u ON e.usuario_solicitante = u.documento
      WHERE e.taller_id = ?
      ORDER BY e.fecha_evaluacion DESC
      LIMIT ? OFFSET ?
    `;

    try {
      const rows = await query(sql, [tallerId, limit, offset]);
      return rows;
    } catch (error) {
      logger.error('Error en Evaluacion.getByTaller():', error);
      throw error;
    }
  }

  // Obtener evaluaciones por usuario
  static async getByUser(usuarioDocumento, limit = 20, offset = 0) {
    const sql = `
      SELECT 
        e.*,
        t.nombre as taller_nombre, t.direccion as taller_direccion,
        CONCAT(m.nombre, ' ', mo.nombre) as vehiculo_info,
        c.placa as vehiculo_placa
      FROM evaluaciones_taller e
      JOIN talleres t ON e.taller_id = t.id
      JOIN carrosx c ON e.carro_id = c.id
      JOIN modelos mo ON c.modelo_id = mo.id
      JOIN marcas m ON mo.marca_id = m.id
      WHERE e.usuario_solicitante = ?
      ORDER BY e.fecha_evaluacion DESC
      LIMIT ? OFFSET ?
    `;

    try {
      const rows = await query(sql, [usuarioDocumento, limit, offset]);
      return rows;
    } catch (error) {
      logger.error('Error en Evaluacion.getByUser():', error);
      throw error;
    }
  }

  // Completar evaluación (cambiar estado a completada)
  static async complete(id, calificacionServicio, comentarioCliente) {
    const sql = `
      UPDATE evaluaciones_taller SET
        estado = 'completada',
        calificacion_servicio = ?,
        comentario_cliente = ?,
        fecha_actualizacion = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    try {
      const result = await query(sql, [calificacionServicio, comentarioCliente, id]);
      logger.info(`Evaluación ${id} completada`);
      return result.affectedRows > 0;
    } catch (error) {
      logger.error('Error en Evaluacion.complete():', error);
      throw error;
    }
  }
}
