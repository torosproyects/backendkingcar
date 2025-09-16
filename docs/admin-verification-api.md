# API de Administración de Verificaciones

## Endpoints de Administrador

### GET /api/verification/pending
Obtiene todas las verificaciones pendientes de revisión (solo para administradores).

**Headers:**
- `Cookie: token=<jwt_token>` (usuario debe tener rol 'Administrador')

**Query Parameters:**
```javascript
{
  estado: 'pendiente',           // Estado a filtrar: 'pendiente', 'en_revision', 'aprobada', 'rechazada'
  account_type_id: 7,            // Tipo de cuenta: 7=Particular, 5=Autónomo, 6=Empresa
  limit: 20,                     // Número de resultados por página (máximo 100)
  offset: 0,                     // Número de resultados a saltar (para paginación)
  sort_by: 'fecha_solicitud',    // Campo para ordenar: 'fecha_solicitud', 'first_name', 'last_name', 'estado'
  sort_order: 'DESC'             // Orden: 'ASC' o 'DESC'
}
```

**Ejemplos de uso:**

#### Obtener todas las verificaciones pendientes
```javascript
GET /api/verification/pending
```

#### Obtener solo verificaciones de empresas
```javascript
GET /api/verification/pending?account_type_id=6
```

#### Obtener verificaciones en revisión, ordenadas por nombre
```javascript
GET /api/verification/pending?estado=en_revision&sort_by=first_name&sort_order=ASC
```

