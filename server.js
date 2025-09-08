// server.js (o index.js)
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import http from 'http';
import { Server } from 'socket.io';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import errorHandler from './middleware/errorHandler.js';
import authRoutes from './routes/auth.js';
import productRoutes from './routes/products.js';
import userRoutes from './routes/users.js';
import Auction from './models/Auction.js'
import verificationRoutes from './routes/verificationRoutes.js';
import verificationURoutes from './routes/verificationURoutes.js';
import AuctionScheduler from './service/auction-scheduler.js';
import auctionRoutes from './routes/auctions.js';
// import bidRoutes from './routes/bidRoutes.js';
import carRoutes from './routes/cars.js';
import tallerRoutes from './routes/talleres.js';
import evaluacionRoutes from './routes/evaluaciones.js';
import horarioRoutes from './routes/horarios.js';
import citaRoutes from './routes/citas.js';
import reparacionRoutes from './routes/reparaciones.js';
import tallerApiRoutes from './routes/taller.js';
import { logger } from './utils/logger.js';

const app = express();
const server = http.createServer(app); // ⬅️ importante para socket.io
app.set('trust proxy', 1);

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const PORT = process.env.PORT || 5000;

// ==== CORS ====
const allowedOrigins = [FRONTEND_URL];
app.use(
  cors({
    origin: function (origin, callback) {
      // permitir Postman / SSR (sin origin)
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  })
);

// ==== Seguridad / parsers / logs ====
app.use(helmet());
app.use(cookieParser(process.env.JWT_SECRET));
const jsonMiddleware = express.json();
const urlencodedMiddleware = express.urlencoded({ extended: true });

app.use(
  morgan('combined', {
    stream: { write: (message) => logger.info(message.trim()) },
  })
);

// ==== Socket.IO (autenticación por cookie HttpOnly) ====
const io = new Server(server, {
  cors: {
    origin: FRONTEND_URL,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Auth del socket en handshake
io.use((socket, next) => {
  try {
    const rawCookie = socket.request.headers.cookie;
    if (!rawCookie) return next(new Error('Authentication error: No cookie'));

    // Parseo robusto de cookie
    const cookies = Object.fromEntries(
      rawCookie.split(';').map((c) => {
        const [k, ...v] = c.trim().split('=');
        return [k, decodeURIComponent(v.join('='))];
      })
    );

    // Debe coincidir con el nombre real de tu cookie HttpOnly configurada en /login
    const token = cookies['token'];
    if (!token) return next(new Error('Authentication error: No auth token'));

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Adjuntamos info al socket
    socket.userId = decoded.id;
    socket.userName = decoded.name|| 'user';
    return next();
  } catch (err) {
    return next(new Error('Authentication error: Invalid token'));
  }
});

// === Gestión de conexiones (multi-socket por usuario) ===
/**
 * usersSockets: userId -> Set<socketId>
 * socketToUser: socketId -> userId
 */
const usersSockets = new Map();
const socketToUser = new Map();

io.on('connection', (socket) => {
  const { userId, userName } = socket;

  logger.info(`🔌 Conectado: ${userName} (${userId}) [${socket.id}]`);

  // Mapear relaciones
  if (!usersSockets.has(userId)) usersSockets.set(userId, new Set());
  usersSockets.get(userId).add(socket.id);
  socketToUser.set(socket.id, userId);

  // Sala personal
  socket.join(`user_${userId}`);

  // Eventos de sala de subasta
  socket.on('join_auction', ({ auctionId }) => {
    if (!auctionId) return;
    socket.join(`auction_${auctionId}`);
    logger.info(`👥 ${userId} entró a subasta ${auctionId}`);

    // Avisar a otros en la sala
    socket.to(`auction_${auctionId}`).emit('user_joined', {
      auctionId,
      userId,
      timestamp: new Date(),
    });

    // Opcional: confirmación al propio usuario
    socket.emit('user_joined', {
      auctionId,
      userId,
      timestamp: new Date(),
    });
  });
  socket.on('place_bid', async ({ auctionId, amount, userId, userName }) => {
      try {
        // Validaciones
        const auction = await Auction.exists(auctionId);
        if (!auction || auction.status !== 'active') {
          return socket.emit('bid_error', 'Subasta no activa');
        }
        if (amount <= auction.currentBid) {
          return socket.emit('bid_error', 'Puja menor al actual');
        }

        // Guardar puja en DB
        const bid = await Auction.placeBid(auctionId, userId, userName, amount);

        // Actualizar subasta
        auction.currentBid = amount;
        auction.highestBidder = userId;
        auction.highestBidderName = userName;
        auction.bidCount += 1;
        auction.bids.unshift(bid);

        // Emitir a todos en la room
        io.to(`auction_${auctionId}`).emit('bid_placed', { auctionId, bid, auction });
      } catch (error) {
        console.error('Error place_bid', error);
        socket.emit('bid_error', 'Error al procesar puja');
      }
   });

  socket.on('leave_auction', ({ auctionId }) => {
    if (!auctionId) return;
    socket.leave(`auction_${auctionId}`);
    logger.info(`👋 ${userId} salió de subasta ${auctionId}`);

    socket.to(`auction_${auctionId}`).emit('user_left', {
      auctionId,
      userId,
      timestamp: new Date(),
    });
  });

  // Mantener vivo
  socket.on('ping', () => socket.emit('pong'));

  socket.on('disconnect', (reason) => {
    const uId = socketToUser.get(socket.id);
    if (uId) {
      const set = usersSockets.get(uId);
      if (set) {
        set.delete(socket.id);
        if (set.size === 0) usersSockets.delete(uId);
      }
      socketToUser.delete(socket.id);
    }
    logger.info(`🔻 Desconectado: ${userName} (${userId}) [${socket.id}] - ${reason}`);
  });

  socket.on('error', (err) => {
    logger.error(`❌ Error socket ${socket.id}: ${err?.message || err}`);
  });
});

// === Emisores globales consistentes ===
function emitBidUpdate(auctionId, bidData) {
  io.to(`auction_${auctionId}`).emit('bid_placed', {
    auctionId,
    bid: bidData,
    timestamp: new Date(),
  });
}

function emitTimerUpdate(auctionId, timeRemaining, status) {
  io.to(`auction_${auctionId}`).emit('timer_update', {
    auctionId,
    timeRemaining,
    status,
    timestamp: new Date(),
  });
}

global.emitBidUpdate = emitBidUpdate;
global.emitTimerUpdate = emitTimerUpdate;

// ==== Rutas HTTP ====
app.use('/api/auth', jsonMiddleware, urlencodedMiddleware, authRoutes);
app.use('/api/products', jsonMiddleware, urlencodedMiddleware, productRoutes);
app.use('/api/auctions', jsonMiddleware, urlencodedMiddleware, auctionRoutes);
// app.use('/api/bids', bidRoutes);
app.use('/api/users', jsonMiddleware, urlencodedMiddleware, userRoutes);
app.use('/api/cars', carRoutes);
app.use('/api/talleres', jsonMiddleware, urlencodedMiddleware, tallerRoutes);
app.use('/api/evaluaciones', jsonMiddleware, urlencodedMiddleware, evaluacionRoutes);
app.use('/api/horarios', jsonMiddleware, urlencodedMiddleware, horarioRoutes);
app.use('/api/citas', jsonMiddleware, urlencodedMiddleware, citaRoutes);
app.use('/api/reparaciones', jsonMiddleware, urlencodedMiddleware, reparacionRoutes);
app.use('/api/taller', jsonMiddleware, urlencodedMiddleware, tallerApiRoutes);
app.use('/api/profile', verificationURoutes);
app.use('/api/verification', jsonMiddleware, urlencodedMiddleware, verificationRoutes);

app.get('/api/health', (_req, res) => {
  res.status(200).json({ status: 'OK', message: 'Servidor funcionando correctamente' });
});

app.use(errorHandler);

app.use('/*splat', (_req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// ==== Scheduler (depende de io) ====
const auctionScheduler = new AuctionScheduler(io);

// ==== ⚠️ IMPORTANTE: escuchar con server.listen (no app.listen) ====
try {
  server.listen(PORT, () => {
    logger.info(`HTTP+Socket.IO corriendo en puerto ${PORT}`);
  });
} catch (err) {
  console.error('Fallo al iniciar el servidor:', err);
  process.exit(1);
}

// ==== Manejo de errores de proceso ====
process.on('uncaughtException', (error) => {
  logger.error('Error no capturado:', error);
  process.exit(1);
});

process.on('unhandledRejection', (error) => {
  logger.error('Promesa rechazada no manejada:', error);
  process.exit(1);
});

export default app;
