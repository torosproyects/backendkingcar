# API de Verificación de Usuarios

## Endpoints Disponibles

### POST /api/verification/submit
Envía una solicitud de verificación de usuario con documentos.

**Headers:**
- `Content-Type: multipart/form-data`
- `Cookie: token=<jwt_token>`

**Body (FormData):**
```javascript
{
  // Información básica
  firstName: "Juan",
  lastName: "Pérez García", 
  email: "juan.perez@email.com",
  phone: "+34612345678",
  phoneVerified: "true",
  fechaNacimiento: "1990-05-15",
  
  // Documento de identidad
  documento: '{"tipo":"DNI","numero":"12345678A"}',
  documentoIdentidad: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ...",
  
  // Dirección
  direccion: "Calle Mayor 123, 4º B",
  codigoPostal: "28001",
  pais: "ES",
  ciudad: "Madrid",
  estado_provincia: "Madrid",
  
  // Tipo de cuenta
  accountType: "Particular", // "Particular" | "Autónomo" | "Empresa"
  
  // Datos específicos según tipo (JSON strings)
  particularData: '{"numeroReciboServicio":"2024-001234"}',
  autonomoData: '{"altaAutonomo":"Alta 15/03/2024","reta":"RETA-2024-001"}',
  empresaData: '{"cif":"B12345678","numeroEscrituraConstitucion":"Escritura 1234"}',
  
  // Archivos PDF (según tipo de cuenta)
  reciboServicio: [File], // Solo para "Particular"
  certificadoBancario: [File], // Para "Particular" y "Autónomo"
  altaAutonomo: [File], // Solo para "Autónomo"
  reta: [File], // Solo para "Autónomo"
  escriturasConstitucion: [File], // Solo para "Empresa"
  iaeAno: [File], // Solo para "Empresa"
  tarjetaCif: [File], // Solo para "Empresa"
  certificadoTitularidadBancaria: [File] // Solo para "Empresa"
}
```

**Respuestas:**

✅ **Éxito (200):**
```json
{
  "success": true,
  "message": "Solicitud de verificación enviada exitosamente",
  "verificationId": 12345,
  "documents": {
    "documentoIdentidad": "doc_123",
    "reciboServicio": "doc_124",
    "certificadoBancario": "doc_125"
  }
}
```

❌ **Error de Validación (400):**
```json
{
  "success": false,
  "message": "Datos de verificación inválidos",
  "errors": [
    "El teléfono debe estar verificado",
    "Archivo reciboServicio es demasiado grande (máximo 10MB)",
    "Archivos requeridos faltantes: ['certificadoBancario']"
  ],
  "missingFiles": ["certificadoBancario"]
}
```

❌ **Error de Servidor (500):**
```json
{
  "success": false,
  "message": "Error interno del servidor"
}
```

### GET /api/verification/my-verification
Obtiene la verificación del usuario autenticado.

**Headers:**
- `Cookie: token=<jwt_token>`

**Respuestas:**

✅ **Éxito (200):**
```json
{
  "success": true,
  "verification": {
    "id": 12345,
    "estado": "pendiente",
    "fecha_solicitud": "2024-01-15T10:30:00.000Z",
    "fecha_revision": null,
    "notas_revision": null,
    "account_type_name": "Particular",
    "archivos": [
      {
        "tipo": "reciboServicio",
        "nombre": "recibo_enero_2024.pdf",
        "tamaño": 2048576,
        "fecha_subida": "2024-01-15T10:30:00.000Z"
      }
    ]
  }
}
```

❌ **No encontrado (404):**
```json
{
  "success": false,
  "message": "No tienes ninguna verificación pendiente"
}
```

### GET /api/verification/status/:id
Obtiene el estado de una verificación específica.

**Headers:**
- `Cookie: token=<jwt_token>`

**Parámetros:**
- `id`: ID de la verificación

**Respuestas:**

✅ **Éxito (200):**
```json
{
  "success": true,
  "verification": {
    "id": 12345,
    "estado": "en_revision",
    "fecha_solicitud": "2024-01-15T10:30:00.000Z",
    "fecha_revision": "2024-01-16T09:15:00.000Z",
    "notas_revision": "Documentos en revisión",
    "account_type_name": "Particular",
    "archivos": [...]
  }
}
```

❌ **No encontrado (404):**
```json
{
  "success": false,
  "message": "Verificación no encontrada"
}
```

❌ **Sin permisos (403):**
```json
{
  "success": false,
  "message": "No tienes permisos para ver esta verificación"
}
```

### GET /api/verification/download/:archivoId
Descarga un archivo de verificación.

**Headers:**
- `Cookie: token=<jwt_token>`

**Parámetros:**
- `archivoId`: ID del archivo

**Respuesta:**
- Archivo PDF descargable

## Validaciones

### Tamaños Máximos
- **Foto de documento**: 5MB
- **Archivos PDF**: 10MB cada uno
- **Total de archivos**: máximo 8

### Tipos de Archivo
- **Foto**: JPEG válido (Base64)
- **PDFs**: application/pdf con firma válida (%PDF)

### Archivos Requeridos por Tipo

#### Particular
- ✅ documentoIdentidad (foto)
- ✅ reciboServicio (PDF)
- ✅ certificadoBancario (PDF)

#### Autónomo
- ✅ documentoIdentidad (foto)
- ✅ altaAutonomo (PDF)
- ✅ reta (PDF)
- ✅ certificadoBancario (PDF)

#### Empresa
- ✅ documentoIdentidad (foto)
- ✅ escriturasConstitucion (PDF)
- ✅ iaeAno (PDF)
- ✅ tarjetaCif (PDF)
- ✅ certificadoTitularidadBancaria (PDF)

## Estados de Verificación

- `pendiente`: Solicitud enviada, esperando revisión
- `en_revision`: Documentos siendo revisados
- `aprobada`: Verificación aprobada
- `rechazada`: Verificación rechazada

## Base de Datos

### Tabla `usuariosx`
Almacena la información de verificación del usuario.
- **Primary Key**: `pre_registro_id` (FK a `pre_registro.id`)
- **Constraint UNIQUE**: `documento_tipo + documento_numero` (evita duplicados de DNI/NIE/Pasaporte)

### Tabla `archivos_verificacion`
Almacena los archivos PDF en formato LONGBLOB.
- **FK**: `verificacion_id` → `usuariosx.pre_registro_id`

### Almacenamiento
- **Foto de documento**: Cloudinary
- **Archivos PDF**: Base de datos (LONGBLOB)

### Relaciones
- `usuariosx.pre_registro_id` = `pre_registro.id` (mismo ID en cookies JWT)
- `archivos_verificacion.verificacion_id` = `usuariosx.pre_registro_id`


