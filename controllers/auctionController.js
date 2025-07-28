import Auction from '../models/Auction.js';
import Bid from '../models/Bid.js';
import { emitAuctionUpdate } from '../services/socketService.js';
import { NotFoundError, BadRequestError } from '../utils/errors.js';

export const createAuction = async (req, res, next) => {
  try {
    const { car_id, start_price, reserve_price, start_time, end_time } = req.body;
    const created_by = req.user.id;

    const auctionId = await Auction.create({
      car_id,
      start_price,
      reserve_price,
      start_time,
      end_time,
      created_by
    });

    const auction = await Auction.findById(auctionId);
    res.status(201).json(auction);
  } catch (err) {
    next(err);
  }
};

export const getActiveAuctions = async (req, res, next) => {
  try {
    const auctions = await Auction.findActiveAuctions();
    res.json(auctions);
  } catch (err) {
    next(err);
  }
};

export const getAuctionDetails = async (req, res, next) => {
  try {
    const { id } = req.params;
    const auction = await Auction.findById(id);

    if (!auction) {
      throw new NotFoundError('Auction not found');
    }

    const bids = await Bid.findByAuction(id);
    const highestBid = await Auction.getHighestBid(id);

    res.json({
      ...auction,
      bids,
      current_price: highestBid || auction.start_price
    });
  } catch (err) {
    next(err);
  }
};

export const placeBid = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { amount } = req.body;
    const userId = req.user.id;

    const auction = await Auction.findById(id);
    if (!auction) {
      throw new NotFoundError('Auction not found');
    }

    if (auction.status !== 'active') {
      throw new BadRequestError('Auction is not active');
    }

    const highestBid = await Auction.getHighestBid(id) || auction.start_price;
    if (amount <= highestBid) {
      throw new BadRequestError('Bid amount must be higher than current price');
    }

    const bidId = await Bid.create({
      auction_id: id,
      user_id: userId,
      amount
    });

    const bid = await Bid.findById(bidId);
    
    // Emit real-time update via WebSocket
    await emitAuctionUpdate(id, {
      currentPrice: amount,
      lastBid: bid,
      bidsCount: await Bid.countByAuction(id)
    });

    res.status(201).json(bid);
  } catch (err) {
    next(err);
  }
};

// Exportación por defecto para compatibilidad
export default {
  createAuction,
  getActiveAuctions,
  getAuctionDetails,
  placeBid
};