import Auction from '../models/Auction.js';

class AuctionController {
  // Obtener todas las subastas
  static async getAllAuctions(req, res) {
    try {
      const { status, limit = 50, offset = 0 } = req.query;
      
      const auctions = await Auction.getAll({ status, limit, offset });
      const auctionsWithDetails = await Promise.all(
        auctions.map(async (auction) => {
          const bids = await Auction.getBids(auction.id);
          const isWatched = req.user ? await Auction.isWatching(auction.id, req.user.id) : false;

          return {
            id: auction.id,
            car: {
              id: auction.car_id,
              make: auction.make,
              model: auction.model,
              year: auction.year,
              mileage: auction.mileage,
              color: auction.color,
              condition: auction.condition_status,
              description: auction.car_description,
              estimatedValue: parseFloat(auction.estimated_value || 0),
              imagen: auction.imagen
            },
            startPrice: parseFloat(auction.start_price),
            reservePrice: auction.reserve_price ? parseFloat(auction.reserve_price) : null,
            currentBid: parseFloat(auction.current_bid || 0),
            bidCount: parseInt(auction.bid_count || 0),
            highestBidder: auction.highest_bidder_id,
            highestBidderName: auction.highest_bidder_name,
            startTime: auction.start_time,
            endTime: auction.end_time,
            status: auction.status,
            bids: bids.map(bid => ({
              id: bid.id,
              auctionId: auction.id,
              userId: bid.user_id,
              userName: bid.user_name,
              amount: parseFloat(bid.amount),
              timestamp: bid.created_at
            })),
            watchers: parseInt(auction.watchers_count || 0),
            isWatched,
            sellerId: auction.id_pro,
            sellerName: auction.seller_name
          };
        })
      );

      res.json(auctionsWithDetails);
    } catch (error) {
      console.error('Error obteniendo subastas:', error);
      res.status(500).json({
        error: 'Error interno del servidor',
        code: 'INTERNAL_ERROR'
      });
    }
  }

  // Obtener subasta específica
  static async getAuction(req, res) {
    try {
      const { id } = req.params;
      const auctions = await Auction.getById(id);
      if (auctions.length === 0) {
        return res.status(404).json({
          error: 'Subasta no encontrada',
          code: 'AUCTION_NOT_FOUND'
        });
      }

      const processedData = AuctionController.processAuctionData(auctions);
      const bids = await Auction.getBids(id, 100);
      const isWatched = req.user ? await Auction.isWatching(id, req.user.id) : false;
      const watchersCount = await Auction.getWatchersCount(id);

      const response = {
        ...processedData,
        bidCount: bids.length,
        bids: bids.map(bid => ({
          id: bid.id,
          auctionId: id,
          userId: bid.user_id,
          userName: bid.user_name,
          amount: parseFloat(bid.amount),
          timestamp: bid.created_at
        })),
        watchers: watchersCount,
        isWatched
      };
      res.json(response);
    } catch (error) {
      console.error('Error obteniendo subasta:', error);
      res.status(500).json({
        error: 'Error interno del servidor',
        code: 'INTERNAL_ERROR'
      });
    }
  }
  static processAuctionData(auctions) {
    return auctions.reduce((acc, row) => {
      if (!acc.car) {
        acc = {
          id: row.id,
          car: {
            id: row.car_id,
            imagen:row.imagen,
            make: row.marca,
            model: row.modelo,
            year: row.year,
            mileage: row.kilometraje,
            color: row.color,
            condition: row.condicion,
            description: row.descripcion,
            estimatedValue: parseFloat(row.precio || 0),
            imagenes: []
          },
          startPrice: parseFloat(row.start_price || 0),
          reservePrice: row.reserve_price ? parseFloat(row.reserve_price) : null,
          currentBid: parseFloat(row.current_bid || 0),
          highestBidder: row.highest_bidder_id || null,
          highestBidderName: row.highest_bidder_name || null,
          startTime: row.start_time,
          endTime: row.end_time,
          status: row.status,
          sellerId: row.seller_id,
          sellerName: row.seller_name || ''
        };
      }

      // Procesar imágenes de forma segura
      if (row.image_id && row.image_url) {
        const imageData = {
          id: row.image_id,
          url: row.image_url,
          isMain: Boolean(row.is_principal)
        };

        if (row.is_principal) {
          acc.car.imagenes.unshift(imageData);
        } else {
          acc.car.imagenes.push(imageData);
        }
      }

      // Imagen principal directa
      if (row.imagen_principal && !acc.car.imagenes.some(img => img.isMain)) {
        acc.car.imagenes.unshift({
          id: `principal_${row.id}`,
          url: row.imagen,
          isMain: true
        });
      }

      return acc;
    }, {});
  }
  // Crear nueva subasta
  static async createAuction(req, res) {
    try {
      const { carId, startPrice, duration, startImmediately, scheduledStartTime } = req.validatedData;
      const reservePrice = req.validatedData.reservePrice ?? null;

      // Validar fecha programada
      if (!startImmediately) {
        const startTime = new Date(scheduledStartTime);
        if (startTime <= new Date()) {
          return res.status(400).json({
            error: 'La fecha de inicio programada debe ser futura',
            code: 'INVALID_START_TIME'
          });
        }
      }

      const car = await Auction.canAuctionCar(carId, req.user.id);
      
      if (!car) {
        return res.status(404).json({
          error: 'Carro no encontrado o no tienes permisos',
          code: 'CAR_NOT_FOUND'
        });
      }

      if (car.is_in_auction) {
        return res.status(400).json({
          error: 'El carro ya está en subasta',
          code: 'CAR_IN_AUCTION'
        });
      }

      if (reservePrice && reservePrice <= startPrice) {
        return res.status(400).json({
          error: 'El precio de reserva debe ser mayor al precio inicial',
          code: 'INVALID_RESERVE_PRICE'
        });
      }

      const result = await Auction.create(
        { carId, startPrice, duration, startImmediately, scheduledStartTime, reservePrice },
        req.user.id,
        req.user.name
      );

      const newAuction = await Auction.getById(result.auctionId);
      
      if (newAuction.length === 0) {
        return res.status(404).json({ 
          error: 'Subasta no encontrada después de crearla',
          code: 'AUCTION_CREATION_FAILED'
        });
      }
      const processedData = AuctionController.processAuctionData(newAuction);
      res.status(201).json({
        message: 'Subasta creada exitosamente',
        auction: processedData
      });
    } catch (error) {
      console.error('Error creando subasta:', error);
      
      if (error.message.includes('fecha de inicio')) {
        return res.status(400).json({
          error: error.message,
          code: 'INVALID_START_TIME'
        });
      }

      res.status(500).json({
        error: 'Error interno del servidor',
        code: 'INTERNAL_ERROR'
      });
    }
  }
  
