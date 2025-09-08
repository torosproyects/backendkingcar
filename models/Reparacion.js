import { query, transaction } from '../config/database.js';
import { logger } from '../utils/logger.js';

export default class Reparacion {
  // Obtener todas las reparaciones con filtros
  static async getAll(filters = {}) {
    const { 
      evaluacion_id, tipo_reparacion, prioridad, estado,
      componente, limit = 50, offset = 0 
    } = filters;
    
    let whereClause = 'WHERE 1=1';
    const params = [];

    if (evaluacion_id) {
      whereClause += ' AND r.evaluacion_id = ?';
      params.push(evaluacion_id);
    }

    if (tipo_reparacion) {
      whereClause += ' AND r.tipo_reparacion = ?';
      params.push(tipo_reparacion);
    }

    if (prioridad) {
      whereClause += ' AND r.prioridad = ?';
      params.push(prioridad);
    }

    if (estado) {
      whereClause += ' AND r.estado = ?';
      params.push(estado);
    }

    if (componente) {
      whereClause += ' AND r.componente LIKE ?';
      params.push(`%${componente}%`);
    }

    const sql = `
      SELECT 
        r.id, r.evaluacion_id, r.tipo_reparacion, r.componente,
        r.descripcion_problema, r.descripcion_solucion, r.prioridad,
        r.costo_estimado, r.tiempo_estimado_horas, r.kilometraje_recomendado,
        r.estado, r.fecha_aceptacion, r.fecha_completado,
        r.proveedor_recomendado, r.garantia_meses, r.notas_adicionales,
        e.taller_id, e.carro_id, e.usuario_solicitante,
        t.nombre as taller_nombre,
        CONCAT(m.nombre, ' ', mo.nombre) as vehiculo_info,
        c.placa as vehiculo_placa,
        u.nombre as cliente_nombre, u.apellido as cliente_apellido,
        r.fecha_creacion, r.fecha_actualizacion
      FROM reparaciones_recomendadas r
      JOIN evaluaciones_taller e ON r.evaluacion_id = e.id
      JOIN talleres t ON e.taller_id = t.id
      JOIN carrosx c ON e.carro_id = c.id
      JOIN modelos mo ON c.modelo_id = mo.id
      JOIN marcas m ON mo.marca_id = m.id
      JOIN usuario u ON e.usuario_solicitante = u.documento
      ${whereClause}
      ORDER BY r.prioridad DESC, r.fecha_creacion DESC
      LIMIT ? OFFSET ?
    `;
    
    params.push(limit, offset);

    try {
      const rows = await query(sql, params);
      return rows;
    } catch (error) {
      logger.error('Error en Reparacion.getAll():', error);
      throw error;
    }
  }

  // Obtener reparación por ID
  static async getById(id) {
    const sql = `
      SELECT 
        r.*,
        e.taller_id, e.carro_id, e.usuario_solicitante,
        t.nombre as taller_nombre, t.direccion as taller_direccion,
        CONCAT(m.nombre, ' ', mo.nombre) as vehiculo_info,
        c.placa as vehiculo_placa, c.year as vehiculo_year,
        u.nombre as cliente_nombre, u.apellido as cliente_apellido
      FROM reparaciones_recomendadas r
      JOIN evaluaciones_taller e ON r.evaluacion_id = e.id
      JOIN talleres t ON e.taller_id = t.id
      JOIN carrosx c ON e.carro_id = c.id
      JOIN modelos mo ON c.modelo_id = mo.id
      JOIN marcas m ON mo.marca_id = m.id
      JOIN usuario u ON e.usuario_solicitante = u.documento
      WHERE r.id = ?
    `;

    try {
      const rows = await query(sql, [id]);
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      logger.error('Error en Reparacion.getById():', error);
      throw error;
    }
  }

