import VerificacionUsuario from '../models/VerificacionUsuario.js';
import ArchivosVerificacion from '../models/ArchivosVerificacion.js';
import User from '../models/User.js';
import { uploadImage, deleteCloudinaryResources } from '../service/cloudinaryService.js';
import { sendVerificationStatusEmail } from '../utils/emailService.js';
import { logger } from '../utils/logger.js';

// Configuración de cookies
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
  maxAge: 60 * 60 * 1000,
  path: '/'
};

// POST /api/verification/submit - Enviar solicitud de verificación
export const submitVerification = async (req, res) => {
  try {
    const userId = req.user.id; // ID desde cookies
    const { validatedData, files } = req;

    // Verificar si ya existe una verificación para este usuario
    const existingVerification = await VerificacionUsuario.existsByPreRegistroId(userId);
    if (existingVerification) {
      return res.status(409).json({
        success: false,
        message: 'Ya existe una solicitud de verificación para este usuario'
      });
    }

    // Procesar imagen de documento (Base64 → Cloudinary)
    const base64Data = validatedData.documentoIdentidad.split(',')[1];
    const imageBuffer = Buffer.from(base64Data, 'base64');

    const cloudinaryResult = await uploadImage(imageBuffer, {
      folder: 'verificaciones/documentos_identidad',
      public_id: `doc_${Date.now()}`
    });

    // Preparar datos para la verificación
    const verificationData = {
      pre_registro_id: userId,
      first_name: validatedData.firstName,
      last_name: validatedData.lastName,
      email: validatedData.email,
      phone: validatedData.phone,
      fecha_nacimiento: validatedData.fechaNacimiento,
      documento_tipo: validatedData.documento.tipo,
      documento_numero: validatedData.documento.numero,
      documento_identidad_url: cloudinaryResult.url,
      documento_identidad_public_id: cloudinaryResult.publicId,
      direccion: validatedData.direccion,
      codigo_postal: validatedData.codigoPostal,
      pais: validatedData.pais,
      ciudad: validatedData.ciudad,
      estado_provincia: validatedData.estado_provincia,
      account_type_id: getAccountTypeId(validatedData.accountType),
      particular_data: validatedData.particularData || null,
      autonomo_data: validatedData.autonomoData || null,
      empresa_data: validatedData.empresaData || null
    };

    // Crear verificación en la base de datos
    const verificationId = await VerificacionUsuario.create(verificationData);

    // Procesar archivos PDF
    const archivosData = [];
    const documents = {};

    if (files) {
      for (const [fieldName, fileArray] of Object.entries(files)) {
        if (fileArray && fileArray.length > 0) {
          const file = fileArray[0];
          
          archivosData.push({
            verificacion_id: verificationId,
            tipo_archivo: fieldName,
            archivo_data: file.buffer,
            archivo_nombre_original: file.originalname,
            archivo_tamaño: file.size,
            archivo_tipo_mime: file.mimetype,
            archivo_extension: '.pdf'
          });

          // Agregar a documentos para respuesta
          documents[fieldName] = `doc_${verificationId}_${fieldName}`;
        }
      }
    }

    // Crear archivos en la base de datos
    if (archivosData.length > 0) {
      await ArchivosVerificacion.createMultiple(archivosData);
    }

    // Agregar documento de identidad a la respuesta
    documents.documentoIdentidad = cloudinaryResult.publicId;

    logger.info(`Verificación ${verificationId} creada exitosamente para usuario ${userId}`);

    res.status(200).json({
        success: true,
      message: 'Solicitud de verificación enviada exitosamente',
      verificationId,
      documents
      });

    } catch (error) {
    logger.error('Error en submitVerification:', error);
    
    // Si hay error después de subir a Cloudinary, intentar limpiar
    if (req.cloudinaryResult) {
      try {
        await deleteCloudinaryResources([req.cloudinaryResult]);
      } catch (cleanupError) {
        logger.error('Error limpiando Cloudinary:', cleanupError);
      }
    }

    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// GET /api/verification/status/:id - Obtener estado de verificación
export const getVerificationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const verification = await VerificacionUsuario.getById(id);
    
    if (!verification) {
      return res.status(404).json({
        success: false,
        message: 'Verificación no encontrada'
      });
    }

    // Verificar que el usuario solo pueda ver su propia verificación
    if (verification.pre_registro_id !== parseInt(userId)) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para ver esta verificación'
      });
    }

    // Obtener archivos asociados
    const archivos = await ArchivosVerificacion.getByVerificacionId(id);

    res.status(200).json({
      success: true,
      verification: {
        id: verification.pre_registro_id,
        estado: verification.estado,
        fecha_solicitud: verification.fecha_solicitud,
        fecha_revision: verification.fecha_revision,
        notas_revision: verification.notas_revision,
        account_type_name: verification.account_type_name,
        archivos: archivos.map(archivo => ({
          tipo: archivo.tipo_archivo,
          nombre: archivo.archivo_nombre_original,
          tamaño: archivo.archivo_tamaño,
          fecha_subida: archivo.fecha_subida
        }))
      }
    });

  } catch (error) {
    logger.error('Error en getVerificationStatus:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// GET /api/verification/my-verification - Obtener mi verificación
export const getMyVerification = async (req, res) => {
  try {
    const userId = req.user.id;

    const verification = await VerificacionUsuario.getByPreRegistroId(userId);
    
    if (!verification) {
      return res.status(404).json({
        success: false,
        message: 'No tienes ninguna verificación pendiente'
      });
    }

    // Obtener archivos asociados
    const archivos = await ArchivosVerificacion.getByVerificacionId(verification.pre_registro_id);

    res.status(200).json({
        success: true,
      verification: {
        id: verification.pre_registro_id,
        estado: verification.estado,
        fecha_solicitud: verification.fecha_solicitud,
        fecha_revision: verification.fecha_revision,
        notas_revision: verification.notas_revision,
        account_type_name: verification.account_type_name,
        archivos: archivos.map(archivo => ({
          tipo: archivo.tipo_archivo,
          nombre: archivo.archivo_nombre_original,
          tamaño: archivo.archivo_tamaño,
          fecha_subida: archivo.fecha_subida
        }))
      }
    });

  } catch (error) {
    logger.error('Error en getMyVerification:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// GET /api/verification/download/:archivoId - Descargar archivo
export const downloadArchivo = async (req, res) => {
  try {
    const { archivoId } = req.params;
    const userId = req.user.id;

    const archivo = await ArchivosVerificacion.getArchivoById(archivoId);
    
    if (!archivo) {
      return res.status(404).json({
        success: false,
        message: 'Archivo no encontrado'
      });
    }

    // Verificar que el usuario solo pueda descargar sus propios archivos
    if (archivo.pre_registro_id !== parseInt(userId)) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para descargar este archivo'
      });
    }

    // Configurar headers para descarga
    res.setHeader('Content-Type', archivo.archivo_tipo_mime);
    res.setHeader('Content-Disposition', `attachment; filename="${archivo.archivo_nombre_original}"`);
    res.setHeader('Content-Length', archivo.archivo_tamaño);

    // Enviar archivo
    res.send(archivo.archivo_data);

    } catch (error) {
    logger.error('Error en downloadArchivo:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// GET /api/verification/pending - Obtener todas las verificaciones pendientes (Solo Admin)
export const getPendingVerifications = async (req, res) => {
  try {
    const { 
      estado = 'pendiente', 
      account_type_id, 
      limit = 20, 
      offset = 0,
      sort_by = 'fecha_solicitud',
      sort_order = 'DESC'
    } = req.query;

    // Validar parámetros de ordenamiento
    const allowedSortFields = ['fecha_solicitud', 'first_name', 'last_name', 'estado'];
    const sortField = allowedSortFields.includes(sort_by) ? sort_by : 'fecha_solicitud';
    const sortDirection = sort_order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    // Validar límites
    const limitNum = Math.min(parseInt(limit) || 20, 100); // Máximo 100
    const offsetNum = Math.max(parseInt(offset) || 0, 0);

    const filters = {
      estado,
      account_type_id: account_type_id ? parseInt(account_type_id) : null,
      limit: limitNum,
      offset: offsetNum
    };

    // Obtener verificaciones con información completa
    const verificaciones = await VerificacionUsuario.getAll(filters);

    // Obtener estadísticas
    const stats = await VerificacionUsuario.getStats();

    // Obtener archivos para cada verificación
    const verificacionesConArchivos = await Promise.all(
      verificaciones.map(async (verificacion) => {
        const archivos = await ArchivosVerificacion.getByVerificacionId(verificacion.pre_registro_id);
        return {
          ...verificacion,
          archivos: archivos.map(archivo => ({
            id: archivo.id,
            tipo: archivo.tipo_archivo,
            nombre: archivo.archivo_nombre_original,
            tamaño: archivo.archivo_tamaño,
            fecha_subida: archivo.fecha_subida
          }))
        };
      })
    );

    // Ordenar resultados
    verificacionesConArchivos.sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      
      if (sortDirection === 'ASC') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    res.status(200).json({
      success: true,
      data: {
        verificaciones: verificacionesConArchivos,
        pagination: {
          limit: limitNum,
          offset: offsetNum,
          total: verificaciones.length,
          hasMore: verificaciones.length === limitNum
        },
        filters: {
          estado,
          account_type_id,
          sort_by: sortField,
          sort_order: sortDirection
        },
        stats: {
          total: stats.total,
          pendientes: stats.pendientes,
          en_revision: stats.en_revision,
          aprobadas: stats.aprobadas,
          rechazadas: stats.rechazadas,
          por_tipo: {
            particulares: stats.particulares,
            autonomos: stats.autonomos,
            empresas: stats.empresas
          }
        }
      }
    });

  } catch (error) {
    logger.error('Error en getPendingVerifications:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// GET /api/verification/:id - Obtener una verificación específica con todos sus documentos (Solo Admin)
export const getVerificationById = async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar que la verificación existe
    const verificacion = await VerificacionUsuario.getById(id);
    if (!verificacion) {
      return res.status(404).json({
        success: false,
        message: 'Verificación no encontrada'
      });
    }

    // Obtener todos los archivos de la verificación
    const archivos = await ArchivosVerificacion.getByVerificacionId(id);

    // Obtener información adicional del usuario
    const usuarioInfo = await VerificacionUsuario.getUserInfo(id);

    // Estructurar respuesta con todos los documentos
    const verificacionCompleta = {
      ...verificacion,
      usuario_info: usuarioInfo,
      documentos: {
        // Foto de documento (Cloudinary)
        documento_identidad: {
          tipo: 'foto_documento',
          url: verificacion.documento_identidad_url,
          public_id: verificacion.documento_identidad_public_id,
          formato: 'imagen',
          almacenamiento: 'cloudinary'
        },
        // Archivos PDF (Base de datos)
        archivos_pdf: archivos.map(archivo => ({
          id: archivo.id,
          tipo: archivo.tipo_archivo,
          nombre_original: archivo.archivo_nombre_original,
          tamaño: archivo.archivo_tamaño,
          fecha_subida: archivo.fecha_subida,
          formato: 'pdf',
          almacenamiento: 'database',
          descarga_url: `/api/verification/download/${archivo.id}`
        }))
      },
      resumen_documentos: {
        total_archivos: archivos.length + 1, // +1 por la foto
        archivos_pdf: archivos.length,
        foto_documento: 1,
        tipos_archivos: [...new Set(archivos.map(a => a.tipo_archivo))],
        tamaño_total_pdf: archivos.reduce((total, archivo) => total + archivo.archivo_tamaño, 0)
      }
    };

    res.status(200).json({
      success: true,
      data: verificacionCompleta
    });

  } catch (error) {
    logger.error('Error en getVerificationById:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// PUT /api/verification/:id/status - Actualizar estado de verificación (Solo Admin)
export const updateVerificationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado, notas_revision } = req.body;

    // Validar estado
    const estadosValidos = ['pendiente', 'en_revision', 'aprobada', 'rechazada'];
    if (!estadosValidos.includes(estado)) {
      return res.status(400).json({
        success: false,
        message: 'Estado inválido',
        errors: [`Estado debe ser uno de: ${estadosValidos.join(', ')}`]
      });
    }

    // Verificar que la verificación existe
    const verificacion = await VerificacionUsuario.getById(id);
    if (!verificacion) {
      return res.status(404).json({
        success: false,
        message: 'Verificación no encontrada'
      });
    }

    // Actualizar estado
    const updated = await VerificacionUsuario.updateStatus(id, estado, notas_revision);
    
    if (!updated) {
      return res.status(400).json({
        success: false,
        message: 'No se pudo actualizar el estado de la verificación'
      });
    }

    // Obtener verificación actualizada
    const verificacionActualizada = await VerificacionUsuario.getById(id);
    const archivos = await ArchivosVerificacion.getByVerificacionId(id);

    logger.info(`Estado de verificación ${id} actualizado a: ${estado}`);

    // ===== ENVÍO DE CORREO AUTOMÁTICO =====
    try {
      // Obtener datos del usuario desde pre_registro
      const usuarioData = await User.findById(verificacion.pre_registro_id);
      
      if (usuarioData && usuarioData.email) {
        // Enviar correo de notificación
        await sendVerificationStatusEmail(
          usuarioData.email,
          usuarioData.name,
          estado,
          notas_revision
        );
        
        logger.info(`Correo de notificación enviado a ${usuarioData.email} para verificación ${id}`);
      } else {
        logger.warn(`No se pudo obtener datos del usuario para verificación ${id}`);
      }
    } catch (emailError) {
      // Si falla el correo, no fallar la operación principal
      logger.error(`Error al enviar correo de notificación para verificación ${id}:`, emailError);
    }

    res.status(200).json({
      success: true,
      message: 'Estado de verificación actualizado exitosamente',
      verification: {
        ...verificacionActualizada,
        archivos: archivos.map(archivo => ({
          id: archivo.id,
          tipo: archivo.tipo_archivo,
          nombre: archivo.archivo_nombre_original,
          tamaño: archivo.archivo_tamaño,
          fecha_subida: archivo.fecha_subida
        }))
      }
    });

  } catch (error) {
    logger.error('Error en updateVerificationStatus:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Función auxiliar para obtener ID del tipo de cuenta
const getAccountTypeId = (accountType) => {
  const typeMapping = {
    'Particular': 7,
    'Autónomo': 5,
    'Empresa': 6
  };
  return typeMapping[accountType] || 7;
};

// Exportación por defecto
export default {
  submitVerification,
  getVerificationStatus,
  getMyVerification,
  downloadArchivo,
  getPendingVerifications,
  getVerificationById,
  updateVerificationStatus
};