import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger.js';
import { query } from '../config/database.js';

// Middleware para verificar token JWT
export const authenticate = (req, res, next) => {
  try {
    // Obtener el token de las cookies
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).json({ error: "No autorizado - Token no proporcionado en cookies" });
    }

    // Verificar y decodificar el token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    logger.error("Error de autenticación:", error.message);

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ error: "No autorizado - Token expirado" });
    }

    res.status(401).json({ error: "No autorizado - Token inválido" });
  }
};

// Middleware para verificar si el usuario está verificado
export const isVerified = (req, res, next) => {
  if (!req.user.is_verified) {
    return res.status(403).json({
      error: "Acceso denegado - Cuenta no verificada",
      needsVerification: true,
    });
  }
  next();
};

// Middleware para verificar si el usuario es administrador
export const isAdmin = (req, res, next) => {
  if (!req.user.isAdmin) {
    return res.status(403).json({ error: "Acceso denegado - No tienes permisos de administrador" });
  }
  next();
};

// Middleware para verificar si el usuario es administrador (verificación en BD)
export const isAdminDB = async (req, res, next) => {
  try {
    const userId = req.user.id; // ID de pre_registro desde cookies
    
    // Verificar si el usuario tiene rol de administrador
    const adminCheck = await query(`
      SELECT r.nombre as rol
      FROM usuario u
      JOIN usuario_roles ur ON u.documento = ur.usuario_documento
      JOIN roles r ON ur.rol_id = r.id
      WHERE u.pre_registro_id = ? AND r.nombre = 'Administrador'
      LIMIT 1
    `, [userId]);

    if (adminCheck.length === 0) {
      return res.status(403).json({ 
        success: false,
        error: "Acceso denegado - No tienes permisos de administrador" 
      });
    }

    next();
  } catch (error) {
    logger.error('Error verificando permisos de administrador:', error);
    return res.status(500).json({ 
      success: false,
      error: "Error interno del servidor" 
    });
  }
};

// Middleware de autenticación con verificación en base de datos
export const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ 
      error: 'Token de acceso requerido',
      code: 'NO_TOKEN' 
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const users = await query('SELECT id, name, email, balance FROM users WHERE id = ?', [decoded.userId]);
    
    if (users.length === 0) {
      return res.status(401).json({ 
        error: 'Usuario no encontrado',
        code: 'USER_NOT_FOUND' 
      });
    }

    req.user = users[0];
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: 'Token expirado',
        code: 'TOKEN_EXPIRED' 
      });
    }
    
    return res.status(403).json({ 
      error: 'Token inválido',
      code: 'INVALID_TOKEN' 
    });
  }
};

// Middleware opcional de autenticación
export const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const users = await query('SELECT id, name, email, balance FROM users WHERE id = ?', [decoded.userId]);
    req.user = users.length > 0 ? users[0] : null;
  } catch (error) {
    req.user = null;
  }

  next();
};

// Middleware para verificar propiedad de recurso (factory function)
export const checkOwnership = (resourceType) => {
  return async (req, res, next) => {
    try {
      const resourceId = req.params.id;
      let ownerField = '';
      let table = '';

      switch (resourceType) {
        case 'car':
          table = 'carrosx';
          ownerField = 'owner_id';
          break;
        case 'auction':
          table = 'auctions';
          ownerField = 'seller_id';
          break;
        default:
          return res.status(400).json({ error: 'Tipo de recurso inválido' });
      }

      const resources = await query(
        `SELECT ${ownerField} FROM ${table} WHERE id = ?`,
        [resourceId]
      );

      if (resources.length === 0) {
        return res.status(404).json({ error: 'Recurso no encontrado' });
      }

      if (resources[0][ownerField] !== req.user.id) {
        return res.status(403).json({ error: 'No tienes permisos para este recurso' });
      }

      next();
    } catch (error) {
      console.error('Error verificando propiedad:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  };
};
export default {
  authenticate,
  isVerified,
  isAdmin,
  authenticateToken,
  optionalAuth,
  checkOwnership
};