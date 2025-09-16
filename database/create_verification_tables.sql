-- Crear tabla usuariosx para verificaciones de usuarios
CREATE TABLE usuariosx (
  -- Claves
  pre_registro_id BIGINT PRIMARY KEY,
  
  -- Información básica
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  fecha_nacimiento DATE NOT NULL,
  
  -- Documento de identidad (Cloudinary)
  documento_tipo VARCHAR(10) NOT NULL, -- "DNI", "NIE", "PASAPORTE"
  documento_numero VARCHAR(20) NOT NULL,
  documento_identidad_url VARCHAR(500), -- URL de Cloudinary
  documento_identidad_public_id VARCHAR(100), -- Public ID de Cloudinary
  
  -- Dirección
  direccion TEXT NOT NULL,
  codigo_postal VARCHAR(10) NOT NULL,
  pais VARCHAR(3) NOT NULL, -- Código ISO
  ciudad VARCHAR(100) NOT NULL,
  estado_provincia VARCHAR(100) NOT NULL,
  
  -- Tipo de cuenta (FK a tabla roles)
  account_type_id INT NOT NULL, -- FK a tabla roles (7=Particular, 5=Autónomo, 6=Empresa)
  
  -- Datos específicos por tipo (JSON)
  particular_data JSON NULL,
  autonomo_data JSON NULL,
  empresa_data JSON NULL,
  
  -- Estado de verificación
  estado ENUM('pendiente', 'en_revision', 'aprobada', 'rechazada') DEFAULT 'pendiente',
  fecha_solicitud DATETIME DEFAULT CURRENT_TIMESTAMP,
  fecha_revision DATETIME NULL,
  notas_revision TEXT NULL,
  
  -- Auditoría
  fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Relaciones
  FOREIGN KEY (pre_registro_id) REFERENCES pre_registro(id) ON DELETE CASCADE,
  FOREIGN KEY (account_type_id) REFERENCES roles(id),
  
  -- Constraints
  UNIQUE KEY unique_documento (documento_tipo, documento_numero),
  
  -- Índices
  INDEX idx_estado (estado),
  INDEX idx_account_type_id (account_type_id),
  INDEX idx_fecha_solicitud (fecha_solicitud)
);

-- Crear tabla archivos_verificacion para PDFs
CREATE TABLE archivos_verificacion (
  -- Claves
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  verificacion_id BIGINT NOT NULL,
  
  -- Información del archivo (solo PDFs)
  tipo_archivo ENUM(
    'reciboServicio',
    'certificadoBancario', 
    'altaAutonomo',
    'reta',
    'escriturasConstitucion',
    'iaeAno',
    'tarjetaCif',
    'certificadoTitularidadBancaria'
  ) NOT NULL,
  
  -- Almacenamiento en BD (solo PDFs)
  archivo_data LONGBLOB NOT NULL, -- PDF completo en BD
  archivo_nombre_original VARCHAR(255) NOT NULL,
  archivo_tamaño BIGINT NOT NULL, -- En bytes
  archivo_tipo_mime VARCHAR(100) NOT NULL, -- "application/pdf"
  archivo_extension VARCHAR(10) NOT NULL, -- ".pdf"
  
  -- Auditoría
  fecha_subida DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  -- Relaciones
  FOREIGN KEY (verificacion_id) REFERENCES usuariosx(pre_registro_id) ON DELETE CASCADE,
  
  -- Índices
  INDEX idx_verificacion_id (verificacion_id),
  INDEX idx_tipo_archivo (tipo_archivo),
  UNIQUE KEY unique_verificacion_tipo (verificacion_id, tipo_archivo)
);


