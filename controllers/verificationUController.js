// controllers/verificationController.js
import { processVerificationRequest } from '../service/verificationUService.js';
import { logger } from '../utils/logger.js';

/**
 * Maneja la solicitud POST para crear una nueva verificación de perfil.
 * @param {import('express').Request} req - El objeto de solicitud Express.
 * @param {import('express').Response} res - El objeto de respuesta Express.
 */
export const createVerificationRequestCtrl = async (req, res) => {
  try {
       // Validación básica del lado del servidor
    if (!req.body.firstName || !req.body.email || !req.body.phone || !req.body.documentNumber || !req.body.requestedRole) {
         logger.warn('Datos incompletos en la solicitud de verificación.');
         return res.status(400).json({ message: 'Faltan datos requeridos (nombre, email, teléfono, documento, rol).' });
    }

    // Asumiendo que `req.user` está poblado por el middleware de autenticación
    if (!req.user || !req.user.id) {
         logger.warn('Intento de verificación sin autenticación.');
         return res.status(401).json({ message: 'Usuario no autenticado.' });
    }

    // Obtener el buffer de la imagen del documento desde Multer
    let documentPhotoBuffer = null;
    if (req.files && req.files.length > 0) {
        const docFile = req.files.find(f => f.fieldname === 'documentPhoto');
        if (docFile) {
            documentPhotoBuffer = docFile.buffer;
        } else {
             logger.warn('Campo documentPhoto no encontrado en los archivos subidos.');
             return res.status(400).json({ message: 'Archivo de documento no encontrado.' });
        }
    } else if (req.file) {
         if (req.file.fieldname === 'documentPhoto') {
              documentPhotoBuffer = req.file.buffer;
         } else {
              logger.warn('Campo documentPhoto no encontrado en req.file.');
              return res.status(400).json({ message: 'Archivo de documento no encontrado.' });
         }
    } else {
        logger.warn('No se encontró ningún archivo en la solicitud.');
        return res.status(400).json({ message: 'La imagen del documento es requerida.' });
    }

    // Manejo de la ubicación seleccionada si viene como JSON string
    let selectedLocationParsed = null;
    try {
        if (typeof req.body.selectedLocation === 'string') {
            selectedLocationParsed = JSON.parse(req.body.selectedLocation);
        } else if (typeof req.body.selectedLocation === 'object') {
             selectedLocationParsed = req.body.selectedLocation;
        }
    } catch (parseError) {
        logger.warn('Error al parsear selectedLocation:', parseError);
    }

    // Preparar los datos para el servicio
    const verificationData = {
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email,
      phone: req.body.phone,
      dateOfBirth: req.body.dateOfBirth,
      documentType: req.body.documentType,
      documentNumber: req.body.documentNumber,
      documentPhotoBuffer: documentPhotoBuffer,
      address: req.body.address,
      city: req.body.city,
      state: req.body.state,
      zipCode: req.body.zipCode,
      occupation: req.body.occupation,
      bio: req.body.bio,
      requestedRole: req.body.requestedRole, // Se pasa al servicio, no al modelo directamente
      selectedLocation: selectedLocationParsed,
      userId: req.user.id,
    };

    // Llamar al servicio para procesar la solicitud
    const result = await processVerificationRequest(verificationData);

    res.status(201).json({
      message: result.message,
      requestId: result.requestId,
    });

  } catch (error) {
    logger.error('Error en el controlador de verificación:', error);
    res.status(500).json({ message: 'Error interno del servidor al procesar la solicitud.' });
  }
};