  // Crear nueva reparación recomendada
  static async create(reparacionData) {
    const {
      evaluacion_id, nombre, descripcion, prioridad,
      montoEstimado, tiempoEstimado, categoria,
      estado = 'pendiente', tipo_reparacion, componente,
      descripcion_problema, descripcion_solucion, costo_estimado,
      tiempo_estimado_horas, kilometraje_recomendado,
      proveedor_recomendado, garantia_meses, notas_adicionales
    } = reparacionData;

    const sql = `
      INSERT INTO reparaciones_recomendadas (
        evaluacion_id, nombre, descripcion, prioridad,
        monto_estimado, tiempo_estimado, categoria, estado,
        tipo_reparacion, componente, descripcion_problema, 
        descripcion_solucion, costo_estimado, tiempo_estimado_horas, 
        kilometraje_recomendado, proveedor_recomendado, 
        garantia_meses, notas_adicionales, fecha_creacion, fecha_actualizacion
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;

    const params = [
      evaluacion_id, nombre, descripcion, prioridad,
      montoEstimado || costo_estimado, tiempoEstimado || tiempo_estimado_horas, categoria, estado,
      tipo_reparacion, componente, descripcion_problema,
      descripcion_solucion, costo_estimado, tiempo_estimado_horas,
      kilometraje_recomendado, proveedor_recomendado,
      garantia_meses, notas_adicionales
    ];

    try {
      const result = await query(sql, params);
      logger.info(`Reparación recomendada creada con ID: ${result.insertId}`);
      return result.insertId;
    } catch (error) {
      logger.error('Error en Reparacion.create():', error);
      throw error;
    }
  }

  // Actualizar reparación
  static async update(id, reparacionData) {
    const {
      tipo_reparacion, componente, descripcion_problema,
      descripcion_solucion, prioridad, costo_estimado,
      tiempo_estimado_horas, kilometraje_recomendado, estado,
      proveedor_recomendado, garantia_meses, notas_adicionales
    } = reparacionData;

    const sql = `
      UPDATE reparaciones_recomendadas SET
        tipo_reparacion = COALESCE(?, tipo_reparacion),
        componente = COALESCE(?, componente),
        descripcion_problema = COALESCE(?, descripcion_problema),
        descripcion_solucion = COALESCE(?, descripcion_solucion),
        prioridad = COALESCE(?, prioridad),
        costo_estimado = COALESCE(?, costo_estimado),
        tiempo_estimado_horas = COALESCE(?, tiempo_estimado_horas),
        kilometraje_recomendado = COALESCE(?, kilometraje_recomendado),
        estado = COALESCE(?, estado),
        proveedor_recomendado = COALESCE(?, proveedor_recomendado),
        garantia_meses = COALESCE(?, garantia_meses),
        notas_adicionales = COALESCE(?, notas_adicionales),
        fecha_actualizacion = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    const params = [
      tipo_reparacion, componente, descripcion_problema,
      descripcion_solucion, prioridad, costo_estimado,
      tiempo_estimado_horas, kilometraje_recomendado, estado,
      proveedor_recomendado, garantia_meses, notas_adicionales, id
    ];

    try {
      const result = await query(sql, params);
      logger.info(`Reparación ${id} actualizada`);
      return result.affectedRows > 0;
    } catch (error) {
      logger.error('Error en Reparacion.update():', error);
      throw error;
    }
  }

  // Eliminar reparación
  static async delete(id) {
    const sql = 'DELETE FROM reparaciones_recomendadas WHERE id = ?';

    try {
      const result = await query(sql, [id]);
      logger.info(`Reparación ${id} eliminada`);
      return result.affectedRows > 0;
    } catch (error) {
      logger.error('Error en Reparacion.delete():', error);
      throw error;
    }
  }

