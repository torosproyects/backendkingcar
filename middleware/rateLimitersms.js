import { query } from '../config/database.js';
import { logger } from '../utils/logger.js';

export const rateLimiter = (limit = 100, windowMs = 60 * 1000) => {
  return async (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress;
    const key = `rate_limit:${ip}:${req.path}`;

    try {
      // Primero ejecuta el INSERT/UPDATE
      await query(
        `INSERT INTO rate_limits (keyrt, hits, expires_at) 
        VALUES (?, 1, DATE_ADD(NOW(), INTERVAL ? SECOND))
        ON DUPLICATE KEY UPDATE 
        hits = IF(expires_at < NOW(), 1, hits + 1),
        expires_at = IF(expires_at < NOW(), DATE_ADD(NOW(), INTERVAL ? SECOND), expires_at)`,
        [key, windowMs / 1000, windowMs / 1000]
      );

      // Luego ejecuta el SELECT por separado
      const [rows] = await query(
        `SELECT hits FROM rate_limits WHERE keyrt = ?`,
        [key]
      );

      const hits = rows[0]?.hits || 1;

      if (hits > limit) {
        return res.status(429).json({
          error: 'Demasiadas solicitudes. Por favor intenta más tarde.'
        });
      }

      next();
    } catch (error) {
      logger.error('Rate limiter error:', error);
      next();
    }
  };
};