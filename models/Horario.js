import { query, transaction } from '../config/database.js';
import { logger } from '../utils/logger.js';

export default class Horario {
  // Obtener todos los horarios con filtros
  static async getAll(filters = {}) {
    const { 
      taller_id, dia_semana, esta_abierto = true, 
      fecha_desde, fecha_hasta, limit = 50, offset = 0 
    } = filters;
    
    let whereClause = 'WHERE 1=1';
    const params = [];

    if (taller_id) {
      whereClause += ' AND h.taller_id = ?';
      params.push(taller_id);
    }

    if (dia_semana) {
      whereClause += ' AND h.dia_semana = ?';
      params.push(dia_semana);
    }

    if (esta_abierto !== undefined) {
      whereClause += ' AND h.esta_abierto = ?';
      params.push(esta_abierto);
    }

    if (fecha_desde) {
      whereClause += ' AND h.fecha_desde <= ?';
      params.push(fecha_desde);
    }

    if (fecha_hasta) {
      whereClause += ' AND (h.fecha_hasta IS NULL OR h.fecha_hasta >= ?)';
      params.push(fecha_hasta);
    }

    const sql = `
      SELECT 
        h.id, h.taller_id, h.dia_semana, h.hora_apertura, h.hora_cierre,
        h.esta_abierto, h.duracion_cita_minutos, h.citas_maximas_por_dia,
        h.fecha_desde, h.fecha_hasta, h.notas,
        t.nombre as taller_nombre,
        h.fecha_creacion, h.fecha_actualizacion
      FROM horarios_dia h
      JOIN talleres t ON h.taller_id = t.id
      ${whereClause}
      ORDER BY h.taller_id, h.dia_semana, h.fecha_desde
      LIMIT ? OFFSET ?
    `;
    
    params.push(limit, offset);

    try {
      const rows = await query(sql, params);
      return rows;
    } catch (error) {
      logger.error('Error en Horario.getAll():', error);
      throw error;
    }
  }

  // Obtener horario por ID
  static async getById(id) {
    const sql = `
      SELECT 
        h.*,
        t.nombre as taller_nombre, t.direccion as taller_direccion
      FROM horarios_dia h
      JOIN talleres t ON h.taller_id = t.id
      WHERE h.id = ?
    `;

    try {
      const rows = await query(sql, [id]);
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      logger.error('Error en Horario.getById():', error);
      throw error;
    }
  }

  // Crear nuevo horario
  static async create(horarioData) {
    const {
      taller_id, dia_semana, hora_apertura, hora_cierre,
      esta_abierto, duracion_cita_minutos, citas_maximas_por_dia,
      fecha_desde, fecha_hasta, notas
    } = horarioData;

    const sql = `
      INSERT INTO horarios_dia (
        taller_id, dia_semana, hora_apertura, hora_cierre,
        esta_abierto, duracion_cita_minutos, citas_maximas_por_dia,
        fecha_desde, fecha_hasta, notas
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      taller_id, dia_semana, hora_apertura, hora_cierre,
      esta_abierto, duracion_cita_minutos, citas_maximas_por_dia,
      fecha_desde, fecha_hasta, notas
    ];

    try {
      const result = await query(sql, params);
      logger.info(`Horario creado con ID: ${result.insertId}`);
      return result.insertId;
    } catch (error) {
      logger.error('Error en Horario.create():', error);
      throw error;
    }
  }

  // Actualizar horario
  static async update(id, horarioData) {
    const {
      dia_semana, hora_apertura, hora_cierre, esta_abierto,
      duracion_cita_minutos, citas_maximas_por_dia,
      fecha_desde, fecha_hasta, notas
    } = horarioData;

    const sql = `
      UPDATE horarios_dia SET
        dia_semana = COALESCE(?, dia_semana),
        hora_apertura = COALESCE(?, hora_apertura),
        hora_cierre = COALESCE(?, hora_cierre),
        esta_abierto = COALESCE(?, esta_abierto),
        duracion_cita_minutos = COALESCE(?, duracion_cita_minutos),
        citas_maximas_por_dia = COALESCE(?, citas_maximas_por_dia),
        fecha_desde = COALESCE(?, fecha_desde),
        fecha_hasta = COALESCE(?, fecha_hasta),
        notas = COALESCE(?, notas),
        fecha_actualizacion = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    const params = [
      dia_semana, hora_apertura, hora_cierre, esta_abierto,
      duracion_cita_minutos, citas_maximas_por_dia,
      fecha_desde, fecha_hasta, notas, id
    ];

    try {
      const result = await query(sql, params);
      logger.info(`Horario ${id} actualizado`);
      return result.affectedRows > 0;
    } catch (error) {
      logger.error('Error en Horario.update():', error);
      throw error;
    }
  }

