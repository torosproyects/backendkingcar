import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import errorHandler from './middleware/errorHandler.js';
import authRoutes from './routes/auth.js';
import productRoutes from './routes/products.js';
import userRoutes from './routes/users.js';
import verificationRoutes from './routes/verificationRoutes.js';
import verificationURoutes from './routes/verificationURoutes.js';
// import auctionRoutes from './routes/auctions.js';
// import bidRoutes from './routes/bidRoutes.js';
import carRoutes from './routes/cars.js';
import { logger } from './utils/logger.js';

// Inicializar la aplicación Express
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware de seguridad
app.use(helmet()); // Ayuda a proteger la app configurando varios headers HTTP

// Configuración de CORS con soporte para cookies
const allowedOrigins = [process.env.FRONTEND_URL || "http://localhost:3000"];
app.use(
  cors({
    origin: function(origin, callback) {
      if (!origin || allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true, // Importante para cookies
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);
//ojo es para usar de servidor local
/*app.use(cors({
  origin: function (origin, callback) {
    callback(null, true); // Permite todos los orígenes
  },
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization']
}));*/

// Middleware para parsear JSON y cookies
const jsonMiddleware = express.json();
const urlencodedMiddleware = express.urlencoded({ extended: true });
app.use(cookieParser(process.env.JWT_SECRET)); // Usa JWT_SECRET para firmar cookies

// Logging
app.use(morgan("combined", { stream: { write: (message) => logger.info(message.trim()) } }));

// Rutas
app.use("/api/auth",jsonMiddleware, urlencodedMiddleware, authRoutes);
app.use("/api/products", jsonMiddleware, urlencodedMiddleware,productRoutes);
// app.use('/api/auctions', auctionRoutes);
// app.use('/api/bids', bidRoutes);
app.use("/api/users",jsonMiddleware, urlencodedMiddleware, userRoutes);
app.use("/api/cars", carRoutes);
app.use("/api/profile", verificationURoutes);
app.use('/api/verification',jsonMiddleware, urlencodedMiddleware, verificationRoutes);

// Ruta de prueba
app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "OK", message: "Servidor funcionando correctamente" });
});

// Middleware para manejar errores
app.use(errorHandler);

// Manejar rutas no encontradas
app.use('/*splat', (req, res) => {
  res.status(404).json({ error: "Ruta no encontrada" })
})

// Iniciar el servidor
try {
  app.listen(PORT, () => {
    logger.info(`Servidor corriendo en el puerto ${PORT}`);
  });
} catch (err) {
  console.error("Fallo al iniciar el servidor:", err);
}

// Manejar errores no capturados
process.on("uncaughtException", (error) => {
  logger.error("Error no capturado:", error);
  process.exit(1);
});

process.on("unhandledRejection", (error) => {
  logger.error("Promesa rechazada no manejada:", error);
  process.exit(1);
});

// Exportación para testing
export default app;