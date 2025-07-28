import mysql from "mysql2/promise";
import { logger } from "../utils/logger.js";

// Crear un pool de conexiones para mejor rendimiento
const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "user",
  port: process.env.DB_PORT || 3306,
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "railway",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
});

// Función para probar la conexión a la base de datos
export const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    logger.info("Conexión a la base de datos establecida correctamente");
    connection.release();
    return true;
  } catch (error) {
    logger.error("Error al conectar a la base de datos:", error.message);
    return false;
  }
};

// Función para ejecutar consultas SQL
export const query = async (sql, params) => {
  try {
    const [results] = await pool.execute(sql, params);
    return results;
  } catch (error) {
    logger.error("Error al ejecutar consulta SQL:", error.message);
    logger.error("Consulta:", sql);
    logger.error("Parámetros:", params);
    throw error;
  }
};

// Función para transacciones
export const transaction = async (callback) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

// Exportaciones
export const getPool = () => pool;
export default {
  pool,
  query,
  transaction,
  testConnection,
  getPool,
};