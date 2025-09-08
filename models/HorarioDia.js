import { query, transaction } from '../config/database.js';
import { logger } from '../utils/logger.js';

export default class HorarioDia {
  // Obtener horarios por mes (específico del frontend)
  static async getByMonth(tallerId, año, mes) {
    const fechaInicio = `${año}-${mes.toString().padStart(2, '0')}-01`;
    const fechaFin = new Date(año, mes, 0).toISOString().split('T')[0]; // Último día del mes

    const sql = `
      SELECT 
        hd.id, hd.taller_id, hd.fecha, hd.horarios, hd.bloqueado, hd.motivo_bloqueo,
        hd.fecha_creacion, hd.fecha_actualizacion,
        t.nombre as taller_nombre
      FROM horarios_dia hd
      JOIN talleres t ON hd.taller_id = t.id
      WHERE hd.taller_id = ? 
        AND hd.fecha >= ?
        AND hd.fecha <= ?
      ORDER BY hd.fecha ASC
    `;

    try {
      const rows = await query(sql, [tallerId, fechaInicio, fechaFin]);
      return rows.map(row => ({
        ...row,
        horarios: row.horarios ? JSON.parse(row.horarios) : []
      }));
    } catch (error) {
      logger.error('Error en HorarioDia.getByMonth():', error);
      throw error;
    }
  }

  // Obtener horario por día específico (específico del frontend)
  static async getByDay(tallerId, fecha) {
    const sql = `
      SELECT 
        hd.id, hd.taller_id, hd.fecha, hd.horarios, hd.bloqueado, hd.motivo_bloqueo,
        hd.fecha_creacion, hd.fecha_actualizacion,
        t.nombre as taller_nombre
      FROM horarios_dia hd
      JOIN talleres t ON hd.taller_id = t.id
      WHERE hd.taller_id = ? AND hd.fecha = ?
    `;

    try {
      const rows = await query(sql, [tallerId, fecha]);
      if (rows.length === 0) return null;
      
      const row = rows[0];
      return {
        ...row,
        horarios: row.horarios ? JSON.parse(row.horarios) : []
      };
    } catch (error) {
      logger.error('Error en HorarioDia.getByDay():', error);
      throw error;
    }
  }

  // Crear horario para un día específico (específico del frontend)
  static async createDaySchedule(tallerId, fecha, horarioData) {
    const {
      horarios, bloqueado = false, motivoBloqueo
    } = horarioData;

    // Calcular citas agendadas para cada horario
    const horariosConCitas = await Promise.all(
      horarios.map(async (horario) => {
        const citasAgendadas = await this.getCitasAgendadas(tallerId, fecha, horario.hora);
        return {
          ...horario,
          citasAgendadas
        };
      })
    );

    const sql = `
      INSERT INTO horarios_dia (
        taller_id, fecha, horarios, bloqueado, motivo_bloqueo,
        fecha_creacion, fecha_actualizacion
      ) VALUES (?, ?, ?, ?, ?, NOW(), NOW())
    `;

    const params = [
      tallerId, fecha, JSON.stringify(horariosConCitas), bloqueado, motivoBloqueo
    ];

    try {
      const result = await query(sql, params);
      logger.info(`Horario diario creado para taller ${tallerId} en fecha ${fecha}`);
      return result.insertId;
    } catch (error) {
      logger.error('Error en HorarioDia.createDaySchedule():', error);
      throw error;
    }
  }

  // Actualizar horario para un día específico (específico del frontend)
  static async updateDaySchedule(tallerId, fecha, horarioData) {
    const {
      horarios, bloqueado, motivoBloqueo
    } = horarioData;

    // Calcular citas agendadas para cada horario
    const horariosConCitas = await Promise.all(
      horarios.map(async (horario) => {
        const citasAgendadas = await this.getCitasAgendadas(tallerId, fecha, horario.hora);
        return {
          ...horario,
          citasAgendadas
        };
      })
    );

    const sql = `
      UPDATE horarios_dia SET
        horarios = COALESCE(?, horarios),
        bloqueado = COALESCE(?, bloqueado),
        motivo_bloqueo = COALESCE(?, motivo_bloqueo),
        fecha_actualizacion = NOW()
      WHERE taller_id = ? AND fecha = ?
    `;

    const params = [
      JSON.stringify(horariosConCitas), bloqueado, motivoBloqueo,
      tallerId, fecha
    ];

    try {
      const result = await query(sql, params);
      logger.info(`Horario diario actualizado para taller ${tallerId} en fecha ${fecha}`);
      return result.affectedRows > 0;
    } catch (error) {
      logger.error('Error en HorarioDia.updateDaySchedule():', error);
      throw error;
    }
  }

