import express from 'express';
import { upload } from '../config/upload.js';
import carController from '../controllers/carController.js';
import { authenticate} from '../middleware/auth.js'

const router = express.Router();
const jsonMiddleware = express.json();
const urlencodedMiddleware = express.urlencoded({ extended: true });

router.post('/', authenticate, upload.array('photos'), carController.uploadCar)

router.get("/",jsonMiddleware, urlencodedMiddleware, carController.getAllCars)
router.get("/pending", authenticate, jsonMiddleware, urlencodedMiddleware, carController.getPendingCars)
router.get('/:userId/cars',jsonMiddleware, urlencodedMiddleware, carController.getUserCars);
router.post('/:carId/reject', authenticate, jsonMiddleware, urlencodedMiddleware, carController.rejectCars)
router.post('/:carId/approve', authenticate, jsonMiddleware, urlencodedMiddleware, carController.approveCars)


export default router;