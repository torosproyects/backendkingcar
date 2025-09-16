import multer from 'multer';
import { logger } from '../utils/logger.js';

// Configuración de Multer para manejar múltiples archivos en memoria
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Solo se permiten imágenes'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 10 // Máximo 10 imágenes
  }
});
const verificationUpload = multer({
  storage, 
  fileFilter, 
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB, solo para el tamaño del archivo
    
  }
});

// Nueva configuración para verificación con múltiples archivos (PDFs + imagen)
const verificationSubmitUpload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    // Permitir imágenes Y PDFs
    if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten imágenes y archivos PDF'), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB por archivo
    files: 8 // Máximo 8 archivos
  }
});

export { upload, verificationUpload, verificationSubmitUpload };