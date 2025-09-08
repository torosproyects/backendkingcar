import Car from '../models/Car.js';
import {CarService}  from '../service/car.service.js'
import { sendRevisionEmail } from "../utils/emailService.js";


export default class CarController {
  static async uploadCar(req, res) {
    try {
     const { 
      plate, 
      price, 
      description, 
      condition, 
      bodyType, 
      location,
      vehicleData: vehicleDataString // ¡Recibido como string!
      } =  req.body;
      const vehicleData = JSON.parse(vehicleDataString || '{}');
      const photos = req.files || [];
      const userId = req.user.id; 

      if (!plate || !vehicleData.make || !vehicleData.model) {
        return res.status(400).json({
          success: false,
          error: "Faltan campos requeridos (placa, marca o modelo)"
        });
      }
      const carData = {
        plate,
        price: Number(price),
        description,
        condition,
        bodyType,
        location
      };

       const carId = await CarService.createCar({
        carData,
         vehicleData: {
          make: vehicleData.make,
          model: vehicleData.model,
          year: vehicleData.year,
          color: vehicleData.color,
          vin: vehicleData.vin,
          engine: vehicleData.engine,
          transmission: vehicleData.transmission,
          fuelType: vehicleData.fuelType,
          mileage: vehicleData.mileage
        },
        photos: photos.map((file, index) => ({
          buffer: file.buffer,
          originalname: file.originalname,
          mimetype: file.mimetype,
          templateId: file.fieldname // O usa otro método para obtener templateId
        })),
        userId
        });
        const createdCarData = await Car.getCarId(carId);
       await sendRevisionEmail(req.user.email,req.user.name,plate)

      res.status(201).json({
        success: true,
        message: 'Vehículo subido exitosamente',
        data: createdCarData
      });
    } catch (error) {
      console.error('Error uploading car:', error);
      res.status(500).json({
        success: false,
        message: 'Error al subir el vehículo',
        error: error.message
      });
    }
  }

  static async getAllCars(req, res) {
    try {
      const cars = await Car.getAll();
      return res.json(cars);
    } catch (error) {
       console.log(error)
      return res.status(500).json({ 
        success: false,
        error: 'Error al obtener los vehículos'
      });
    }
  }

  static async getCarById(req, res) {
    try {
      const car = await Car.findById(req.params.id);
      if (!car) {
        return res.status(404).json({ 
          success: false,
          error: 'Vehículo no encontrado'
        });
      }
      return res.json({ success: true, data: car });
    } catch (error) {
      return res.status(500).json({ 
        success: false,
        error: 'Error al obtener el vehículo'
      });
    }
  }
  static async getUserCars (req, res) {
  const {userId} = req.params;
  const userIdInt = parseInt(userId, 10);

  // Validar que userId sea un número
  if (isNaN(userIdInt)) {
    return res.status(400).json({ message: 'Invalid user ID' });
  }

  try {
    const cars = await Car.findByUserId(userIdInt);

    if (cars.length === 0) {
      return res.status(402).json({
        message: 'No cars found for this user',
      });
    }

    res.status(200).json(cars);
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({
      message: 'Server error while fetching cars',
      error: error.message,
    });
  }
}
static async getPendingCars(req, res) {
    try {
      const cars = await Car.getPendingCar();
      return res.json(cars);
    } catch (error) {
       console.log(error)
      return res.status(500).json({ 
        success: false,
        error: 'Error al obtener los vehículos'
      });
    }
  }

  static async rejectCars (req, res) {
  const { carId } = req.params;
  const carIdInt = parseInt(carId, 10);

  // Validar que carId sea un número
  if (isNaN(carIdInt)) {
    return res.status(400).json({ 
      success: false,
      message: 'Invalid car ID' 
    });
  }

  try {
    const success = await Car.changeStateCards(carIdInt, 6);

    if (!success) {
      return res.status(404).json({
        success: false,
        message: 'Error updating car state',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Car state updated successfully'
    });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating car state',
      error: error.message,
    });
  }
}
  static async approveCars (req, res) {
    const { carId } = req.params;
  const carIdInt = parseInt(carId, 10);
console.log(req.params,carId)
  // Validar que carId sea un número
  if (isNaN(carIdInt)) {
    return res.status(400).json({ 
      success: false,
      message: 'Invalid car ID' 
    });
  }

  try {
    const success = await Car.changeStateCards(carIdInt, 2);

    if (!success) {
      return res.status(404).json({
        success: false,
        message: 'Error updating car state',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Car state updated successfully'
    });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating car state',
      error: error.message,
    });
  }
}   
  
}