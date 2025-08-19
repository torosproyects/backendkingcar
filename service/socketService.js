import socketio from 'socket.io';

let io;

export const init = (server) => {
  io = socketio(server, {
    cors: {
      origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket) => {
    console.log('New client connected');

   
    socket.on('joinAuction', (auctionId) => {
      socket.join(`auction_${auctionId}`);
      console.log(`User joined auction ${auctionId}`);
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected');
    });
  });

  return io;
};

export const emitAuctionUpdate = async (auctionId, data) => {
  if (io) {
    io.to(`auction_${auctionId}`).emit('auctionUpdate', data);
  }
};

export const emitNotification = (userId, message) => {
  if (io) {
    io.to(`user_${userId}`).emit('notification', message);
  }
};

// Exportación por defecto para compatibilidad
export default {
  init,
  emitAuctionUpdate,
  emitNotification
};