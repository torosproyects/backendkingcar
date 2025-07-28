import { v2 as cloudinary } from 'cloudinary';
import { logger } from '../utils/logger.js';

// Configuración (mantén la tuya)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Versión para buffers (Multer)
export const uploadImage = async (imageBuffer, options = {}) => {
  try {
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        { 
          resource_type: 'auto',
          ...options 
        }, 
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      ).end(imageBuffer);
    });

    return {
      url: result.secure_url,
      publicId: result.public_id,
      format: result.format
    };
  } catch (error) {
    logger.error('Error subiendo imagen a Cloudinary:', error);
    throw error;
  }
};
export const deleteCloudinaryResources = async (resources) => {
  try {
    await cloudinary.api.delete_resources(
      resources.map(r => r.publicId),
      { type: 'upload', resource_type: 'image' }
    );
    console.log(`Rollback: Eliminadas ${resources.length} imágenes de Cloudinary`);
  } catch (error) {
    console.error('Error en rollback de Cloudinary:', error);
    // Puede fallar si las imágenes no existen
  }
};

// Versión para arrays (Multer o Base64)
export const uploadImages = async (images) => {
  try {
    const results = await Promise.all(
      images.map(async (image) => {
        // Caso 1: Ya es un buffer (viene de Multer)
        if (image.buffer) {
          return uploadImage(image.buffer, {
            resource_type: 'image',
            folder: 'car_photos',
            public_id: `car_${Date.now()}_${image.originalname.split('.')[0]}`
          });
        }
        // Caso 2: Base64 (viene de tu frontend original)
        else if (image.imageUrl) {
          const buffer = Buffer.from(image.imageUrl.split(',')[1], 'base64');
          return uploadImage(buffer);
        }
        throw new Error('Formato de imagen no soportado');
      })
    );

    return results.map((result, index) => ({
      ...result,
      templateId: images[index].templateId || `img_${index}`
    }));
  } catch (error) {
    logger.error('Error subiendo imágenes:', error);
    throw error;
  }
};