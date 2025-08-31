import express from 'express'
import { v4 as uuidv4 } from 'uuid';
import { query, transaction } from '../config/database.js';
import { authenticate, optionalAuth, checkOwnership } from '../middleware/auth.js';
import  { validate, validateParams, paramSchemas }from '../middleware/validationsuba.js';

const router = express.Router();

// Obtener todas las subastas
router.get('/', authenticate, async (req, res) => {
  
  try {
    const { status, limit = 50, offset = 0 } = req.query;
    
    let whereClause = '';
    const params = [];

    if (status && ['upcoming', 'active', 'ended'].includes(status)) {
      whereClause = 'WHERE a.status = ?';
      params.push(status);
    }

    const auctionsQuery = `SELECT 
 a.*, mox.nombre as model, mar.nombre as make,u.pre_registro_id as id_pro,
c.year, c.kilometraje as mileage, c.color, c.condicion as condition_status,
c.descripcion as car_description, c.precio as estimated_value,
(SELECT COUNT(*) FROM bids b WHERE b.auction_id = a.id) as bid_count, (SELECT COUNT(*) FROM auction_watchers aw WHERE aw.auction_id = a.id) as watchers_count
 FROM auctions a
JOIN carrosx c ON a.car_id = c.id
JOIN modelos mox ON c.modelo_id = mox.id
JOIN marcas mar ON mox.marca_id = mar.id
JOIN usuario u ON c.usuario_id = u.documento
${whereClause ? 'WHERE ' + whereClause : ''}
ORDER BY 
CASE 
WHEN a.status = 'active' THEN 1
WHEN a.status = 'upcoming' THEN 2
WHEN a.status = 'ended' THEN 3
END,
a.end_time ASC
LIMIT ? OFFSET ?
`;
    params.push(parseInt(limit), parseInt(offset));
    const auctions = await query(auctionsQuery, params);

    // Obtener pujas para cada subasta
    const auctionsWithBids = await Promise.all(
      auctions.map(async (auction) => {
        const bids = await query(
          'SELECT id, user_id, user_name, amount, created_at FROM bids WHERE auction_id = ? ORDER BY amount DESC, created_at DESC LIMIT 10',
          [auction.id]
        );

        // Verificar si el usuario actual está observando
        let isWatched = false;
        if (req.user) {
          const watchers = await query(
            'SELECT id FROM auction_watchers WHERE auction_id = ? AND user_id = ?',
            [auction.id, req.user.id]
          );
          isWatched = watchers.length > 0;
        }

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
            estimatedValue: parseFloat(auction.estimated_value),
            images: JSON.parse(auction.images || '[]')
          },
          startPrice: parseFloat(auction.start_price),
          reservePrice: auction.reserve_price ? parseFloat(auction.reserve_price) : null,
          currentBid: parseFloat(auction.current_bid),
          bidCount: parseInt(auction.bid_count),
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
          watchers: parseInt(auction.watchers_count),
          isWatched,
          sellerId: auction.id_pro,
          sellerName: auction.seller_name
        };
      })
    );

    res.json(auctionsWithBids);

  } catch (error) {
    console.error('Error obteniendo subastas:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});

// Obtener subasta específica
router.get('/:id', validateParams(paramSchemas.uuid), optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const auctionsQuery = `SELECT a.*, c.year, m.nombre AS marca, mo.nombre AS modelo, c.kilometraje,c.color, c.condicion, c.descripcion, ic_principal.url AS imagen_principal, ic.id AS image_id, ic.url AS image_url, ic.es_principal AS is_principal FROM auctions a JOIN carrosx c ON a.car_id = c.id JOIN modelos mo ON c.modelo_id = mo.id JOIN marcas m ON mo.marca_id = m.id LEFT JOIN imagenes_carrosx ic ON c.id = ic.carro_id LEFT JOIN imagenes_carrosx ic_principal ON c.id = ic_principal.carro_id AND ic_principal.es_principal = TRUE WHERE a.id = ? ORDER BY ic.es_principal DESC, ic.id LIMIT 100`;

    const auctions = await query(auctionsQuery, [id]);

    if (auctions.length === 0) {
      return res.status(404).json({
        error: 'Subasta no encontrada',
        code: 'AUCTION_NOT_FOUND'
      });
    }
    const processedData = auctions.reduce((acc, row) => {
        if (!acc.car) {
            acc = {
                id: row.id,
                car: {
                    id: row.car_id,
                    make: row.marca,
                    model: row.modelo,
                    year: row.year,
                    mileage: row.kilometraje,
                    color: row.color, 
                    condition: row.condicion,
                    description: row.descripcion,
                    estimatedValue: parseFloat(row.precio), 
                    images: []
                },
                startPrice: parseFloat(row.start_price),
                reservePrice: row.reserve_price ? parseFloat(row.reserve_price) : null,
                currentBid: parseFloat(row.current_bid || 0),
                bidCount: row.bid_count || 0,
                highestBidder: row.highest_bidder || null,
                highestBidderName: row.highest_bidder_name || null,
                startTime: row.start_time,
                endTime: row.end_time,
                status: row.status,
                bids: [],
                watchers: row.watchers || 0,
                isWatched: false,
                sellerId: row.seller_id,
                sellerName: row.seller_name || ''
            };
        }

        // Procesar imágenes
        if (row.image_id) {
            if (row.is_principal) {
                // Si hay imagen principal, la colocamos primero
                acc.car.images.unshift({
                    id: row.image_id,
                    url: row.image_url,
                    isMain: true
                });
            } else {
                acc.car.images.push({
                    id: row.image_id,
                    url: row.image_url,
                    isMain: false
                });
            }
        }

        return acc;
    }, {});

    // Si hay imagen_principal directa (de tu consulta)
    if (auctions[0].imagen_principal) {
        // Verificamos que no esté ya incluida
        const exists = processedData.car.images.some(img => img.isMain);
        if (!exists) {
            processedData.car.images.unshift({
                id: auctions[0].image_id,
                url: auctions[0].imagen_principal,
                isMain: true
            });
        }
    }

    const auction = auctions[0];

    // Obtener pujas
    const bids = await query(
      'SELECT id, user_id, user_name, amount, created_at FROM bids WHERE auction_id = ? ORDER BY amount DESC, created_at DESC',
      [id]
    );

    // Verificar si el usuario actual está observando
    let isWatched = false;
    if (req.user) {
      const watchers = await query(
        'SELECT id FROM auction_watchers WHERE auction_id = ? AND user_id = ?',
        [id, req.user.id]
      );
      isWatched = watchers.length > 0;
    }

    // Contar observadores
    const watchersCount = await query(
      'SELECT COUNT(*) as count FROM auction_watchers WHERE auction_id = ?',
      [id]
    );

    const response = {
      id: auction.id,
      car: {
        id: auction.car_id,
        make: auction.marca,
        model: auction.modelo,
        year: auction.year,
        mileage: auction.kilometraje,
        color: auction.color,
        condition: auction.condicion,
        description: auction.descripcion,
        estimatedValue: parseFloat(auction.start_price),
        images: JSON.parse(auction.images || '[]')
      },
      startPrice: parseFloat(auction.start_price),
      reservePrice: auction.reserve_price ? parseFloat(auction.reserve_price) : null,
      currentBid: parseFloat(auction.current_bid),
      bidCount: bids.length,
      highestBidder: auction.highest_bidder_id,
      highestBidderName: auction.highest_bidder_name,
      startTime: auction.start_time,
      endTime: auction.end_time,
      status: auction.status,
      bids: bids.map(bid => ({
        id: bid.id,
        auctionId: id,
        userId: bid.user_id,
        userName: bid.user_name,
        amount: parseFloat(bid.amount),
        timestamp: bid.created_at
      })),
      watchers: watchersCount[0].count,
      isWatched,
      sellerId: auction.seller_id,
      sellerName: auction.seller_name
    };
console.log(response)
    res.json(response);

  } catch (error) {
    console.error('Error obteniendo subasta:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});

// Crear nueva subasta
router.post('/', authenticate, validate('createAuction'), async (req, res) => {
  try {
    const { carId, startPrice, duration, startImmediately, scheduledStartTime } = req.validatedData;
    const reservePrice = req.validatedData.reservePrice ?? null;

   const cars = await query(
      'SELECT CONVERT(c.id, CHAR) AS car_id, m.nombre AS make, mo.nombre AS model,c.year, c.usuario_id AS cedula, CASE  WHEN (SELECT ec.id_estado FROM carrosx_estadocar ec WHERE ec.id_car = c.id ORDER BY ec.fecha_inicio DESC LIMIT 1) = 3 THEN TRUE ELSE FALSE END AS is_in_auction FROM  carrosx c JOIN  modelos mo ON c.modelo_id = mo.id JOIN  marcas m ON mo.marca_id = m.id JOIN usuario u ON c.usuario_id = u.documento JOIN pre_registro pr ON u.pre_registro_id = pr.id WHERE  pr.id = ? AND c.id = ? LIMIT 5',
      [req.user.id, carId]
    );

    if (cars.length === 0) {
      return res.status(404).json({
        error: 'Carro no encontrado o no tienes permisos',
        code: 'CAR_NOT_FOUND'
      });
    }

    const car = cars[0];

    if (car.is_in_auction) {
      return res.status(400).json({
        error: 'El carro ya está en subasta',
        code: 'CAR_IN_AUCTION'
      });
    }

    // Validar precio de reserva
    if (reservePrice && reservePrice <= startPrice) {
      return res.status(400).json({
        error: 'El precio de reserva debe ser mayor al precio inicial',
        code: 'INVALID_RESERVE_PRICE'
      });
    }

    const result = await transaction(async (connection) => {
      // Calcular tiempos
      const startTime = startImmediately ? new Date() : new Date(scheduledStartTime);
      const endTime = new Date(startTime.getTime() + (duration * 60 * 60 * 1000));
      const status = startImmediately ? 'active' : 'upcoming';

      // Crear subasta
      const auctionId = uuidv4();
    
      await connection.execute(
        'INSERT INTO auctions (id, car_id, seller_id, seller_name, start_price, reserve_price, current_bid, start_time, end_time, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [auctionId, carId, car.cedula, req.user.name, startPrice, reservePrice, startPrice, startTime, endTime, status]
      );

      // Marcar carro como en subasta
      await connection.execute(
  'UPDATE carrosx_estadocar SET fecha_salida = NOW() WHERE id_car = ? AND fecha_salida IS NULL',
  [carId]
);

await connection.execute(
  'INSERT INTO carrosx_estadocar (id_car, id_estado, fecha_inicio) VALUES (?, 3, NOW())',
  [carId]
);

      return { auctionId, startTime, endTime, status };
    });

    // Obtener la subasta creada
    const newAuction = await query(
      `SELECT a.*, c.year, m.nombre AS marca, mo.nombre AS modelo, c.kilometraje,c.color, c.condicion, c.descripcion, ic_principal.url AS imagen_principal, ic.id AS image_id, ic.url AS image_url, ic.es_principal AS is_principal FROM auctions a JOIN carrosx c ON a.car_id = c.id JOIN modelos mo ON c.modelo_id = mo.id JOIN marcas m ON mo.marca_id = m.id LEFT JOIN imagenes_carrosx ic ON c.id = ic.carro_id LEFT JOIN imagenes_carrosx ic_principal ON c.id = ic_principal.carro_id AND ic_principal.es_principal = TRUE WHERE a.id = ? ORDER BY ic.es_principal DESC, ic.id LIMIT 100`,
      [result.auctionId]
    );
    if (newAuction.length === 0) {
        return res.status(404).json({ message: 'Subasta no encontrada' });
    }

    const processedData = newAuction.reduce((acc, row) => {
        if (!acc.car) {
            acc = {
                id: row.id,
                car: {
                    id: row.car_id,
                    make: row.marca,
                    model: row.modelo,
                    year: row.year,
                    mileage: row.kilometraje,
                    color: row.color, 
                    condition: row.condicion,
                    description: row.descripcion,
                    estimatedValue: parseFloat(row.precio), 
                    images: []
                },
                startPrice: parseFloat(row.start_price),
                reservePrice: row.reserve_price ? parseFloat(row.reserve_price) : null,
                currentBid: parseFloat(row.current_bid || 0),
                bidCount: row.bid_count || 0,
                highestBidder: row.highest_bidder || null,
                highestBidderName: row.highest_bidder_name || null,
                startTime: row.start_time,
                endTime: row.end_time,
                status: row.status,
                bids: [],
                watchers: row.watchers || 0,
                isWatched: false,
                sellerId: row.seller_id,
                sellerName: row.seller_name || ''
            };
        }

        // Procesar imágenes
        if (row.image_id) {
            if (row.is_principal) {
                // Si hay imagen principal, la colocamos primero
                acc.car.images.unshift({
                    id: row.image_id,
                    url: row.image_url,
                    isMain: true
                });
            } else {
                acc.car.images.push({
                    id: row.image_id,
                    url: row.image_url,
                    isMain: false
                });
            }
        }

        return acc;
    }, {});

    // Si hay imagen_principal directa (de tu consulta)
    if (newAuction[0].imagen_principal) {
        // Verificamos que no esté ya incluida
        const exists = processedData.car.images.some(img => img.isMain);
        if (!exists) {
            processedData.car.images.unshift({
                id: newAuction[0].image_id,
                url: newAuction[0].imagen_principal,
                isMain: true
            });
        }
    }

    res.status(200).json({
        message: 'Subasta obtenida exitosamente',
        auction: processedData
    });
   
  } catch (error) {
    console.error('Error creando subasta:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});

// Realizar puja
router.post('/:id/bids', validateParams(paramSchemas.uuid), authenticate, validate('placeBid'), async (req, res) => {
  try {
    const { id: auctionId } = req.params;
    const { amount } = req.validatedData;

    // Obtener información de la subasta
    const auctions = await query(
      'SELECT id, seller_id, current_bid, status, end_time FROM auctions WHERE id = ?',
      [auctionId]
    );

    if (auctions.length === 0) {
      return res.status(404).json({
        error: 'Subasta no encontrada',
        code: 'AUCTION_NOT_FOUND'
      });
    }

    const auction = auctions[0];

    // Validaciones
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

    const minBidAmount = parseFloat(auction.current_bid) + 100; // Incremento mínimo de $100
    if (amount < minBidAmount) {
      return res.status(400).json({
        error: `La puja mínima es $${minBidAmount.toLocaleString()}`,
        code: 'BID_TOO_LOW',
        minAmount: minBidAmount
      });
    }

    // Verificar balance del usuario
    if (req.user.balance < amount) {
      return res.status(400).json({
        error: 'Balance insuficiente',
        code: 'INSUFFICIENT_BALANCE'
      });
    }

    const result = await transaction(async (connection) => {
      // Crear la puja
      const bidId = uuidv4();
       const [rows] = await query(
          'SELECT documento FROM usuario WHERE pre_registro_id = ? LIMIT 1', 
          [req.user.id]
        );
     const usuario_idx = rows.documento; 
      await connection.execute(
        'INSERT INTO bids (id, auction_id, user_id, user_name, amount) VALUES (?, ?, ?, ?, ?)',
        [bidId, auctionId, usuario_idx, req.user.name, amount]
      );

      // Actualizar la subasta
      await connection.execute(
        'UPDATE auctions SET current_bid = ?, highest_bidder_id = ?, highest_bidder_name = ?, bid_count = bid_count + 1 WHERE id = ?',
        [amount, usuario_idx, req.user.name, auctionId]
      );

      return { bidId };
    });

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

    // Emitir evento WebSocket (se manejará en el servidor principal)
    req.app.get('io')?.emit('bid_placed', {
      auctionId,
      bid: newBid,
      currentBid: amount,
      bidCount: auction.bid_count + 1
    });

  } catch (error) {
    console.error('Error realizando puja:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});

// Observar/dejar de observar subasta
router.post('/:id/watch', validateParams(paramSchemas.uuid), authenticate, async (req, res) => {
  try {
    const { id: auctionId } = req.params;

    // Verificar que la subasta existe
    const auctions = await query('SELECT id FROM auctions WHERE id = ?', [auctionId]);
    
    if (auctions.length === 0) {
      return res.status(404).json({
        error: 'Subasta no encontrada',
        code: 'AUCTION_NOT_FOUND'
      });
    }

    // Verificar si ya está observando
    const existing = await query(
      'SELECT id FROM auction_watchers WHERE auction_id = ? AND user_id = ?',
      [auctionId, req.user.id]
    );

    if (existing.length > 0) {
      return res.status(400).json({
        error: 'Ya estás observando esta subasta',
        code: 'ALREADY_WATCHING'
      });
    }

    // Agregar observador
    const watcherId = uuidv4();
    await query(
      'INSERT INTO auction_watchers (id, auction_id, user_id) VALUES (?, ?, ?)',
      [watcherId, auctionId, req.user.id]
    );

    // Actualizar contador
    await query(
      'UPDATE auctions SET watchers_count = watchers_count + 1 WHERE id = ?',
      [auctionId]
    );

    res.json({
      message: 'Ahora estás observando esta subasta',
      watching: true
    });

  } catch (error) {
    console.error('Error agregando observador:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});

// Dejar de observar subasta
router.delete('/:id/watch', validateParams(paramSchemas.uuid), authenticate, async (req, res) => {
  try {
    const { id: auctionId } = req.params;

    // Eliminar observador
    const result = await query(
      'DELETE FROM auction_watchers WHERE auction_id = ? AND user_id = ?',
      [auctionId, req.user.id]
    );

    if (result.affectedRows === 0) {
      return res.status(400).json({
        error: 'No estás observando esta subasta',
        code: 'NOT_WATCHING'
      });
    }

    // Actualizar contador
    await query(
      'UPDATE auctions SET watchers_count = GREATEST(watchers_count - 1, 0) WHERE id = ?',
      [auctionId]
    );

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
});

export default router;