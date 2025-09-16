import { logger } from '../utils/logger.js';

// Validaciones de tamaño
const MAX_PHOTO_SIZE = 5 * 1024 * 1024; // 5MB para foto
const MAX_PDF_SIZE = 10 * 1024 * 1024; // 10MB para PDFs
const MAX_TOTAL_FILES = 8; // Máximo 8 archivos

// Validar Base64 de imagen
export const validateBase64Image = (base64Data) => {
  try {
    if (!base64Data || typeof base64Data !== 'string') {
      return { valid: false, error: 'documentoIdentidad debe ser una cadena Base64 válida' };
    }

    // Verificar formato Base64
    if (!base64Data.startsWith('data:image/')) {
      return { valid: false, error: 'documentoIdentidad debe ser una imagen Base64 válida' };
    }

    const [header, data] = base64Data.split(',');
    if (!data) {
      return { valid: false, error: 'Formato Base64 inválido' };
    }

    // Verificar tamaño
    const buffer = Buffer.from(data, 'base64');
    if (buffer.length > MAX_PHOTO_SIZE) {
      return { valid: false, error: `Foto de documento es demasiado grande (máximo ${MAX_PHOTO_SIZE / (1024 * 1024)}MB)` };
    }

    // Verificar que sea JPEG válido
    if (!isValidJPEG(buffer)) {
      return { valid: false, error: 'La foto debe ser un JPEG válido' };
    }

    return { valid: true };
  } catch (error) {
    logger.error('Error validando Base64:', error);
    return { valid: false, error: 'Error al procesar la imagen Base64' };
  }
};

// Validar archivo PDF
export const validatePDF = (file) => {
  try {
    if (!file) {
      return { valid: false, error: 'Archivo no encontrado' };
    }

    // Verificar tipo MIME
    if (file.mimetype !== 'application/pdf') {
      return { valid: false, error: `Archivo ${file.fieldname} debe ser un PDF válido` };
    }

    // Verificar tamaño
    if (file.size > MAX_PDF_SIZE) {
      return { valid: false, error: `Archivo ${file.fieldname} es demasiado grande (máximo ${MAX_PDF_SIZE / (1024 * 1024)}MB)` };
    }

    // Verificar firma PDF
    if (!isValidPDF(file.buffer)) {
      return { valid: false, error: `Archivo ${file.fieldname} no es un PDF válido` };
    }

    return { valid: true };
  } catch (error) {
    logger.error('Error validando PDF:', error);
    return { valid: false, error: `Error al procesar archivo ${file.fieldname}` };
  }
};

// Validar datos específicos por tipo de cuenta
export const validateAccountTypeData = (accountType, data) => {
  const errors = [];

  switch (accountType) {
    case 'Particular':
      if (!data.particularData) {
        errors.push('particularData es requerido para cuentas Particulares');
      } else {
        const particularData = JSON.parse(data.particularData);
        if (!particularData.numeroReciboServicio) {
          errors.push('numeroReciboServicio es requerido para cuentas Particulares');
        }
      }
      break;

    case 'Autónomo':
      if (!data.autonomoData) {
        errors.push('autonomoData es requerido para cuentas Autónomas');
      } else {
        const autonomoData = JSON.parse(data.autonomoData);
        if (!autonomoData.altaAutonomo) {
          errors.push('altaAutonomo es requerido para cuentas Autónomas');
        }
        if (!autonomoData.reta) {
          errors.push('reta es requerido para cuentas Autónomas');
        }
      }
      break;

    case 'Empresa':
      if (!data.empresaData) {
        errors.push('empresaData es requerido para cuentas Empresa');
      } else {
        const empresaData = JSON.parse(data.empresaData);
        if (!empresaData.cif) {
          errors.push('cif es requerido para cuentas Empresa');
        }
        if (!empresaData.numeroEscrituraConstitucion) {
          errors.push('numeroEscrituraConstitucion es requerido para cuentas Empresa');
        }
      }
      break;

    default:
      errors.push('accountType debe ser: Particular, Autónomo o Empresa');
  }

  return errors;
};

// Validar archivos requeridos por tipo de cuenta
export const validateRequiredFiles = (accountType, files) => {
  const errors = [];
  const missingFiles = [];

  const requiredFiles = {
    'Particular': ['reciboServicio', 'certificadoBancario'],
    'Autónomo': ['altaAutonomo', 'reta', 'certificadoBancario'],
    'Empresa': ['escriturasConstitucion', 'iaeAno', 'tarjetaCif', 'certificadoTitularidadBancaria']
  };

  const filesForType = requiredFiles[accountType] || [];

  for (const fileType of filesForType) {
    if (!files[fileType] || files[fileType].length === 0) {
      missingFiles.push(fileType);
      errors.push(`Archivo requerido faltante: ${fileType}`);
    }
  }

  return { errors, missingFiles };
};