#### Paginación (página 2, 10 resultados por página)
```javascript
GET /api/verification/pending?limit=10&offset=10
```

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "data": {
    "verificaciones": [
      {
        "id": 123,
        "pre_registro_id": 456,
        "first_name": "Juan",
        "last_name": "Pérez García",
        "email": "juan.perez@email.com",
        "phone": "+34612345678",
        "fecha_nacimiento": "1990-05-15",
        "documento_tipo": "DNI",
        "documento_numero": "12345678A",
        "documento_identidad_url": "https://res.cloudinary.com/...",
        "documento_identidad_public_id": "doc_1234567890",
        "direccion": "Calle Mayor 123, 4º B",
        "codigo_postal": "28001",
        "pais": "ES",
        "ciudad": "Madrid",
        "estado_provincia": "Madrid",
        "account_type_id": 7,
        "account_type_name": "Particular",
        "particular_data": "{\"numeroReciboServicio\":\"2024-001234\"}",
        "autonomo_data": null,
        "empresa_data": null,
        "estado": "pendiente",
        "fecha_solicitud": "2024-01-15T10:30:00.000Z",
        "fecha_revision": null,
        "notas_revision": null,
        "fecha_creacion": "2024-01-15T10:30:00.000Z",
        "fecha_actualizacion": "2024-01-15T10:30:00.000Z",
        "pre_registro_name": "Juan Pérez",
        "pre_registro_email": "juan.perez@email.com",
        "archivos": [
          {
            "id": 789,
            "tipo": "reciboServicio",
            "nombre": "recibo_enero_2024.pdf",
            "tamaño": 2048576,
            "fecha_subida": "2024-01-15T10:30:00.000Z"
          },
          {
            "id": 790,
            "tipo": "certificadoBancario",
            "nombre": "certificado_bancario.pdf",
            "tamaño": 1536000,
            "fecha_subida": "2024-01-15T10:30:00.000Z"
          }
        ]
      }
    ],
    "pagination": {
      "limit": 20,
      "offset": 0,
      "total": 1,
      "hasMore": false
    },
    "filters": {
      "estado": "pendiente",
      "account_type_id": null,
      "sort_by": "fecha_solicitud",
      "sort_order": "DESC"
    },
    "stats": {
      "total": 15,
      "pendientes": 8,
      "en_revision": 3,
      "aprobadas": 3,
      "rechazadas": 1,
      "por_tipo": {
        "particulares": 10,
        "autonomos": 3,
        "empresas": 2
      }
    }
  }
}
```

**Respuesta de error (403):**
```json
{
  "success": false,
  "error": "Acceso denegado - No tienes permisos de administrador"
}
```

### GET /api/verification/:id
Obtiene una verificación específica con todos sus documentos y detalles completos (solo para administradores).

**Headers:**
- `Cookie: token=<jwt_token>` (usuario debe tener rol 'Administrador')

**Parámetros de URL:**
- `id`: ID de la verificación a consultar

**Ejemplo de uso:**
```javascript
GET /api/verification/123
```

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "data": {
    "id": 123,
    "pre_registro_id": 456,
    "first_name": "Juan",
    "last_name": "Pérez García",
    "email": "juan.perez@email.com",
    "phone": "+34612345678",
    "fecha_nacimiento": "1990-05-15",
    "documento_tipo": "DNI",
    "documento_numero": "12345678A",
    "documento_identidad_url": "https://res.cloudinary.com/...",
    "documento_identidad_public_id": "doc_1234567890",
    "direccion": "Calle Mayor 123, 4º B",
    "codigo_postal": "28001",
    "pais": "ES",
    "ciudad": "Madrid",
        "estado_provincia": "Madrid",
        "account_type_id": 7,
    "account_type_name": "Particular",
    "particular_data": "{\"numeroReciboServicio\":\"2024-001234\"}",
    "autonomo_data": null,
    "empresa_data": null,
    "estado": "pendiente",
    "fecha_solicitud": "2024-01-15T10:30:00.000Z",
    "fecha_revision": null,
    "notas_revision": null,
    "fecha_creacion": "2024-01-15T10:30:00.000Z",
    "fecha_actualizacion": "2024-01-15T10:30:00.000Z",
    "pre_registro_name": "Juan Pérez",
    "pre_registro_email": "juan.perez@email.com",
    "usuario_info": {
      "pre_registro_id": 456,
      "name": "Juan Pérez",
      "email": "juan.perez@email.com",
      "fecha_registro": "2024-01-10T08:00:00.000Z"
    },
    "documentos": {
      "documento_identidad": {
        "tipo": "foto_documento",
        "url": "https://res.cloudinary.com/...",
        "public_id": "doc_1234567890",
        "formato": "imagen",
        "almacenamiento": "cloudinary"
      },
      "archivos_pdf": [
        {
          "id": 789,
          "tipo": "reciboServicio",
          "nombre_original": "recibo_enero_2024.pdf",
          "tamaño": 2048576,
          "fecha_subida": "2024-01-15T10:30:00.000Z",
          "formato": "pdf",
          "almacenamiento": "database",
          "descarga_url": "/api/verification/download/789"
        },
        {
          "id": 790,
          "tipo": "certificadoBancario",
          "nombre_original": "certificado_bancario.pdf",
          "tamaño": 1536000,
          "fecha_subida": "2024-01-15T10:30:00.000Z",
          "formato": "pdf",
          "almacenamiento": "database",
          "descarga_url": "/api/verification/download/790"
        }
      ]
    },
    "resumen_documentos": {
      "total_archivos": 3,
      "archivos_pdf": 2,
      "foto_documento": 1,
      "tipos_archivos": ["reciboServicio", "certificadoBancario"],
      "tamaño_total_pdf": 3584576
    }
  }
}
```

**Respuesta de error (404):**
```json
{
  "success": false,
  "message": "Verificación no encontrada"
}
```

### PUT /api/verification/:id/status
Actualiza el estado de una verificación específica (solo para administradores).

**⚠️ IMPORTANTE:** Al cambiar el estado, se envía automáticamente un correo de notificación al usuario.

**Headers:**
- `Cookie: token=<jwt_token>` (usuario debe tener rol 'Administrador')
- `Content-Type: application/json`

**Parámetros de URL:**
- `id`: ID de la verificación a actualizar

