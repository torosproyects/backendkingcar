import express from 'express';
import AuctionController from '../controllers/auctionController.js';
import { authenticate, optionalAuth } from '../middleware/auth.js';
import { validate, validateParams, paramSchemas } from '../middleware/validationsuba.js';

const router = express.Router();

router.get('/', authenticate, AuctionController.getAllAuctions);
router.get('/:id', validateParams(paramSchemas.uuid), optionalAuth, AuctionController.getAuction);
router.post('/', authenticate, validate('createAuction'), AuctionController.createAuction);
router.post('/:id/bids', validateParams(paramSchemas.uuid), authenticate, validate('placeBid'), AuctionController.placeBid);
router.post('/:id/watch', validateParams(paramSchemas.uuid), authenticate, AuctionController.watchAuction);
router.delete('/:id/watch', validateParams(paramSchemas.uuid), authenticate, AuctionController.unwatchAuction);

export default router;