  // Verificar si el usuario puede acceder a la reparación
  static async canAccess(reparacionId, usuarioDocumento) {
    const sql = `
      SELECT r.id FROM reparaciones_recomendadas r
      JOIN evaluaciones_taller e ON r.evaluacion_id = e.id
      WHERE r.id = ? AND (
        e.usuario_solicitante = ? OR 
        e.taller_id IN (SELECT id FROM talleres WHERE usuario_propietario = ?)
      )
    `;
    
    try {
      const rows = await query(sql, [reparacionId, usuarioDocumento, usuarioDocumento]);
      return rows.length > 0;
    } catch (error) {
      logger.error('Error en Reparacion.canAccess():', error);
      throw error;
    }
  }

  // Obtener reparaciones por evaluación
  static async getByEvaluacion(evaluacionId) {
    const sql = `
      SELECT 
        r.*,
        e.taller_id, e.carro_id,
        t.nombre as taller_nombre
      FROM reparaciones_recomendadas r
      JOIN evaluaciones_taller e ON r.evaluacion_id = e.id
      JOIN talleres t ON e.taller_id = t.id
      WHERE r.evaluacion_id = ?
      ORDER BY r.prioridad DESC, r.fecha_creacion ASC
    `;

    try {
      const rows = await query(sql, [evaluacionId]);
      return rows;
    } catch (error) {
      logger.error('Error en Reparacion.getByEvaluacion():', error);
      throw error;
    }
  }

  // Obtener reparaciones por usuario
  static async getByUser(usuarioDocumento, limit = 20, offset = 0) {
    const sql = `
      SELECT 
        r.*,
        e.taller_id, e.carro_id,
        t.nombre as taller_nombre,
        CONCAT(m.nombre, ' ', mo.nombre) as vehiculo_info,
        c.placa as vehiculo_placa
      FROM reparaciones_recomendadas r
      JOIN evaluaciones_taller e ON r.evaluacion_id = e.id
      JOIN talleres t ON e.taller_id = t.id
      JOIN carrosx c ON e.carro_id = c.id
      JOIN modelos mo ON c.modelo_id = mo.id
      JOIN marcas m ON mo.marca_id = m.id
      WHERE e.usuario_solicitante = ?
      ORDER BY r.prioridad DESC, r.fecha_creacion DESC
      LIMIT ? OFFSET ?
    `;

    try {
      const rows = await query(sql, [usuarioDocumento, limit, offset]);
      return rows;
    } catch (error) {
      logger.error('Error en Reparacion.getByUser():', error);
      throw error;
    }
  }

  // Obtener reparaciones por taller
  static async getByTaller(tallerId, limit = 20, offset = 0) {
    const sql = `
      SELECT 
        r.*,
        e.carro_id, e.usuario_solicitante,
        CONCAT(m.nombre, ' ', mo.nombre) as vehiculo_info,
        c.placa as vehiculo_placa,
        u.nombre as cliente_nombre, u.apellido as cliente_apellido
      FROM reparaciones_recomendadas r
      JOIN evaluaciones_taller e ON r.evaluacion_id = e.id
      JOIN carrosx c ON e.carro_id = c.id
      JOIN modelos mo ON c.modelo_id = mo.id
      JOIN marcas m ON mo.marca_id = m.id
      JOIN usuario u ON e.usuario_solicitante = u.documento
      WHERE e.taller_id = ?
      ORDER BY r.prioridad DESC, r.fecha_creacion DESC
      LIMIT ? OFFSET ?
    `;

    try {
      const rows = await query(sql, [tallerId, limit, offset]);
      return rows;
    } catch (error) {
      logger.error('Error en Reparacion.getByTaller():', error);
      throw error;
    }
  }