**Body:**
```json
{
  "estado": "en_revision",           // Nuevo estado: 'pendiente', 'en_revision', 'aprobada', 'rechazada'
  "notas_revision": "Documentos en revisión. Se requiere verificación adicional del certificado bancario."
}
```

**📧 Notificaciones Automáticas por Correo:**

| Estado | Asunto del Correo | Contenido |
|--------|------------------|-----------|
| `aprobada` | ✅ Tu verificación ha sido aprobada - CarsKing | Mensaje de felicitación y bienvenida |
| `rechazada` | ❌ Tu verificación requiere correcciones - CarsKing | Motivo del rechazo + instrucciones |
| `en_revision` | 🔍 Tu verificación está en proceso - CarsKing | Información sobre el proceso de revisión |

**Notas importantes:**
- El correo se envía **automáticamente** al cambiar el estado
- Si el correo falla, **la operación continúa normalmente**
- Los errores de correo se registran en los logs del servidor
- El campo `notas_revision` se incluye en el correo de rechazo

**Ejemplos de uso:**

#### Aprobar una verificación
```javascript
PUT /api/verification/123/status
{
  "estado": "aprobada",
  "notas_revision": "Todos los documentos verificados correctamente"
}
```
**Resultado:** 
- ✅ Estado actualizado en BD
- 📧 Correo enviado: "✅ Tu verificación ha sido aprobada - CarsKing"

#### Rechazar una verificación
```javascript
PUT /api/verification/123/status
{
  "estado": "rechazada",
  "notas_revision": "El certificado bancario no es válido. Por favor, proporcione un documento actualizado."
}
```
**Resultado:**
- ✅ Estado actualizado en BD
- 📧 Correo enviado: "❌ Tu verificación requiere correcciones - CarsKing"
- 📝 El motivo del rechazo se incluye en el correo

