import { query, transaction } from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';

class Auction {
  // Obtener todas las subastas
  static async getAll(filters = {}) {
    const { status, limit = 50, offset = 0 } = filters;
    
    let whereClause = '';
    const params = [];

    if (status && ['upcoming', 'active', 'ended'].includes(status)) {
      whereClause = 'WHERE a.status = ?';
      params.push(status);
    }

    const auctionsQuery = `SELECT 
      a.*, mox.nombre as model, mar.nombre as make, u.pre_registro_id as id_pro,
      c.year, c.kilometraje as mileage, c.color, c.condicion as condition_status,
      c.descripcion as car_description, c.precio as estimated_value,
      (SELECT COUNT(*) FROM bids b WHERE b.auction_id = a.id) as bid_count, 
      (SELECT url FROM imagenes_carrosx WHERE carro_id = c.id AND es_principal = 1 LIMIT 1) AS imagen,
      (SELECT COUNT(*) FROM auction_watchers aw WHERE aw.auction_id = a.id) as watchers_count
      FROM auctions a
      JOIN carrosx c ON a.car_id = c.id
      JOIN modelos mox ON c.modelo_id = mox.id
      JOIN marcas mar ON mox.marca_id = mar.id
      JOIN usuario u ON c.usuario_id = u.documento
      ${whereClause}
      ORDER BY 
        CASE 
          WHEN a.status = 'active' THEN 1
          WHEN a.status = 'upcoming' THEN 2
          WHEN a.status = 'ended' THEN 3
        END,
        a.end_time ASC
      LIMIT ? OFFSET ?`;
    
    params.push(parseInt(limit), parseInt(offset));
    return await query(auctionsQuery, params);
  }

  // Obtener subasta por ID
  static async getById(id) {
    const queryStr = `SELECT 
      a.*, c.year, m.nombre AS marca, mo.nombre AS modelo, 
      c.kilometraje, c.color, c.condicion, c.descripcion, c.precio,
      ic_principal.url AS imagen, ic.id AS image_id, ic.url AS image_url, 
      ic.es_principal AS is_principal 
      FROM auctions a 
      JOIN carrosx c ON a.car_id = c.id 
      JOIN modelos mo ON c.modelo_id = mo.id 
      JOIN marcas m ON mo.marca_id = m.id 
      LEFT JOIN imagenes_carrosx ic ON c.id = ic.carro_id 
      LEFT JOIN imagenes_carrosx ic_principal ON c.id = ic_principal.carro_id AND ic_principal.es_principal = TRUE 
      WHERE a.id = ? 
      ORDER BY ic.es_principal DESC, ic.id LIMIT 100`;
    
    return await query(queryStr, [id]);
  }

  // Obtener información básica de subasta
  static async getAuctionInfo(auctionId) {
    return await query(
      'SELECT id, seller_id, current_bid, status, end_time, bid_count, start_price FROM auctions WHERE id = ?',
      [auctionId]
    );
  }

  // Verificar si subasta existe
  static async exists(auctionId) {
    const result = await query(
      'SELECT COUNT(*) as count FROM auctions WHERE id = ?',
      [auctionId]
    );
    return result[0]?.count > 0;
  }

  // Crear nueva subasta
  static async create(auctionData, userId, userName) {

    return await transaction(async (connection) => {
      const { carId, startPrice, duration, startImmediately, scheduledStartTime, reservePrice } = auctionData;
      
      // Validar fecha de inicio programada
      if (!startImmediately) {
        const startTime = new Date(scheduledStartTime);
        if (startTime <= new Date()) {
          throw new Error('La fecha de inicio programada debe ser futura');
        }
      }

      const startTime = startImmediately ? new Date() : new Date(scheduledStartTime);
      const endTime = new Date(startTime.getTime() + (duration * 60 * 60 * 1000));
      const status = startImmediately ? 'active' : 'upcoming';

      const auctionId = uuidv4();
      const [rows] = await query(
      'SELECT documento FROM usuario WHERE pre_registro_id = ? LIMIT 1', 
       [userId] );
      const userIdx = rows.documento;
      
      await connection.query(
        'INSERT INTO auctions (id, car_id, seller_id, seller_name, start_price, reserve_price, current_bid, start_time, end_time, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [auctionId, carId, userIdx, userName, startPrice, reservePrice, startPrice, startTime, endTime, status]
      );

      await connection.query(
        'UPDATE carrosx_estadocar SET fecha_salida = NOW() WHERE id_car = ? AND fecha_salida IS NULL',
        [carId]
      );

      await connection.query(
        'INSERT INTO carrosx_estadocar (id_car, id_estado, fecha_inicio) VALUES (?, 3, NOW())',
        [carId]
      );

      return { auctionId, startTime, endTime, status };
    });
  }