  // Eliminar horario
  static async delete(id) {
    const sql = 'DELETE FROM horarios_dia WHERE id = ?';

    try {
      const result = await query(sql, [id]);
      logger.info(`Horario ${id} eliminado`);
      return result.affectedRows > 0;
    } catch (error) {
      logger.error('Error en Horario.delete():', error);
      throw error;
    }
  }

  // Obtener horarios por taller
  static async getByTaller(tallerId, fechaEspecifica = null) {
    let whereClause = 'WHERE h.taller_id = ?';
    const params = [tallerId];

    if (fechaEspecifica) {
      whereClause += ' AND h.fecha_desde <= ? AND (h.fecha_hasta IS NULL OR h.fecha_hasta >= ?)';
      params.push(fechaEspecifica, fechaEspecifica);
    }

    const sql = `
      SELECT 
        h.*,
        t.nombre as taller_nombre
      FROM horarios_dia h
      JOIN talleres t ON h.taller_id = t.id
      ${whereClause}
      ORDER BY 
        CASE h.dia_semana
          WHEN 'lunes' THEN 1
          WHEN 'martes' THEN 2
          WHEN 'miercoles' THEN 3
          WHEN 'jueves' THEN 4
          WHEN 'viernes' THEN 5
          WHEN 'sabado' THEN 6
          WHEN 'domingo' THEN 7
        END,
        h.fecha_desde
    `;

    try {
      const rows = await query(sql, params);
      return rows;
    } catch (error) {
      logger.error('Error en Horario.getByTaller():', error);
      throw error;
    }
  }

  // Verificar si el usuario puede acceder al horario
  static async canAccess(horarioId, usuarioDocumento) {
    const sql = `
      SELECT h.id FROM horarios_dia h
      JOIN talleres t ON h.taller_id = t.id
      WHERE h.id = ? AND t.usuario_propietario = ?
    `;
    
    try {
      const rows = await query(sql, [horarioId, usuarioDocumento]);
      return rows.length > 0;
    } catch (error) {
      logger.error('Error en Horario.canAccess():', error);
      throw error;
    }
  }

  // Obtener horarios disponibles para una fecha específica
  static async getAvailableSlots(tallerId, fecha) {
    const sql = `
      SELECT 
        h.dia_semana, h.hora_apertura, h.hora_cierre,
        h.duracion_cita_minutos, h.citas_maximas_por_dia,
        COUNT(c.id) as citas_existentes
      FROM horarios_dia h
      LEFT JOIN citas_taller c ON h.taller_id = c.taller_id 
        AND c.fecha_cita = ? 
        AND c.estado IN ('programada', 'confirmada', 'en_proceso')
      WHERE h.taller_id = ? 
        AND h.esta_abierto = 1
        AND h.fecha_desde <= ?
        AND (h.fecha_hasta IS NULL OR h.fecha_hasta >= ?)
      GROUP BY h.id, h.dia_semana, h.hora_apertura, h.hora_cierre, h.duracion_cita_minutos, h.citas_maximas_por_dia
      HAVING citas_existentes < h.citas_maximas_por_dia
    `;

    try {
      const rows = await query(sql, [fecha, tallerId, fecha, fecha]);
      return rows;
    } catch (error) {
      logger.error('Error en Horario.getAvailableSlots():', error);
      throw error;
    }
  }