// Validar documento JSON
export const validateDocumento = (documentoJson) => {
  try {
    const documento = JSON.parse(documentoJson);
    
    if (!documento.tipo || !documento.numero) {
      return { valid: false, error: 'documento debe contener tipo y numero' };
    }

    const tiposValidos = ['DNI', 'NIE', 'PASAPORTE'];
    if (!tiposValidos.includes(documento.tipo)) {
      return { valid: false, error: 'documento.tipo debe ser: DNI, NIE o PASAPORTE' };
    }

    return { valid: true, documento };
  } catch (error) {
    return { valid: false, error: 'documento debe ser un JSON válido' };
  }
};

// Validar teléfono verificado
export const validatePhoneVerified = (phoneVerified) => {
  if (phoneVerified !== 'true') {
    return { valid: false, error: 'El teléfono debe estar verificado' };
  }
  return { valid: true };
};

// Validar total de archivos
export const validateTotalFiles = (files) => {
  const totalFiles = Object.values(files).reduce((total, fileArray) => {
    return total + (fileArray ? fileArray.length : 0);
  }, 0);

  if (totalFiles > MAX_TOTAL_FILES) {
    return { valid: false, error: `Máximo ${MAX_TOTAL_FILES} archivos permitidos` };
  }

  return { valid: true };
};

// Funciones auxiliares
const isValidJPEG = (buffer) => {
  return buffer[0] === 0xFF && buffer[1] === 0xD8;
};

const isValidPDF = (buffer) => {
  const header = buffer.toString('ascii', 0, 4);
  return header === '%PDF';
};

// Middleware de validación principal
export const validateVerificationSubmission = (req, res, next) => {
  const errors = [];
  const missingFiles = [];

  try {
    // Validar datos básicos
    const requiredFields = [
      'firstName', 'lastName', 'email', 'phone', 'phoneVerified',
      'fechaNacimiento', 'documento', 'direccion', 'codigoPostal',
      'pais', 'ciudad', 'estado_provincia', 'accountType', 'documentoIdentidad'
    ];

    for (const field of requiredFields) {
      if (!req.body[field]) {
        errors.push(`Campo requerido faltante: ${field}`);
      }
    }

    // Validar teléfono verificado
    const phoneValidation = validatePhoneVerified(req.body.phoneVerified);
    if (!phoneValidation.valid) {
      errors.push(phoneValidation.error);
    }

    // Validar documento JSON
    const documentoValidation = validateDocumento(req.body.documento);
    if (!documentoValidation.valid) {
      errors.push(documentoValidation.error);
    }
    
    // Debug: Log del documento parseado
    logger.info('Documento parseado:', documentoValidation);

    // Validar imagen Base64
    const imageValidation = validateBase64Image(req.body.documentoIdentidad);
    if (!imageValidation.valid) {
      errors.push(imageValidation.error);
    }

    // Validar datos específicos por tipo de cuenta
    const accountTypeErrors = validateAccountTypeData(req.body.accountType, req.body);
    errors.push(...accountTypeErrors);

    // Validar archivos requeridos
    const fileValidation = validateRequiredFiles(req.body.accountType, req.files);
    errors.push(...fileValidation.errors);
    missingFiles.push(...fileValidation.missingFiles);

    // Validar archivos PDF individuales
    if (req.files) {
      for (const [fieldName, fileArray] of Object.entries(req.files)) {
        if (fileArray && fileArray.length > 0) {
          const pdfValidation = validatePDF(fileArray[0]);
          if (!pdfValidation.valid) {
            errors.push(pdfValidation.error);
          }
        }
      }
    }

    // Validar total de archivos
    const totalFilesValidation = validateTotalFiles(req.files);
    if (!totalFilesValidation.valid) {
      errors.push(totalFilesValidation.error);
    }

    // Si hay errores, devolver respuesta de error
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Datos de verificación inválidos',
        errors,
        ...(missingFiles.length > 0 && { missingFiles })
      });
    }

    // Agregar datos validados al request
    req.validatedData = {
      ...req.body,
      documento: documentoValidation.documento,  // El documento parseado va al final para no ser sobrescrito
      accountType: req.body.accountType
    };

    next();
  } catch (error) {
    logger.error('Error en validación de verificación:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};