  // Realizar puja
  static async placeBid(req, res) {
    try {
      const { id: auctionId } = req.params;
      const { amount } = req.validatedData;
     

      const auctions = await Auction.getAuctionInfo(auctionId);

      if (auctions.length === 0) {
        return res.status(404).json({
          error: 'Subasta no encontrada',
          code: 'AUCTION_NOT_FOUND'
        });
      }

      const auction = auctions[0];

      if (auction.status !== 'active') {
        return res.status(400).json({
          error: 'La subasta no está activa',
          code: 'AUCTION_NOT_ACTIVE'
        });
      }

      if (new Date() > new Date(auction.end_time)) {
        return res.status(400).json({
          error: 'La subasta ha terminado',
          code: 'AUCTION_ENDED'
        });
      }

      if (auction.seller_id === req.user.id) {
        return res.status(400).json({
          error: 'No puedes pujar en tu propia subasta',
          code: 'CANNOT_BID_OWN_AUCTION'
        });
      }

      const minBidAmount = parseFloat(auction.current_bid || auction.start_price) + 100;
      if (amount < minBidAmount) {
        return res.status(400).json({
          error: `La puja mínima es $${minBidAmount.toLocaleString()}`,
          code: 'BID_TOO_LOW',
          minAmount: minBidAmount
        });
      }

      if (req.user.balance < amount) {
        return res.status(400).json({
          error: 'Balance insuficiente',
          code: 'INSUFFICIENT_BALANCE'
        });
      }

      const result = await Auction.placeBid(auctionId, req.user.id, req.user.name, amount);

      const newBid = {
        id: result.bidId,
        auctionId,
        userId: req.user.id,
        userName: req.user.name,
        amount,
        timestamp: new Date()
      };

      res.status(201).json({
        message: 'Puja realizada exitosamente',
        bid: newBid
      });

      // Emitir evento WebSocket
      if (req.app.get('io')) {
        req.app.get('io').emit('bid_placed', {
          auctionId,
          bid: newBid,
          currentBid: amount,
          bidCount: parseInt(auction.bid_count) + 1
        });
      }
    } catch (error) {
      console.error('Error realizando puja:', error);
      
      if (error.message.includes('Subasta no encontrada')) {
        return res.status(404).json({
          error: 'Subasta no encontrada',
          code: 'AUCTION_NOT_FOUND'
        });
      }

      res.status(500).json({
        error: 'Error interno del servidor',
        code: 'INTERNAL_ERROR'
      });
    }
  }

  // Observar subasta
  static async watchAuction(req, res) {
    try {
      const { id: auctionId } = req.params;

      const auctionExists = await Auction.exists(auctionId);
      
      if (!auctionExists) {
        return res.status(404).json({
          error: 'Subasta no encontrada',
          code: 'AUCTION_NOT_FOUND'
        });
      }

      await Auction.addWatcher(auctionId, req.user.id);

      res.json({
        message: 'Ahora estás observando esta subasta',
        watching: true
      });
    } catch (error) {
      console.error('Error agregando observador:', error);
      
      if (error.message.includes('Ya está observando')) {
        return res.status(400).json({
          error: error.message,
          code: 'ALREADY_WATCHING'
        });
      }

      res.status(500).json({
        error: 'Error interno del servidor',
        code: 'INTERNAL_ERROR'
      });
    }
  }

  // Dejar de observar subasta
  static async unwatchAuction(req, res) {
    try {
      const { id: auctionId } = req.params;

      const removed = await Auction.removeWatcher(auctionId, req.user.id);

      if (removed === 0) {
        return res.status(400).json({
          error: 'No estás observando esta subasta',
          code: 'NOT_WATCHING'
        });
      }

      res.json({
        message: 'Ya no estás observando esta subasta',
        watching: false
      });
    } catch (error) {
      console.error('Error removiendo observador:', error);
      res.status(500).json({
        error: 'Error interno del servidor',
        code: 'INTERNAL_ERROR'
      });
    }
  }

}

export default AuctionController;