// services/verificationService.js
import { createVerificationRequest, associateRequestedRole } from '../models/verificationURequest.js';
import { uploadImage } from './cloudinaryService.js'; // Asegúrate de la ruta correcta
import { logger } from '../utils/logger.js';

// Mapeo simple de nombres de rol a IDs. Deberías obtener esto de la BD o un config.
// Ajusta estos valores según tu tabla `roles`.
const ROLE_NAME_TO_ID = {
  'Taller': 2, // Ejemplo: ID 2 para Taller
  'Usuario': 3, // Ejemplo: ID 3 para Usuario
  // Agrega más si es necesario
};

/**
 * Procesa una solicitud de verificación de perfil.
 * @param {Object} verificationData - Los datos de la solicitud (incluyendo el buffer de la imagen).
 * @returns {Promise<Object>} El resultado de la operación.
 */
export const processVerificationRequest = async (verificationData) => {
  let documentPhotoUrl = null;
  let documentPhotoPublicId = null;
  let requestId = null;
  let documentNumberUsed = null;

  try {
    // 1. Subir la imagen del documento a Cloudinary
    if (verificationData.documentPhotoBuffer) {
      const uploadResult = await uploadImage(verificationData.documentPhotoBuffer, {
        folder: 'profile_verification_documents',
      });

      documentPhotoUrl = uploadResult.url;
      documentPhotoPublicId = uploadResult.publicId;
      logger.info(`Imagen de documento subida para usuario ${verificationData.userId}: ${documentPhotoPublicId}`);
    } else {
       throw new Error("El buffer de la imagen del documento es requerido.");
    }

    // 2. Preparar datos para guardar en la BD (incluyendo URLs de Cloudinary)
    const dataToSave = {
      ...verificationData,
      documentPhotoUrl,
      documentPhotoPublicId,
    };

    // 3. Guardar la solicitud en la base de datos
    const result = await createVerificationRequest(dataToSave);
    requestId = result.requestId;
    documentNumberUsed = result.documentNumber; // Obtenemos el documento usado
    logger.info(`Solicitud de verificación procesada exitosamente. ID: ${requestId}`);

    // --- Nueva parte: Asociar el rol solicitado ---
    const requestedRoleName = verificationData.requestedRole;
    const roleId = ROLE_NAME_TO_ID[requestedRoleName];

    if (roleId) {
        await associateRequestedRole(documentNumberUsed, roleId);
        logger.info(`Rol solicitado '${requestedRoleName}' (ID: ${roleId}) asociado al documento ${documentNumberUsed}.`);
    } else {
        logger.warn(`Nombre de rol solicitado '${requestedRoleName}' no encontrado en el mapeo ROLE_NAME_TO_ID.`);
        // Opcional: Lanzar un error si el rol no es válido
        // throw new Error(`Rol solicitado '${requestedRoleName}' no es válido.`);
    }
    // --- Fin de la nueva parte ---

    return {
      success: true,
      requestId,
      message: 'Solicitud de verificación enviada correctamente.'
    };

  } catch (error) {
    logger.error('Error al procesar la solicitud de verificación:', error);

     if (!documentPhotoPublicId) { 
        await deleteCloudinaryResources(uploadedPhotos); 
    }
     throw error; // Relanzar el error para que el controlador lo maneje
  }
};
