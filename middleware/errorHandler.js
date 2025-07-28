import { logger } from '../utils/logger.js'

// Middleware para manejar errores
const errorHandler = (err, req, res, next) => {
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
export default errorHandler;
