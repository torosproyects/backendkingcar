import { query } from '../config/database.js';


export default  class AuctionScheduler {
  constructor(io) {
    this.io = io;
    this.intervals = new Map();
    this.init();
  }

  init() {
    // Verificar subastas cada 30 segundos
    setInterval(() => {
      this.checkAuctionStatuses();
    }, 15000);

    // Verificar inmediatamente al iniciar
    this.checkAuctionStatuses();
  }

  async checkAuctionStatuses() {
    try {
      const now = new Date();

      // Activar subastas que deberían estar activas
      await this.activateUpcomingAuctions(now);

      // Finalizar subastas que han terminado
      await this.endExpiredAuctions(now);

      // Enviar alertas de finalización próxima
      await this.sendEndingAlerts(now);

    } catch (error) {
      console.error('Error verificando estados de subastas:', error);
    }
  }

  async activateUpcomingAuctions(now) {
    try {
      const upcomingAuctions = await query(
        'SELECT id, start_time FROM auctions WHERE status = "upcoming" AND start_time <= ?',
        [now]
      );

      for (const auction of upcomingAuctions) {
        await query(
          'UPDATE auctions SET status = "active" WHERE id = ?',
          [auction.id]
        );

        console.log(`✅ Subasta ${auction.id} activada`);

        // Emitir evento WebSocket
        this.io.emit('auction_started', {
          auctionId: auction.id,
          message: 'La subasta ha comenzado'
        });

        // Crear notificaciones para observadores
        await this.createNotificationsForWatchers(auction.id, 'auction_started', 'Subasta iniciada', 'La subasta que observas ha comenzado');
      }

    } catch (error) {
      console.error('Error activando subastas:', error);
    }
  }

