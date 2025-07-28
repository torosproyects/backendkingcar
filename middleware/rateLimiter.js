import { logger } from '../utils/logger.js'
import rateLimit from 'express-rate-limit'

// Middleware para manejar errores
export const errorHandler = (err, req, res, next) => {
  // Loguear el error
  logger.error("Error:", err)

  // Determinar el código de estado HTTP
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode
  let message = err.message || "Error interno del servidor"

  // Manejar errores específicos
  if (err.name === "ValidationError") {
    statusCode = 400
    message = err.message
  } else if (err.name === "UnauthorizedError") {
    statusCode = 401
    message = "No autorizado"
  } else if (err.code === "ER_DUP_ENTRY") {
    statusCode = 409
    message = "El recurso ya existe"
  }

  // Enviar respuesta de error
  res.status(statusCode).json({
    error: message,
    stack: process.env.NODE_ENV === "production" ? "🥞" : err.stack,
  })
}

// Limitar intentos de login
export const loginLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 15 minutos
  max: 20, // 5 intentos por ventana
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      error: "Demasiados intentos de inicio de sesión. Por favor intente de nuevo después de 15 minutos",
    })
  }
})

// Limitar solicitudes de registro
export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 100, // 3 intentos por ventana
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      error: "Demasiados intentos de registro. Por favor intente de nuevo más tarde",
    })
  }
})

// Limitar solicitudes de verificación de correo
export const verifyEmailLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 100, // 5 intentos por ventana
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      error: "Demasiados intentos de verificación. Por favor intente de nuevo más tarde",
    })
  }
})
export default {
  verifyEmailLimiter,
  errorHandler,
  loginLimiter,
  registerLimiter
}