  // Crear horario semanal completo para un taller
  static async createWeeklySchedule(tallerId, scheduleData) {
    const {
      hora_apertura, hora_cierre, duracion_cita_minutos,
      citas_maximas_por_dia, fecha_desde, fecha_hasta, notas
    } = scheduleData;

    const diasSemana = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
    
    try {
      await transaction(async (connection) => {
        for (const dia of diasSemana) {
          await connection.execute(`
            INSERT INTO horarios_dia (
              taller_id, dia_semana, hora_apertura, hora_cierre,
              esta_abierto, duracion_cita_minutos, citas_maximas_por_dia,
              fecha_desde, fecha_hasta, notas
            ) VALUES (?, ?, ?, ?, 1, ?, ?, ?, ?, ?)
          `, [
            tallerId, dia, hora_apertura, hora_cierre,
            duracion_cita_minutos, citas_maximas_por_dia,
            fecha_desde, fecha_hasta, notas
          ]);
        }
      });

      logger.info(`Horario semanal creado para taller ${tallerId}`);
      return true;
    } catch (error) {
      logger.error('Error en Horario.createWeeklySchedule():', error);
      throw error;
    }
  }

  // Actualizar horario semanal completo
  static async updateWeeklySchedule(tallerId, scheduleData) {
    const {
      hora_apertura, hora_cierre, duracion_cita_minutos,
      citas_maximas_por_dia, fecha_desde, fecha_hasta, notas
    } = scheduleData;

    try {
      await transaction(async (connection) => {
        // Eliminar horarios existentes para el rango de fechas
        await connection.execute(`
          DELETE FROM horarios_dia 
          WHERE taller_id = ? AND fecha_desde = ?
        `, [tallerId, fecha_desde]);

        // Crear nuevos horarios
        await this.createWeeklySchedule(tallerId, scheduleData);
      });

      logger.info(`Horario semanal actualizado para taller ${tallerId}`);
      return true;
    } catch (error) {
      logger.error('Error en Horario.updateWeeklySchedule():', error);
      throw error;
    }
  }

  // Obtener horarios por mes
  static async getByMonth(tallerId, año, mes) {
    const fechaInicio = `${año}-${mes.toString().padStart(2, '0')}-01`;
    const fechaFin = new Date(año, mes, 0).toISOString().split('T')[0]; // Último día del mes

    const sql = `
      SELECT 
        h.*,
        t.nombre as taller_nombre,
        DAY(h.fecha_desde) as dia_del_mes
      FROM horarios_dia h
      JOIN talleres t ON h.taller_id = t.id
      WHERE h.taller_id = ? 
        AND h.fecha_desde <= ?
        AND (h.fecha_hasta IS NULL OR h.fecha_hasta >= ?)
      ORDER BY h.dia_semana, h.fecha_desde
    `;

    try {
      const rows = await query(sql, [tallerId, fechaFin, fechaInicio]);
      return rows;
    } catch (error) {
      logger.error('Error en Horario.getByMonth():', error);
      throw error;
    }
  }

  // Obtener horarios por día específico
  static async getByDay(tallerId, fecha) {
    const sql = `
      SELECT 
        h.*,
        t.nombre as taller_nombre
      FROM horarios_dia h
      JOIN talleres t ON h.taller_id = t.id
      WHERE h.taller_id = ? 
        AND h.fecha_desde <= ?
        AND (h.fecha_hasta IS NULL OR h.fecha_hasta >= ?)
      ORDER BY 
        CASE h.dia_semana
          WHEN 'lunes' THEN 1
          WHEN 'martes' THEN 2
          WHEN 'miercoles' THEN 3
          WHEN 'jueves' THEN 4
          WHEN 'viernes' THEN 5
          WHEN 'sabado' THEN 6
          WHEN 'domingo' THEN 7
        END
    `;

    try {
      const rows = await query(sql, [tallerId, fecha, fecha]);
      return rows;
    } catch (error) {
      logger.error('Error en Horario.getByDay():', error);
      throw error;
    }
  }

