import { query, transaction } from '../config/database.js';
import { logger } from '../utils/logger.js';

export default class ArchivosVerificacion {
  // Crear archivo de verificación
  static async create(archivoData) {
    const {
      verificacion_id,
      tipo_archivo,
      archivo_data,
      archivo_nombre_original,
      archivo_tamaño,
      archivo_tipo_mime,
      archivo_extension
    } = archivoData;

    const sql = `
      INSERT INTO archivos_verificacion (
        verificacion_id, tipo_archivo, archivo_data, archivo_nombre_original,
        archivo_tamaño, archivo_tipo_mime, archivo_extension
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      verificacion_id, tipo_archivo, archivo_data, archivo_nombre_original,
      archivo_tamaño, archivo_tipo_mime, archivo_extension
    ];

    try {
      const result = await query(sql, params);
      logger.info(`Archivo ${tipo_archivo} creado con ID: ${result.insertId}`);
      return result.insertId;
    } catch (error) {
      logger.error('Error en ArchivosVerificacion.create():', error);
      throw error;
    }
  }

  // Crear múltiples archivos
  static async createMultiple(archivosData) {
    return await transaction(async (connection) => {
      const archivoIds = [];
      
      for (const archivo of archivosData) {
        const sql = `
          INSERT INTO archivos_verificacion (
            verificacion_id, tipo_archivo, archivo_data, archivo_nombre_original,
            archivo_tamaño, archivo_tipo_mime, archivo_extension
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `;

        const params = [
          archivo.verificacion_id,
          archivo.tipo_archivo,
          archivo.archivo_data,
          archivo.archivo_nombre_original,
          archivo.archivo_tamaño,
          archivo.archivo_tipo_mime,
          archivo.archivo_extension
        ];

        const result = await connection.execute(sql, params);
        archivoIds.push(result.insertId);
      }

      logger.info(`${archivosData.length} archivos creados para verificación ${archivosData[0].verificacion_id}`);
      return archivoIds;
    });
  }

  // Obtener archivos por verificación
  static async getByVerificacionId(verificacionId) {
    const sql = `
      SELECT 
        id, tipo_archivo, archivo_nombre_original, archivo_tamaño,
        archivo_tipo_mime, archivo_extension, fecha_subida
      FROM archivos_verificacion
      WHERE verificacion_id = ?
      ORDER BY tipo_archivo
    `;

    try {
      const rows = await query(sql, [verificacionId]);
      return rows;
    } catch (error) {
      logger.error('Error en ArchivosVerificacion.getByVerificacionId():', error);
      throw error;
    }
  }

  // Obtener archivo específico (con datos)
  static async getArchivoById(id) {
    const sql = `
      SELECT 
        av.*,
        u.first_name, u.last_name, u.email
      FROM archivos_verificacion av
      JOIN usuariosx u ON av.verificacion_id = u.pre_registro_id
      WHERE av.id = ?
    `;

    try {
      const rows = await query(sql, [id]);
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      logger.error('Error en ArchivosVerificacion.getArchivoById():', error);
      throw error;
    }
  }

  // Eliminar archivo
  static async delete(id) {
    const sql = 'DELETE FROM archivos_verificacion WHERE id = ?';

    try {
      const result = await query(sql, [id]);
      logger.info(`Archivo ${id} eliminado`);
      return result.affectedRows > 0;
    } catch (error) {
      logger.error('Error en ArchivosVerificacion.delete():', error);
      throw error;
    }
  }

  // Eliminar archivos por verificación
  static async deleteByVerificacionId(verificacionId) {
    const sql = 'DELETE FROM archivos_verificacion WHERE verificacion_id = ?';

    try {
      const result = await query(sql, [verificacionId]);
      logger.info(`${result.affectedRows} archivos eliminados para verificación ${verificacionId}`);
      return result.affectedRows;
    } catch (error) {
      logger.error('Error en ArchivosVerificacion.deleteByVerificacionId():', error);
      throw error;
    }
  }

  // Verificar si existe archivo de tipo específico
  static async existsByTipo(verificacionId, tipoArchivo) {
    const sql = `
      SELECT COUNT(*) as count 
      FROM archivos_verificacion 
      WHERE verificacion_id = ? AND tipo_archivo = ?
    `;

    try {
      const result = await query(sql, [verificacionId, tipoArchivo]);
      return result[0].count > 0;
    } catch (error) {
      logger.error('Error en ArchivosVerificacion.existsByTipo():', error);
      throw error;
    }
  }

  // Obtener estadísticas de archivos
  static async getStats() {
    const sql = `
      SELECT 
        COUNT(*) as total_archivos,
        COUNT(CASE WHEN tipo_archivo = 'reciboServicio' THEN 1 END) as recibos_servicio,
        COUNT(CASE WHEN tipo_archivo = 'certificadoBancario' THEN 1 END) as certificados_bancarios,
        COUNT(CASE WHEN tipo_archivo = 'altaAutonomo' THEN 1 END) as altas_autonomo,
        COUNT(CASE WHEN tipo_archivo = 'reta' THEN 1 END) as retas,
        COUNT(CASE WHEN tipo_archivo = 'escriturasConstitucion' THEN 1 END) as escrituras,
        COUNT(CASE WHEN tipo_archivo = 'iaeAno' THEN 1 END) as iae,
        COUNT(CASE WHEN tipo_archivo = 'tarjetaCif' THEN 1 END) as tarjetas_cif,
        COUNT(CASE WHEN tipo_archivo = 'certificadoTitularidadBancaria' THEN 1 END) as titularidad_bancaria,
        AVG(archivo_tamaño) as tamaño_promedio,
        SUM(archivo_tamaño) as tamaño_total
      FROM archivos_verificacion
    `;

    try {
      const rows = await query(sql);
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      logger.error('Error en ArchivosVerificacion.getStats():', error);
      throw error;
    }
  }
}


