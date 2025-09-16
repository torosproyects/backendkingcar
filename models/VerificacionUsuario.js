import { query, transaction } from '../config/database.js';
import { logger } from '../utils/logger.js';

export default class VerificacionUsuario {
  // Crear nueva verificación
  static async create(verificationData) {
    const {
      pre_registro_id,
      first_name,
      last_name,
      email,
      phone,
      fecha_nacimiento,
      documento_tipo,
      documento_numero,
      documento_identidad_url,
      documento_identidad_public_id,
      direccion,
      codigo_postal,
      pais,
      ciudad,
      estado_provincia,
      account_type_id,
      particular_data,
      autonomo_data,
      empresa_data
    } = verificationData;

    const sql = `
      INSERT INTO usuariosx (
        pre_registro_id, first_name, last_name, email, phone, fecha_nacimiento,
        documento_tipo, documento_numero, documento_identidad_url, documento_identidad_public_id,
        direccion, codigo_postal, pais, ciudad, estado_provincia, account_type_id,
        particular_data, autonomo_data, empresa_data
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      pre_registro_id, first_name, last_name, email, phone, fecha_nacimiento,
      documento_tipo, documento_numero, documento_identidad_url, documento_identidad_public_id,
      direccion, codigo_postal, pais, ciudad, estado_provincia, account_type_id,
      particular_data, autonomo_data, empresa_data
    ];

    try {
      const result = await query(sql, params);
      logger.info(`Verificación creada para pre_registro_id: ${pre_registro_id}`);
      return pre_registro_id;
    } catch (error) {
      logger.error('Error en VerificacionUsuario.create():', error);
      throw error;
    }
  }

  // Obtener verificación por ID
  static async getById(id) {
    const sql = `
      SELECT 
        u.*,
        r.nombre as account_type_name
      FROM usuariosx u
      LEFT JOIN roles r ON u.account_type_id = r.id
      WHERE u.pre_registro_id = ?
    `;

    try {
      const rows = await query(sql, [id]);
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      logger.error('Error en VerificacionUsuario.getById():', error);
      throw error;
    }
  }

  // Obtener verificación por pre_registro_id
  static async getByPreRegistroId(preRegistroId) {
    const sql = `
      SELECT 
        u.*,
        r.nombre as account_type_name
      FROM usuariosx u
      LEFT JOIN roles r ON u.account_type_id = r.id
      WHERE u.pre_registro_id = ?
    `;

    try {
      const rows = await query(sql, [preRegistroId]);
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      logger.error('Error en VerificacionUsuario.getByPreRegistroId():', error);
      throw error;
    }
  }

  // Obtener todas las verificaciones con filtros
  static async getAll(filters = {}) {
    const { estado, account_type_id, limit = 50, offset = 0 } = filters;
    
    let whereClause = 'WHERE 1=1';
    const params = [];

    if (estado) {
      whereClause += ' AND u.estado = ?';
      params.push(estado);
    }

    if (account_type_id) {
      whereClause += ' AND u.account_type_id = ?';
      params.push(account_type_id);
    }

    const sql = `
      SELECT 
        u.*,
        r.nombre as account_type_name,
        pr.name as pre_registro_name,
        pr.email as pre_registro_email
      FROM usuariosx u
      LEFT JOIN roles r ON u.account_type_id = r.id
      LEFT JOIN pre_registro pr ON u.pre_registro_id = pr.id
      ${whereClause}
      ORDER BY u.fecha_solicitud DESC
      LIMIT ? OFFSET ?
    `;
    
    params.push(limit, offset);

    try {
      const rows = await query(sql, params);
      return rows;
    } catch (error) {
      logger.error('Error en VerificacionUsuario.getAll():', error);
      throw error;
    }
  }

  // Actualizar estado de verificación
  static async updateStatus(id, estado, notas_revision = null) {
    const sql = `
      UPDATE usuariosx SET
        estado = ?,
        fecha_revision = NOW(),
        notas_revision = ?,
        fecha_actualizacion = CURRENT_TIMESTAMP
      WHERE pre_registro_id = ?
    `;

    try {
      const result = await query(sql, [estado, notas_revision, id]);
      logger.info(`Estado de verificación ${id} actualizado a: ${estado}`);
      return result.affectedRows > 0;
    } catch (error) {
      logger.error('Error en VerificacionUsuario.updateStatus():', error);
      throw error;
    }
  }

  // Eliminar verificación
  static async delete(id) {
    return await transaction(async (connection) => {
      // Eliminar archivos asociados primero
      await connection.execute('DELETE FROM archivos_verificacion WHERE verificacion_id = ?', [id]);
      
      // Eliminar verificación
      const result = await connection.execute('DELETE FROM usuariosx WHERE pre_registro_id = ?', [id]);
      
      logger.info(`Verificación ${id} eliminada`);
      return result.affectedRows > 0;
    });
  }

  // Verificar si ya existe una verificación para el usuario
  static async existsByPreRegistroId(preRegistroId) {
    const sql = 'SELECT COUNT(*) as count FROM usuariosx WHERE pre_registro_id = ?';
    
    try {
      const result = await query(sql, [preRegistroId]);
      return result[0].count > 0;
    } catch (error) {
      logger.error('Error en VerificacionUsuario.existsByPreRegistroId():', error);
      throw error;
    }
  }

  // Obtener estadísticas de verificaciones
  static async getStats() {
    const sql = `
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN estado = 'pendiente' THEN 1 END) as pendientes,
        COUNT(CASE WHEN estado = 'en_revision' THEN 1 END) as en_revision,
        COUNT(CASE WHEN estado = 'aprobadas' THEN 1 END) as aprobadas,
        COUNT(CASE WHEN estado = 'rechazadas' THEN 1 END) as rechazadas,
        COUNT(CASE WHEN account_type_id = 7 THEN 1 END) as particulares,
        COUNT(CASE WHEN account_type_id = 5 THEN 1 END) as autonomos,
        COUNT(CASE WHEN account_type_id = 6 THEN 1 END) as empresas
      FROM usuariosx
    `;

    try {
      const rows = await query(sql);
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      logger.error('Error en VerificacionUsuario.getStats():', error);
      throw error;
    }
  }
}


