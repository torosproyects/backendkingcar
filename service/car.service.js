import { CarModel } from '../models/car.model.js';
import { uploadImages, deleteCloudinaryResources } from './cloudinaryService.js';

export class CarService {
  static async createCar({ carData, vehicleData, photos, userId }) {
    let uploadedPhotos = [];
    try {
    // 1. Subir imágenes a Cloudinary
    uploadedPhotos = await uploadImages(photos.map(photo => ({
         buffer: photo.buffer, // Multer
         originalname: photo.originalname,
         templateId: photo.templateId // Opcional
      })));
    
    const carId = await CarModel.create({
      ...carData,
      userId,
      ...vehicleData
    });

    // 3. Asociar las imágenes al vehículo
    await CarModel.addImages(
      carId,
      uploadedPhotos.map((photo, index) => ({
        ...photo,
        templateId: photos[index].templateId,
        isMain: index === 0 // La primera imagen como principal
      }))
    );

    return carId;
    } catch (error) {
      // ¡Hacer rollback si hay imágenes subidas!
      if (uploadedPhotos.length > 0) {
        await deleteCloudinaryResources(uploadedPhotos);
      }
      throw error; // Re-lanzar para manejo en el controlador
    }
  }

  static async getCarByPlate(plate) {
    return await CarModel.findByPlate(plate);
  }
}