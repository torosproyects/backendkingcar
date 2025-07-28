// models/verificationRequest.js
import { query } from '../config/database.js';
import { logger } from '../utils/logger.js';

/**
 * Crea una nueva solicitud de verificación de perfil.
 * @param {Object} verificationData - Los datos de la solicitud.
 * @param {string} verificationData.firstName - Nombre del usuario.
 * @param {string} verificationData.lastName - Apellido del usuario.
 * @param {string} verificationData.email - Email del usuario.
 * @param {string} verificationData.phone - Teléfono del usuario.
 * @param {string} verificationData.dateOfBirth - Fecha de nacimiento (formato YYYY-MM-DD).
 * @param {string} verificationData.documentType - Tipo de documento.
 * @param {string} verificationData.documentNumber - Número de documento (clave para usuario_roles).
 * @param {string} verificationData.documentPhotoUrl - URL de la imagen del documento en Cloudinary.
 * @param {string} verificationData.documentPhotoPublicId - Public ID de la imagen en Cloudinary.
 * @param {string} verificationData.address - Dirección del usuario.
 * @param {string} verificationData.city - Ciudad del usuario.
 * @param {string} verificationData.state - Estado del usuario.
 * @param {string} verificationData.zipCode - Código postal del usuario.
 * @param {string} verificationData.occupation - Ocupación del usuario.
 * @param {string} [verificationData.bio] - Biografía del usuario (opcional).
 * @param {Object} verificationData.selectedLocation - Ubicación seleccionada (JSON).
 * @param {number} verificationData.userId - ID del usuario que hace la solicitud.
 * @returns {Promise<{requestId: number, documentNumber: string}>} El ID de la solicitud y el documento.
 */
export const createVerificationRequest = async (verificationData) => {
  const {
    firstName,
    lastName,
    email,
    phone,
    dateOfBirth,
    documentType,
    documentNumber, // Este es el documento clave
    documentPhotoUrl,
    documentPhotoPublicId,
    address,
    city,
    state,
    zipCode,
    occupation,
    bio,
    selectedLocation, // Objeto completo
    userId,
  } = verificationData;

  const sql = `
    INSERT INTO usuario (
      documento, nombre, apellido, telefono, direccion, fecha_nacimiento, genero, avatar, pre_registro_id, fecha_registro
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
  `;

  const params = [
    documentNumber,
    firstName,
    lastName,
    phone,
    address,
    dateOfBirth,
    city,
    occupation,
    userId,
    ];

  try {
    const result = await query(sql, params);
    logger.info(`Solicitud de verificación creada para el usuario ID: ${userId}`);
    // Devolvemos también el documentNumber para usarlo en la asociación de roles
    return { requestId: result.insertId, documentNumber };
  } catch (error) {
    logger.error('Error al crear la solicitud de verificación:', error);
    throw error;
  }
};

/**
 * Asocia un rol solicitado con un documento en la tabla usuario_roles.
 * @param {string} documentNumber - El número de documento del usuario.
 * @param {number} roleId - El ID del rol solicitado (debe existir en la tabla roles).
 * @returns {Promise<void>}
 */
export const associateRequestedRole = async (documentNumber, roleId) => {
    // Asumimos que existe una tabla `roles` con `id` y `name`.
    // Podrías tener un mapeo de 'Taller'/'Usuario' a IDs de rol, o buscar el ID por nombre.
    // Ejemplo: 'Taller' -> 2, 'Usuario' -> 3 (esto depende de tu tabla `roles`)
    const sql = `INSERT INTO usuario_roles (usuario_documento, rol_id) VALUES (?, ?)`;
    const params = [documentNumber, roleId];

    try {
        await query(sql, params);
        logger.info(`Rol ${roleId} asociado al documento ${documentNumber}`);
    } catch (error) {
        // Puede fallar si el rol ya está asociado o si el documento/rol no existen
        logger.error(`Error al asociar rol ${roleId} al documento ${documentNumber}:`, error);
        // Dependiendo de tu lógica, podrías ignorar errores de duplicado o relanzar
        if (error.code !== 'ER_DUP_ENTRY') { // Ejemplo para MySQL
             throw error;
        } else {
            logger.warn(`La asociación rol ${roleId} - documento ${documentNumber} ya existe.`);
        }
    }
};

// Puedes agregar más funciones aquí si necesitas buscar, actualizar o eliminar solicitudes