  // Aceptar reparación
  static async accept(id, proveedorRecomendado = null) {
    const sql = `
      UPDATE reparaciones_recomendadas SET
        estado = 'aceptada',
        fecha_aceptacion = NOW(),
        proveedor_recomendado = COALESCE(?, proveedor_recomendado),
        fecha_actualizacion = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    try {
      const result = await query(sql, [proveedorRecomendado, id]);
      logger.info(`Reparación ${id} aceptada`);
      return result.affectedRows > 0;
    } catch (error) {
      logger.error('Error en Reparacion.accept():', error);
      throw error;
    }
  }

  // Rechazar reparación
  static async reject(id, motivo = null) {
    const sql = `
      UPDATE reparaciones_recomendadas SET
        estado = 'rechazada',
        notas_adicionales = COALESCE(?, notas_adicionales),
        fecha_actualizacion = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    try {
      const result = await query(sql, [motivo, id]);
      logger.info(`Reparación ${id} rechazada`);
      return result.affectedRows > 0;
    } catch (error) {
      logger.error('Error en Reparacion.reject():', error);
      throw error;
    }
  }

  // Completar reparación
  static async complete(id, costoFinal = null, notasCompletado = null) {
    const sql = `
      UPDATE reparaciones_recomendadas SET
        estado = 'completada',
        fecha_completado = NOW(),
        costo_estimado = COALESCE(?, costo_estimado),
        notas_adicionales = COALESCE(?, notas_adicionales),
        fecha_actualizacion = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    try {
      const result = await query(sql, [costoFinal, notasCompletado, id]);
      logger.info(`Reparación ${id} completada`);
      return result.affectedRows > 0;
    } catch (error) {
      logger.error('Error en Reparacion.complete():', error);
      throw error;
    }
  }

  // Obtener estadísticas de reparaciones por taller
  static async getStatsByTaller(tallerId) {
    const sql = `
      SELECT 
        COUNT(*) as total_reparaciones,
        COUNT(CASE WHEN estado = 'pendiente' THEN 1 END) as pendientes,
        COUNT(CASE WHEN estado = 'aceptada' THEN 1 END) as aceptadas,
        COUNT(CASE WHEN estado = 'rechazada' THEN 1 END) as rechazadas,
        COUNT(CASE WHEN estado = 'completada' THEN 1 END) as completadas,
        COUNT(CASE WHEN prioridad = 'critica' THEN 1 END) as criticas,
        COUNT(CASE WHEN prioridad = 'alta' THEN 1 END) as altas,
        COUNT(CASE WHEN prioridad = 'media' THEN 1 END) as medias,
        COUNT(CASE WHEN prioridad = 'baja' THEN 1 END) as bajas,
        AVG(costo_estimado) as costo_promedio,
        SUM(costo_estimado) as costo_total_estimado
      FROM reparaciones_recomendadas r
      JOIN evaluaciones_taller e ON r.evaluacion_id = e.id
      WHERE e.taller_id = ?
    `;

    try {
      const rows = await query(sql, [tallerId]);
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      logger.error('Error en Reparacion.getStatsByTaller():', error);
      throw error;
    }
  }

  // Crear múltiples reparaciones recomendadas
  static async createMultiple(evaluacionId, reparacionesData) {
    try {
      await transaction(async (connection) => {
        for (const reparacion of reparacionesData) {
          await connection.execute(`
            INSERT INTO reparaciones_recomendadas (
              evaluacion_id, tipo_reparacion, componente,
              descripcion_problema, descripcion_solucion, prioridad,
              costo_estimado, tiempo_estimado_horas, kilometraje_recomendado,
              proveedor_recomendado, garantia_meses, notas_adicionales
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            evaluacionId, reparacion.tipo_reparacion, reparacion.componente,
            reparacion.descripcion_problema, reparacion.descripcion_solucion, reparacion.prioridad,
            reparacion.costo_estimado, reparacion.tiempo_estimado_horas, reparacion.kilometraje_recomendado,
            reparacion.proveedor_recomendado, reparacion.garantia_meses, reparacion.notas_adicionales
          ]);
        }
      });

      logger.info(`${reparacionesData.length} reparaciones recomendadas creadas para evaluación ${evaluacionId}`);
      return true;
    } catch (error) {
      logger.error('Error en Reparacion.createMultiple():', error);
      throw error;
    }
  }
}