  // Verificar si el carro puede ser subastado
  static async canAuctionCar(carId, preRegistroId) {
    const cars = await query(
      `SELECT CONVERT(c.id, CHAR) AS car_id, c.usuario_id AS cedula, 
       CASE WHEN (SELECT ec.id_estado FROM carrosx_estadocar ec 
                 WHERE ec.id_car = c.id ORDER BY ec.fecha_inicio DESC LIMIT 1) = 3 
            THEN TRUE ELSE FALSE END AS is_in_auction 
       FROM carrosx c 
       JOIN usuario u ON c.usuario_id = u.documento 
       WHERE u.pre_registro_id = ? AND c.id = ? LIMIT 1`,
      [preRegistroId, carId]
    );

    return cars.length > 0 ? cars[0] : null;
  }

  // Obtener pujas de una subasta
  static async getBids(auctionId, limit = 10) {
    return await query(
      'SELECT id, user_id, user_name, amount, created_at FROM bids WHERE auction_id = ? ORDER BY amount DESC, created_at DESC LIMIT ?',
      [auctionId, limit]
    );
  }

  // Realizar puja
  static async placeBid(auctionId, userId, userName, amount) {
    return await transaction(async (connection) => {
      // Verificar que la subasta existe primero
      const auctionExists = await connection.query(
        'SELECT id FROM auctions WHERE id = ? FOR UPDATE',
        [auctionId]
      );

      if (auctionExists.length === 0) {
        throw new Error('Subasta no encontrada');
      }

      const bidId = uuidv4();
      const [rows] = await query(
      'SELECT documento FROM usuario WHERE pre_registro_id = ? LIMIT 1', 
       [userId] );
      const userIdx = rows.documento; 
      
      await connection.query(
        'INSERT INTO bids (id, auction_id, user_id, user_name, amount) VALUES (?, ?, ?, ?, ?)',
        [bidId, auctionId, userIdx, userName, amount]
      );

      await connection.query(
        'UPDATE auctions SET current_bid = ?, highest_bidder_id = ?, highest_bidder_name = ?, bid_count = bid_count + 1 WHERE id = ?',
        [amount, userIdx, userName, auctionId]
      );

      return { bidId };
    });
  }

  // Verificar si usuario está observando
  static async isWatching(auctionId, userId) {
    const watchers = await query(
      'SELECT id FROM auction_watchers WHERE auction_id = ? AND user_id = ?',
      [auctionId, userId]
    );
    return watchers.length > 0;
  }

  // Agregar observador
  static async addWatcher(auctionId, userId) {
    // Verificar si ya está observando primero
    const isWatching = await this.isWatching(auctionId, userId);
    if (isWatching) {
      throw new Error('Ya está observando esta subasta');
    }

    const watcherId = uuidv4();
    await query(
      'INSERT INTO auction_watchers (id, auction_id, user_id) VALUES (?, ?, ?)',
      [watcherId, auctionId, userId]
    );

    await query(
      'UPDATE auctions SET watchers_count = watchers_count + 1 WHERE id = ?',
      [auctionId]
    );

    return watcherId;
  }

  // Remover observador
  static async removeWatcher(auctionId, userId) {
    const result = await query(
      'DELETE FROM auction_watchers WHERE auction_id = ? AND user_id = ?',
      [auctionId, userId]
    );

    if (result.affectedRows > 0) {
      await query(
        'UPDATE auctions SET watchers_count = GREATEST(watchers_count - 1, 0) WHERE id = ?',
        [auctionId]
      );
    }

    return result.affectedRows;
  }

  // Obtener contador de observadores
  static async getWatchersCount(auctionId) {
    const result = await query(
      'SELECT COUNT(*) as count FROM auction_watchers WHERE auction_id = ?',
      [auctionId]
    );
    return result[0]?.count || 0;
  }
}

export default Auction;