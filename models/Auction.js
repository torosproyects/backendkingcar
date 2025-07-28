import pool from '../config/database.js';

class Auction {
  static async create({
    car_id,
    start_price,
    reserve_price,
    start_time,
    end_time,
    status = 'draft',
    created_by
  }) {
    const [result] = await pool.query(
      `INSERT INTO auctions 
      (car_id, start_price, reserve_price, start_time, end_time, status, created_by) 
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [car_id, start_price, reserve_price, start_time, end_time, status, created_by]
    );
    return result.insertId;
  }

  static async findActiveAuctions() {
    const [rows] = await pool.query(
      `SELECT a.*, c.make, c.model, c.year, c.mileage, c.image_urls 
       FROM auctions a
       JOIN cars c ON a.car_id = c.id
       WHERE a.status = 'active' AND a.end_time > NOW()`
    );
    return rows;
  }

  static async findById(id) {
    const [rows] = await pool.query(
      `SELECT a.*, c.make, c.model, c.year, c.mileage, c.image_urls 
       FROM auctions a
       JOIN cars c ON a.car_id = c.id
       WHERE a.id = ?`,
      [id]
    );
    return rows[0];
  }

  static async updateStatus(auctionId, status) {
    await pool.query('UPDATE auctions SET status = ? WHERE id = ?', [status, auctionId]);
  }

  static async getHighestBid(auctionId) {
    const [rows] = await pool.query(
      'SELECT MAX(amount) as highest_bid FROM bids WHERE auction_id = ?',
      [auctionId]
    );
    return rows[0].highest_bid;
  }
}

export default Auction;