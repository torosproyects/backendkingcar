import express from 'express';
import { upload } from '../config/upload.js';
import carController from '../controllers/carController.js';
import { authenticate} from '../middleware/auth.js'

const router = express.Router();
const jsonMiddleware = express.json();
const urlencodedMiddleware = express.urlencoded({ extended: true });

router.post('/', authenticate, upload.array('photos'), carController.uploadCar)

router.get("/",jsonMiddleware, urlencodedMiddleware, carController.getAllCars)


export default router;