#### Marcar como en revisión
```javascript
PUT /api/verification/123/status
{
  "estado": "en_revision",
  "notas_revision": "Verificando documentos con entidades bancarias"
}
```
**Resultado:**
- ✅ Estado actualizado en BD
- 📧 Correo enviado: "🔍 Tu verificación está en proceso - CarsKing"

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "message": "Estado de verificación actualizado exitosamente",
  "verification": {
    "id": 123,
    "estado": "aprobada",
    "fecha_solicitud": "2024-01-15T10:30:00.000Z",
    "fecha_revision": "2024-01-16T09:15:00.000Z",
    "notas_revision": "Todos los documentos verificados correctamente",
    "account_type_name": "Particular",
    "archivos": [...]
  }
}
```

**Respuesta de error (400):**
```json
{
  "success": false,
  "message": "Estado inválido",
  "errors": ["Estado debe ser uno de: pendiente, en_revision, aprobada, rechazada"]
}
```

## Cómo usar desde el Frontend

### 1. Verificar permisos de administrador
```javascript
// Antes de hacer cualquier llamada, verificar que el usuario es admin
const checkAdminPermissions = async () => {
  try {
    const response = await fetch('/api/auth/profile', {
      credentials: 'include'
    });
    const data = await response.json();
    return data.user.role === 'Administrador';
  } catch (error) {
    console.error('Error verificando permisos:', error);
    return false;
  }
};
```

### 2. Obtener verificaciones pendientes
```javascript
const getPendingVerifications = async (filters = {}) => {
  const params = new URLSearchParams();
  
  // Agregar filtros
  if (filters.estado) params.append('estado', filters.estado);
  if (filters.account_type_id) params.append('account_type_id', filters.account_type_id);
  if (filters.limit) params.append('limit', filters.limit);
  if (filters.offset) params.append('offset', filters.offset);
  if (filters.sort_by) params.append('sort_by', filters.sort_by);
  if (filters.sort_order) params.append('sort_order', filters.sort_order);

  try {
    const response = await fetch(`/api/verification/pending?${params}`, {
      credentials: 'include'
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error obteniendo verificaciones:', error);
    throw error;
  }
};

// Ejemplos de uso
const verificacionesPendientes = await getPendingVerifications();
const empresasPendientes = await getPendingVerifications({ account_type_id: 6 });
const verificacionesOrdenadas = await getPendingVerifications({ 
  sort_by: 'first_name', 
  sort_order: 'ASC' 
});
```

### 3. Obtener una verificación específica con todos sus documentos
```javascript
const getVerificationById = async (verificationId) => {
  try {
    const response = await fetch(`/api/verification/${verificationId}`, {
      credentials: 'include'
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error obteniendo verificación:', error);
    throw error;
  }
};

// Ejemplo de uso
const verificacion = await getVerificationById(123);
console.log('Documentos disponibles:', verificacion.data.documentos);
console.log('Foto de documento:', verificacion.data.documentos.documento_identidad.url);
console.log('PDFs:', verificacion.data.documentos.archivos_pdf);
```

### 4. Actualizar estado de verificación (con notificación automática por correo)
```javascript
const updateVerificationStatus = async (verificationId, estado, notas = '') => {
  try {
    const response = await fetch(`/api/verification/${verificationId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({
        estado,
        notas_revision: notas
      })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error actualizando estado:', error);
    throw error;
  }
};

// Ejemplos de uso - Cada cambio envía automáticamente un correo al usuario
await updateVerificationStatus(123, 'aprobada', 'Documentos verificados correctamente');
// 📧 Resultado: Correo "✅ Tu verificación ha sido aprobada" enviado al usuario

await updateVerificationStatus(124, 'rechazada', 'Certificado bancario no válido');
// 📧 Resultado: Correo "❌ Tu verificación requiere correcciones" enviado al usuario

await updateVerificationStatus(125, 'en_revision', 'Verificando con entidades bancarias');
// 📧 Resultado: Correo "🔍 Tu verificación está en proceso" enviado al usuario
```

### 5. Componente React de ejemplo con vista detallada
```jsx
import React, { useState, useEffect } from 'react';

const AdminVerifications = () => {
  const [verificaciones, setVerificaciones] = useState([]);
  const [verificacionSeleccionada, setVerificacionSeleccionada] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingDetalle, setLoadingDetalle] = useState(false);
  const [filters, setFilters] = useState({
    estado: 'pendiente',
    account_type_id: '',
    sort_by: 'fecha_solicitud',
    sort_order: 'DESC'
  });

  useEffect(() => {
    loadVerificaciones();
  }, [filters]);

  const loadVerificaciones = async () => {
    try {
      setLoading(true);
      const data = await getPendingVerifications(filters);
      setVerificaciones(data.data.verificaciones);
    } catch (error) {
      console.error('Error cargando verificaciones:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (id, nuevoEstado) => {
    try {
      await updateVerificationStatus(id, nuevoEstado);
      loadVerificaciones(); // Recargar lista
      if (verificacionSeleccionada && verificacionSeleccionada.id === id) {
        loadVerificacionDetalle(id); // Actualizar detalle si está abierto
      }
    } catch (error) {
      console.error('Error actualizando estado:', error);
    }
  };

  const loadVerificacionDetalle = async (id) => {
    try {
      setLoadingDetalle(true);
      const data = await getVerificationById(id);
      setVerificacionSeleccionada(data.data);
    } catch (error) {
      console.error('Error cargando detalle:', error);
    } finally {
      setLoadingDetalle(false);
    }
  };

  const handleVerVerificacion = (id) => {
    loadVerificacionDetalle(id);
  };

  if (loading) return <div>Cargando...</div>;

  return (
    <div>
      <h2>Verificaciones Pendientes</h2>
      
      {/* Filtros */}
      <div className="filters">
        <select 
          value={filters.estado} 
          onChange={(e) => setFilters({...filters, estado: e.target.value})}
        >
          <option value="pendiente">Pendientes</option>
          <option value="en_revision">En Revisión</option>
          <option value="aprobada">Aprobadas</option>
          <option value="rechazada">Rechazadas</option>
        </select>
        
        <select 
          value={filters.account_type_id} 
          onChange={(e) => setFilters({...filters, account_type_id: e.target.value})}
        >
          <option value="">Todos los tipos</option>
          <option value="7">Particular</option>
          <option value="5">Autónomo</option>
          <option value="6">Empresa</option>
        </select>
      </div>

      {/* Lista de verificaciones */}
      <div className="verificaciones">
        {verificaciones.map(verificacion => (
          <div key={verificacion.id} className="verificacion-card">
            <h3>{verificacion.first_name} {verificacion.last_name}</h3>
            <p>Email: {verificacion.email}</p>
            <p>Tipo: {verificacion.account_type_name}</p>
            <p>Estado: {verificacion.estado}</p>
            <p>Fecha: {new Date(verificacion.fecha_solicitud).toLocaleDateString()}</p>
            
            {/* Archivos */}
            <div className="archivos">
              <h4>Archivos:</h4>
              {verificacion.archivos.map(archivo => (
                <div key={archivo.id}>
                  <a href={`/api/verification/download/${archivo.id}`} target="_blank">
                    {archivo.nombre}
                  </a>
                </div>
              ))}
            </div>

            {/* Acciones */}
            <div className="acciones">
              <button onClick={() => handleVerVerificacion(verificacion.id)}>
                Ver Detalles
              </button>
              <button onClick={() => handleStatusUpdate(verificacion.id, 'aprobada')}>
                Aprobar
              </button>
              <button onClick={() => handleStatusUpdate(verificacion.id, 'rechazada')}>
                Rechazar
              </button>
              <button onClick={() => handleStatusUpdate(verificacion.id, 'en_revision')}>
                Marcar en Revisión
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal/Vista detallada de verificación */}
      {verificacionSeleccionada && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Verificación #{verificacionSeleccionada.id}</h3>
              <button onClick={() => setVerificacionSeleccionada(null)}>×</button>
            </div>
            
            {loadingDetalle ? (
              <div>Cargando detalles...</div>
            ) : (
              <div className="verificacion-detalle">
                {/* Información del usuario */}
                <div className="usuario-info">
                  <h4>Información del Usuario</h4>
                  <p><strong>Nombre:</strong> {verificacionSeleccionada.first_name} {verificacionSeleccionada.last_name}</p>
                  <p><strong>Email:</strong> {verificacionSeleccionada.email}</p>
                  <p><strong>Teléfono:</strong> {verificacionSeleccionada.phone}</p>
                  <p><strong>Tipo de cuenta:</strong> {verificacionSeleccionada.account_type_name}</p>
                  <p><strong>Estado:</strong> {verificacionSeleccionada.estado}</p>
                </div>

                {/* Documentos */}
                <div className="documentos">
                  <h4>Documentos</h4>
                  
                  {/* Foto de documento */}
                  <div className="documento-item">
                    <h5>Foto de Documento de Identidad</h5>
                    <img 
                      src={verificacionSeleccionada.documentos.documento_identidad.url} 
                      alt="Documento de identidad"
                      style={{maxWidth: '300px', maxHeight: '200px'}}
                    />
                    <p><strong>Almacenamiento:</strong> Cloudinary</p>
                  </div>

                  {/* Archivos PDF */}
                  <div className="pdfs">
                    <h5>Archivos PDF</h5>
                    {verificacionSeleccionada.documentos.archivos_pdf.map(archivo => (
                      <div key={archivo.id} className="archivo-item">
                        <p><strong>Tipo:</strong> {archivo.tipo}</p>
                        <p><strong>Nombre:</strong> {archivo.nombre_original}</p>
                        <p><strong>Tamaño:</strong> {(archivo.tamaño / 1024 / 1024).toFixed(2)} MB</p>
                        <a 
                          href={archivo.descarga_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="btn-descargar"
                        >
                          Descargar PDF
                        </a>
                      </div>
                    ))}
                  </div>

                  {/* Resumen */}
                  <div className="resumen">
                    <h5>Resumen de Documentos</h5>
                    <p>Total de archivos: {verificacionSeleccionada.resumen_documentos.total_archivos}</p>
                    <p>PDFs: {verificacionSeleccionada.resumen_documentos.archivos_pdf}</p>
                    <p>Foto: {verificacionSeleccionada.resumen_documentos.foto_documento}</p>
                    <p>Tamaño total PDFs: {(verificacionSeleccionada.resumen_documentos.tamaño_total_pdf / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                </div>

                {/* Acciones */}
                <div className="acciones-detalle">
                  <button onClick={() => handleStatusUpdate(verificacionSeleccionada.id, 'aprobada')}>
                    ✅ Aprobar Verificación
                  </button>
                  <button onClick={() => handleStatusUpdate(verificacionSeleccionada.id, 'rechazada')}>
                    ❌ Rechazar Verificación
                  </button>
                  <button onClick={() => handleStatusUpdate(verificacionSeleccionada.id, 'en_revision')}>
                    🔍 Marcar en Revisión
                  </button>
                </div>
                
                {/* Nota sobre correos automáticos */}
                <div className="nota-correo" style={{marginTop: '20px', padding: '10px', backgroundColor: '#e3f2fd', borderRadius: '5px'}}>
                  <p style={{margin: 0, fontSize: '14px', color: '#1976d2'}}>
                    📧 <strong>Nota:</strong> Al cambiar el estado, se enviará automáticamente un correo de notificación al usuario.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminVerifications;
```

## Estados de Verificación

- **pendiente**: Solicitud enviada, esperando revisión
- **en_revision**: Documentos siendo revisados por administrador
- **aprobada**: Verificación aprobada, usuario puede usar todas las funcionalidades
- **rechazada**: Verificación rechazada, usuario debe corregir documentos

## 📧 Sistema de Notificaciones por Correo

### Funcionamiento Automático
- **Al cambiar cualquier estado** → Se envía correo automáticamente al usuario
- **Si el correo falla** → La operación continúa normalmente (no se bloquea)
- **Logging completo** → Todos los envíos y errores se registran en logs

### Tipos de Correo por Estado
| Estado | Asunto | Contenido |
|--------|--------|-----------|
| `aprobada` | ✅ Tu verificación ha sido aprobada - CarsKing | Felicitaciones y bienvenida |
| `rechazada` | ❌ Tu verificación requiere correcciones - CarsKing | Motivo del rechazo + instrucciones |
| `en_revision` | 🔍 Tu verificación está en proceso - CarsKing | Información sobre el proceso |

### Datos del Correo
- **Destinatario**: Email del usuario desde `pre_registro`
- **Nombre**: Nombre del usuario desde `pre_registro`
- **Motivo**: Campo `notas_revision` (solo para rechazo)
- **Formato**: HTML simple y responsivo

## Base de Datos

### Estructura Actualizada
- **`usuariosx`**: Primary Key = `pre_registro_id` (FK a `pre_registro.id`)
- **Constraint UNIQUE**: `documento_tipo + documento_numero` (evita duplicados)
- **`archivos_verificacion`**: FK `verificacion_id` → `usuariosx.pre_registro_id`

### Beneficios de la Nueva Estructura
- ✅ **Consistencia de IDs**: `pre_registro.id = usuariosx.pre_registro_id`
- ✅ **Documento único**: No duplicados de DNI/NIE/Pasaporte
- ✅ **Integridad referencial**: Eliminación en cascada
- ✅ **Consultas eficientes**: Menos JOINs necesarios

## Seguridad

- ✅ Solo usuarios con rol 'Administrador' pueden acceder
- ✅ Verificación de permisos en cada request
- ✅ Validación de estados permitidos
- ✅ Logging de todas las acciones de administrador
- ✅ Manejo robusto de errores de correo
