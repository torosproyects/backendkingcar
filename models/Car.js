import { transaction,query } from '../config/database.js'
import { logger } from '../utils/logger.js';

export default class Car {
static async getAll(statusIds = []) {

  let whereClause = '';
    const params = [];

    if (statusIds && Array.isArray(statusIds) && statusIds.length > 0) {
        const placeholders = statusIds.map(() => '?').join(', ');
        whereClause = `WHERE ce.id_estado IN (${placeholders})`;
        params.push(...statusIds);
    }
 
    const sql = `
        SELECT 
            c.id AS carro_id, c.placa, c.year, c.kilometraje, c.precio, c.tipo_carroceria AS categoria, c.color AS colorExterior, c.motor AS serial_motor, c.vin AS serial_carroceria, c.isNew,
            (SELECT i.url FROM imagenes_carrosx i WHERE i.carro_id = c.id AND i.es_principal = 1 LIMIT 1) AS imagen_principal_url,
            m.nombre AS marca_nombre, mo.nombre AS modelo_nombre, i.id AS imagen_id, i.public_id AS imagen_public_id, i.url AS imagen_url, i.es_principal AS imagen_es_principal, i.orden AS imagen_orden, ec.nombre AS estado 
        FROM 
            carrosx c 
            JOIN modelos mo ON c.modelo_id = mo.id 
            JOIN marcas m ON mo.marca_id = m.id 
            JOIN imagenes_carrosx i ON c.id = i.carro_id 
            LEFT JOIN carrosx_estadocar ce ON c.id = ce.id_car AND ce.fecha_salida IS NULL 
            LEFT JOIN estadocar ec ON ce.id_estado = ec.id 
        ${whereClause} 
        ORDER BY c.id, i.orden`;
    try {
    const rows = await query(sql);
       
      if (rows.length === 0) {
        return []; 
      }

      // 2. Procesar las filas para construir la estructura anidada
      const carrosMap = {};

      for (const row of rows) {
        const carroId = row.carro_id;

        if (!carrosMap[carroId]) {
          // Si es la primera vez que vemos este carro, creamos su objeto base
          carrosMap[carroId] = {
            // Usar placa como ID único como en tu ejemplo, o carroId
            id: row.placa, 
            placa: row.placa,
            year: row.year,
            kilometraje: row.kilometraje,
            // Asegurar que precio sea un string con dos decimales
            precio: parseFloat(row.precio).toFixed(2), 
            categoria: row.categoria,
            colorExterior: row.colorExterior,
            serial_motor: row.serial_motor || '',
            // Usar la imagen principal obtenida por la subconsulta
            imagen: row.imagen_principal_url || '', 
            serial_carroceria: row.serial_carroceria || '',
            isNew: row.isNew,
            marca: row.marca_nombre,
            estado:row.estado,
            modelo: row.modelo_nombre,
            imagenes: [] // Inicializar array de imágenes
          };
        }

        // 3. Si la fila tiene datos de imagen, agregarla al array del carro
        if (row.imagen_id !== null) {
          carrosMap[carroId].imagenes.push({
            id: row.imagen_public_id,
            url: row.imagen_url,
          });
        }
      }

      // 4. Convertir el objeto mapa en un array de carros
      const carrosConFotos = Object.values(carrosMap);
      return carrosConFotos;
      
      } catch (error) {
      console.error("Error en Car.getAll():", error);
      throw error; // Relanzar el error para que lo maneje el endpoint API
    }
  }
  static async getCarId(id) {
      
      const sql = "SELECT c.id AS carro_id, c.placa,c.year, c.kilometraje, c.precio, c.tipo_carroceria AS categoria, c.color AS colorExterior, c.motor AS serial_motor, c.vin AS serial_carroceria, c.isNew, (SELECT i.url FROM imagenes_carrosx i WHERE i.carro_id = c.id AND i.es_principal = 1 LIMIT 1) AS imagen_principal_url, m.nombre AS marca_nombre, mo.nombre AS modelo_nombre, i.id AS imagen_id, i.public_id AS imagen_public_id, i.url AS imagen_url, i.es_principal AS imagen_es_principal, i.orden AS imagen_orden FROM carrosx c JOIN modelos mo ON c.modelo_id = mo.id JOIN marcas m  ON mo.marca_id = m.id left JOIN imagenes_carrosx i ON c.id = i.carro_id LEFT JOIN carrosx_estadocar ce ON c.id = ce.id_car AND ce.fecha_salida IS NULL LEFT JOIN estadocar ec ON ce.id_estado = ec.id where c.id = ?";
      try {
      const rows = await query(sql,[id]);
          if (rows.length === 0) {
          return []; // Devolver array vacío si no hay carros
        }
  
        // 2. Procesar las filas para construir la estructura anidada
        const carrosMap = {};
  
        for (const row of rows) {
          const carroId = row.carro_id;
  
          if (!carrosMap[carroId]) {
            // Si es la primera vez que vemos este carro, creamos su objeto base
            carrosMap[carroId] = {
              // Usar placa como ID único como en tu ejemplo, o carroId
              id: row.placa, 
              placa: row.placa,
              year: row.year,
              kilometraje: row.kilometraje,
              // Asegurar que precio sea un string con dos decimales
              precio: parseFloat(row.precio).toFixed(2), 
              categoria: row.categoria,
              colorExterior: row.colorExterior,
              serial_motor: row.serial_motor || '',
              // Usar la imagen principal obtenida por la subconsulta
              imagen: row.imagen_principal_url || '', 
              serial_carroceria: row.serial_carroceria || '',
              isNew: row.isNew,
              marca: row.marca_nombre,
              modelo: row.modelo_nombre,
              estado:row.estado,
              imagenes: [] // Inicializar array de imágenes
            };
          }
  
          // 3. Si la fila tiene datos de imagen, agregarla al array del carro
          if (row.imagen_id !== null) {
            carrosMap[carroId].imagenes.push({
              id: row.imagen_public_id,
              url: row.imagen_url,
            });
          }
        }
  
        // 4. Convertir el objeto mapa en un array de carros
        const carroConFotos = Object.values(carrosMap);
        return carroConFotos;
        
        } catch (error) {
        console.error("Error en Car.getCarId", error);
        throw error; // Relanzar el error para que lo maneje el endpoint API
      }
    }
  static async getPendingCar() {
      
      const sql = "SELECT c.id AS carro_id, c.placa,c.year, c.kilometraje, c.precio, c.tipo_carroceria AS categoria, c.color AS colorExterior, c.motor AS serial_motor, c.vin AS serial_carroceria, c.isNew, (SELECT i.url FROM imagenes_carrosx i WHERE i.carro_id = c.id AND i.es_principal = 1 LIMIT 1) AS imagen_principal_url, m.nombre AS marca_nombre, mo.nombre AS modelo_nombre, i.id AS imagen_id, i.public_id AS imagen_public_id, i.url AS imagen_url, i.es_principal AS imagen_es_principal, i.orden AS imagen_orden, ec.nombre AS estado FROM carrosx c JOIN modelos mo ON c.modelo_id = mo.id JOIN marcas m  ON mo.marca_id = m.id left JOIN imagenes_carrosx i ON c.id = i.carro_id JOIN carrosx_estadocar ce ON c.id = ce.id_car AND ce.fecha_salida IS NULL AND ce.id_estado=8 JOIN estadocar ec ON ce.id_estado = ec.id";
      try {
      const rows = await query(sql);
          if (rows.length === 0) {
          return []; // Devolver array vacío si no hay carros
        }
  
        // 2. Procesar las filas para construir la estructura anidada
        const carrosMap = {};
  
        for (const row of rows) {
          const carroId = row.carro_id;
  
          if (!carrosMap[carroId]) {
            // Si es la primera vez que vemos este carro, creamos su objeto base
            carrosMap[carroId] = {
              // Usar placa como ID único como en tu ejemplo, o carroId
              id: row.carro_id, 
              placa: row.placa,
              year: row.year,
              kilometraje: row.kilometraje,
              // Asegurar que precio sea un string con dos decimales
              precio: parseFloat(row.precio).toFixed(2), 
              categoria: row.categoria,
              colorExterior: row.colorExterior,
              serial_motor: row.serial_motor || '',
              // Usar la imagen principal obtenida por la subconsulta
              imagen: row.imagen_principal_url || '', 
              serial_carroceria: row.serial_carroceria || '',
              isNew: row.isNew,
              marca: row.marca_nombre,
              modelo: row.modelo_nombre,
              estado:row.estado,
              imagenes: [] // Inicializar array de imágenes
            };
          }
  
          // 3. Si la fila tiene datos de imagen, agregarla al array del carro
          if (row.imagen_id !== null) {
            carrosMap[carroId].imagenes.push({
              id: row.imagen_public_id,
              url: row.imagen_url,
            });
          }
        }
  
        // 4. Convertir el objeto mapa en un array de carros
        const carrosConFotos = Object.values(carrosMap);
        return carrosConFotos;
        
        } catch (error) {
        console.error("Error en Car.getCarId", error);
        throw error; // Relanzar el error para que lo maneje el endpoint API
      }
    }
  static async createPhotos(carId, photos) {
    const values = photos.map(photo => 
      [carId, photo.url, photo.publicId, photo.order]
    );
    
    await query(
      `INSERT INTO car_photos 
       (car_id, url, public_id, photo_order)
       VALUES ?`,
      [values]
    );
  }
  static async findByUserId(userId) {
    const sql = `SELECT CAST(c.id AS CHAR) AS id, m.nombre AS make, mo.nombre AS model, c.year,c.kilometraje AS mileage, c.color, c.descripcion AS \`description\`, c.condicion AS \`condition\`, c.precio AS estimatedValue, u.documento AS ownerid, ic.id AS image_id,ic.url AS image_url,ic.es_principal AS is_principal FROM carrosx c JOIN modelos mo ON c.modelo_id = mo.id JOIN marcas m ON mo.marca_id = m.id JOIN usuario u ON c.usuario_id = u.documento JOIN pre_registro pr ON u.pre_registro_id = pr.id LEFT JOIN imagenes_carrosx ic ON c.id = ic.carro_id WHERE pr.id = ? AND ( SELECT ec.id_estado FROM carrosx_estadocar ec WHERE ec.id_car = c.id ORDER BY ec.fecha_inicio DESC LIMIT 1) = ( SELECT id FROM estadocar WHERE nombre = 'venta' LIMIT 1 ) ORDER BY c.id, ic.es_principal DESC, ic.id`;

     try {
    const rows = await query(sql, [userId]);

    if (rows.length === 0) {
      return [];
    }

    // Agrupar por carro
    const carsMap = new Map();

    rows.forEach(row => {
      const {
        id, make, model,
        year,
        mileage,
        color,
        description,
        condition,
        estimatedValue,
        ownerid,
        image_id,
        image_url,
        is_principal
      } = row;

      if (!carsMap.has(id)) {
        carsMap.set(id, {
          id, make,model,year, mileage,color, description, condition, estimatedValue, ownerid,
          imagen: null, // imagen principal
          images: []  // otras imágenes con id y url
        });
      }

      const car = carsMap.get(id);

      // Si tiene imagen
      if (image_id !== null) {
        if (is_principal) {
          // Si es principal, asignar al campo `image`
          car.imagen = image_url;
        } else {
          // Si no es principal, agregar al array `images` como objeto
          car.images.push({
            id: image_id,
            url: image_url
          });
        }
      }
    });

    // Convertir el Map a array
     return Array.from(carsMap.values());

  } catch (error) {
    console.error("Error en Car.findByUserId():", error);
    throw error;
  }
  }
  static async changeStateCards(carId, valor) {
  let success = false;
  
  try {
    await transaction(async (connection) => {
      // Primero actualizamos el estado actual (cerramos el registro anterior)
      await connection.execute(
        'UPDATE carrosx_estadocar SET fecha_salida = NOW() WHERE id_car = ? AND fecha_salida IS NULL',
        [carId]
      );

      // Luego insertamos el nuevo estado
      await connection.execute(
        'INSERT INTO carrosx_estadocar (id_car, id_estado, fecha_inicio) VALUES (?, ?, NOW())',
        [carId, valor]
      );
    });
    
    success = true;
    logger.info(`Estado del carro ${carId} cambiado exitosamente a ${valor}`);
    
  } catch (error) {
    logger.error(`Error al cambiar estado del carro ${carId}:`, error.message);
    success = false;
  }
  
  return success;
}


}