  // Crear horario para un día específico
  static async createDaySchedule(tallerId, fecha, horarioData) {
    const {
      hora_apertura, hora_cierre, esta_abierto,
      duracion_cita_minutos, citas_maximas_por_dia, notas
    } = horarioData;

    // Obtener el día de la semana de la fecha
    const fechaObj = new Date(fecha);
    const diasSemana = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
    const diaSemana = diasSemana[fechaObj.getDay()];

    const sql = `
      INSERT INTO horarios_dia (
        taller_id, dia_semana, hora_apertura, hora_cierre,
        esta_abierto, duracion_cita_minutos, citas_maximas_por_dia,
        fecha_desde, fecha_hasta, notas
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      tallerId, diaSemana, hora_apertura, hora_cierre,
      esta_abierto, duracion_cita_minutos, citas_maximas_por_dia,
      fecha, fecha, notas
    ];

    try {
      const result = await query(sql, params);
      logger.info(`Horario diario creado para taller ${tallerId} en fecha ${fecha}`);
      return result.insertId;
    } catch (error) {
      logger.error('Error en Horario.createDaySchedule():', error);
      throw error;
    }
  }

  // Actualizar horario para un día específico
  static async updateDaySchedule(tallerId, fecha, horarioData) {
    const {
      hora_apertura, hora_cierre, esta_abierto,
      duracion_cita_minutos, citas_maximas_por_dia, notas
    } = horarioData;

    const sql = `
      UPDATE horarios_dia SET
        hora_apertura = COALESCE(?, hora_apertura),
        hora_cierre = COALESCE(?, hora_cierre),
        esta_abierto = COALESCE(?, esta_abierto),
        duracion_cita_minutos = COALESCE(?, duracion_cita_minutos),
        citas_maximas_por_dia = COALESCE(?, citas_maximas_por_dia),
        notas = COALESCE(?, notas),
        fecha_actualizacion = CURRENT_TIMESTAMP
      WHERE taller_id = ? 
        AND fecha_desde <= ?
        AND (fecha_hasta IS NULL OR fecha_hasta >= ?)
    `;

    const params = [
      hora_apertura, hora_cierre, esta_abierto,
      duracion_cita_minutos, citas_maximas_por_dia, notas,
      tallerId, fecha, fecha
    ];

    try {
      const result = await query(sql, params);
      logger.info(`Horario diario actualizado para taller ${tallerId} en fecha ${fecha}`);
      return result.affectedRows > 0;
    } catch (error) {
      logger.error('Error en Horario.updateDaySchedule():', error);
      throw error;
    }
  }

  // Eliminar horario para un día específico
  static async deleteDaySchedule(tallerId, fecha) {
    const sql = `
      DELETE FROM horarios_dia 
      WHERE taller_id = ? 
        AND fecha_desde <= ?
        AND (fecha_hasta IS NULL OR fecha_hasta >= ?)
    `;

    try {
      const result = await query(sql, [tallerId, fecha, fecha]);
      logger.info(`Horario diario eliminado para taller ${tallerId} en fecha ${fecha}`);
      return result.affectedRows > 0;
    } catch (error) {
      logger.error('Error en Horario.deleteDaySchedule():', error);
      throw error;
    }
  }

  // Copiar horarios de un día a otro
  static async copyDaySchedule(tallerId, fechaOrigen, fechaDestino, horarioData) {
    const {
      hora_apertura, hora_cierre, esta_abierto,
      duracion_cita_minutos, citas_maximas_por_dia, notas
    } = horarioData;

    // Obtener el día de la semana de la fecha destino
    const fechaObj = new Date(fechaDestino);
    const diasSemana = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
    const diaSemana = diasSemana[fechaObj.getDay()];

    const sql = `
      INSERT INTO horarios_dia (
        taller_id, dia_semana, hora_apertura, hora_cierre,
        esta_abierto, duracion_cita_minutos, citas_maximas_por_dia,
        fecha_desde, fecha_hasta, notas
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      tallerId, diaSemana, hora_apertura, hora_cierre,
      esta_abierto, duracion_cita_minutos, citas_maximas_por_dia,
      fechaDestino, fechaDestino, notas
    ];

    try {
      const result = await query(sql, params);
      logger.info(`Horario copiado de ${fechaOrigen} a ${fechaDestino} para taller ${tallerId}`);
      return result.insertId;
    } catch (error) {
      logger.error('Error en Horario.copyDaySchedule():', error);
      throw error;
    }
  }
}