  async endExpiredAuctions(now) {
    try {
      const expiredAuctions = await query(
        `SELECT 
          a.id, a.car_id, a.highest_bidder_id, a.highest_bidder_name, 
          a.current_bid, a.reserve_price, a.seller_id, m.nombre AS make, mo.nombre AS model
          FROM auctions a
        JOIN carrosx c ON a.car_id = c.id
        JOIN modelos mo ON c.modelo_id = mo.id
        JOIN marcas m ON mo.marca_id = m.id
        WHERE a.status = 'active' AND a.end_time <= ?`,
        [now]
      );

      for (const auction of expiredAuctions) {
        // Actualizar estado de la subasta
        await query(
          'UPDATE auctions SET status = "ended" WHERE id = ?',
          [auction.id]
        );

        // Marcar puja ganadora si existe
        if (auction.highest_bidder_id) {
          const reserveMet = !auction.reserve_price || auction.current_bid >= auction.reserve_price;
          
          if (reserveMet) {
            await query(
              'UPDATE bids SET is_winner = TRUE WHERE auction_id = ? AND user_id = ? AND amount = ?',
              [auction.id, auction.highest_bidder_id, auction.current_bid]
            );

            // Notificar al ganador
            await this.createNotification(
              auction.highest_bidder_id,
              'won_auction',
              '🎉 ¡Ganaste la subasta!',
              `Has ganado ${auction.make} ${auction.model} por $${parseFloat(auction.current_bid).toLocaleString()}`,
              auction.id,
              'high'
            );

            console.log(`🏆 Subasta ${auction.id} finalizada - Ganador: ${auction.highest_bidder_name}`);
          } else {
            console.log(`📋 Subasta ${auction.id} finalizada - Precio de reserva no alcanzado`);

          }
        } else {
          console.log(`📋 Subasta ${auction.id} finalizada - Sin pujas`);
    //   actualizar carro de nuevo  await actualizarEstadocar({ car_id: 123 }, 2);
        }
                 

        // Emitir evento WebSocket
        this.io.emit('auction_ended', {
          auctionId: auction.id,
          winnerId: auction.highest_bidder_id,
          winnerName: auction.highest_bidder_name,
          finalPrice: auction.current_bid,
          reserveMet: !auction.reserve_price || auction.current_bid >= auction.reserve_price
        });

        // Notificar a observadores
        await this.createNotificationsForWatchers(
          auction.id, 
          'auction_ended', 
          '🏁 Subasta finalizada', 
          `${auction.make} ${auction.model} se vendió por $${parseFloat(auction.current_bid).toLocaleString()}`
        );
      }

    } catch (error) {
      console.error('Error finalizando subastas:', error);
    }
  }
 async actualizarEstadocar(auction, nuevoEstadoId) {
  try {
    const { car_id } = auction;
    await query(
      'UPDATE carrosx_estadocar SET fecha_salida = NOW() WHERE id_car = ? AND fecha_salida IS NULL',
      [car_id]
    );
    await query(
      'INSERT INTO carrosx_estadocar (id_car, id_estado, fecha_inicio) VALUES (?, ?, NOW())',
      [car_id, nuevoEstadoId]
    );
    console.log(`Estado del carro ${car_id} actualizado correctamente.`);
  } catch (error) {
    console.error('Error al actualizar el estado del carro:', error);
    throw new Error(`No se pudo actualizar el estado del carro: ${error.message}`);
  }
}
  async sendEndingAlerts(now) {
    try {
      // Alertas para subastas que terminan en 5 minutos
      const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);
      const endingSoonAuctions = await query(
        `SELECT a.id, m.nombre AS make, mo.nombre AS model
        FROM auctions a
        JOIN carrosx c ON a.car_id = c.id
        JOIN modelos mo ON c.modelo_id = mo.id
        JOIN marcas m ON mo.marca_id = m.id
        WHERE a.status = "active" 
        AND a.end_time <= ? 
        AND a.end_time > ?
        AND NOT EXISTS (
          SELECT 1 FROM notifications n 
          WHERE n.auction_id = a.id 
          AND n.type = "auction_ending" 
          AND n.created_at > DATE_SUB(NOW(), INTERVAL 10 MINUTE)
        )`,
        [fiveMinutesFromNow, now]
      );

      for (const auction of endingSoonAuctions) {
        // Emitir evento WebSocket
        this.io.emit('auction_ending_soon', {
          auctionId: auction.id,
          message: '¡Solo quedan 5 minutos!'
        });

        // Notificar a observadores
        await this.createNotificationsForWatchers(
          auction.id,
          'auction_ending',
          '⏰ ¡Últimos 5 minutos!',
          `La subasta de ${auction.make} ${auction.model} termina pronto`,
          'high'
        );

        console.log(`⏰ Alerta enviada para subasta ${auction.id} - 5 minutos restantes`);
      }

    } catch (error) {
      console.error('Error enviando alertas:', error);
    }
  }

  async createNotification(userId, type, title, message, auctionId = null, priority = 'medium') {
    try {
      const { v4: uuidv4 } = require('uuid');
      
      await query(
        'INSERT INTO notifications (id, user_id, type, title, message, auction_id, priority) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [uuidv4(), userId, type, title, message, auctionId, priority]
      );

      // Emitir notificación por WebSocket
      this.io.to(`user_${userId}`).emit('notification', {
        type,
        title,
        message,
        auctionId,
        priority,
        timestamp: new Date()
      });

    } catch (error) {
      console.error('Error creando notificación:', error);
    }
  }

  async createNotificationsForWatchers(auctionId, type, title, message, priority = 'medium') {
    try {
      const watchers = await query(
        'SELECT user_id FROM auction_watchers WHERE auction_id = ?',
        [auctionId]
      );

      for (const watcher of watchers) {
        await this.createNotification(watcher.user_id, type, title, message, auctionId, priority);
      }

    } catch (error) {
      console.error('Error creando notificaciones para observadores:', error);
    }
  }

  // Método para obtener tiempo restante de una subasta
  getTimeRemaining(endTime) {
    const now = new Date();
    const end = new Date(endTime);
    const diff = end.getTime() - now.getTime();

    if (diff <= 0) return null;

    return {
      total: diff,
      days: Math.floor(diff / (1000 * 60 * 60 * 24)),
      hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
      minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
      seconds: Math.floor((diff % (1000 * 60)) / 1000)
    };
  }
}