  // Eliminar horario para un día específico (específico del frontend)
  static async deleteDaySchedule(tallerId, fecha) {
    const sql = `
      DELETE FROM horarios_dia 
      WHERE taller_id = ? AND fecha = ?
    `;

    try {
      const result = await query(sql, [tallerId, fecha]);
      logger.info(`Horario diario eliminado para taller ${tallerId} en fecha ${fecha}`);
      return result.affectedRows > 0;
    } catch (error) {
      logger.error('Error en HorarioDia.deleteDaySchedule():', error);
      throw error;
    }
  }

  // Copiar horarios de un día a otro (específico del frontend)
  static async copyDaySchedule(tallerId, fechaOrigen, fechaDestino, horarioData) {
    const {
      horarios, bloqueado = false, motivoBloqueo
    } = horarioData;

    // Calcular citas agendadas para cada horario en la fecha destino
    const horariosConCitas = await Promise.all(
      horarios.map(async (horario) => {
        const citasAgendadas = await this.getCitasAgendadas(tallerId, fechaDestino, horario.hora);
        return {
          ...horario,
          citasAgendadas
        };
      })
    );

    const sql = `
      INSERT INTO horarios_dia (
        taller_id, fecha, horarios, bloqueado, motivo_bloqueo,
        fecha_creacion, fecha_actualizacion
      ) VALUES (?, ?, ?, ?, ?, NOW(), NOW())
    `;

    const params = [
      tallerId, fechaDestino, JSON.stringify(horariosConCitas), bloqueado, motivoBloqueo
    ];

    try {
      const result = await query(sql, params);
      logger.info(`Horario copiado de ${fechaOrigen} a ${fechaDestino} para taller ${tallerId}`);
      return result.insertId;
    } catch (error) {
      logger.error('Error en HorarioDia.copyDaySchedule():', error);
      throw error;
    }
  }

  // Obtener citas agendadas para una hora específica
  static async getCitasAgendadas(tallerId, fecha, hora) {
    const sql = `
      SELECT COUNT(*) as count
      FROM citas_taller 
      WHERE taller_id = ? 
        AND fecha_cita = ? 
        AND hora_cita = ?
        AND estado IN ('programada', 'confirmada', 'en_proceso')
    `;

    try {
      const rows = await query(sql, [tallerId, fecha, hora]);
      return rows[0].count;
    } catch (error) {
      logger.error('Error en HorarioDia.getCitasAgendadas():', error);
      return 0;
    }
  }

  // Verificar si el usuario puede acceder al horario
  static async canAccess(horarioId, usuarioDocumento) {
    const sql = `
      SELECT hd.id FROM horarios_dia hd
      JOIN talleres t ON hd.taller_id = t.id
      WHERE hd.id = ? AND t.usuario_propietario = ?
    `;
    
    try {
      const rows = await query(sql, [horarioId, usuarioDocumento]);
      return rows.length > 0;
    } catch (error) {
      logger.error('Error en HorarioDia.canAccess():', error);
      throw error;
    }
  }

  // Obtener horarios por taller (para compatibilidad con frontend)
  static async getByTaller(tallerId, limit = 20, offset = 0) {
    const sql = `
      SELECT 
        hd.id, hd.taller_id, hd.fecha, hd.horarios, hd.bloqueado, hd.motivo_bloqueo,
        hd.fecha_creacion, hd.fecha_actualizacion,
        t.nombre as taller_nombre
      FROM horarios_dia hd
      JOIN talleres t ON hd.taller_id = t.id
      WHERE hd.taller_id = ?
      ORDER BY hd.fecha DESC
      LIMIT ? OFFSET ?
    `;

    try {
      const rows = await query(sql, [tallerId, limit, offset]);
      return rows.map(row => ({
        ...row,
        horarios: row.horarios ? JSON.parse(row.horarios) : []
      }));
    } catch (error) {
      logger.error('Error en HorarioDia.getByTaller():', error);
      throw error;
    }
  }
}
