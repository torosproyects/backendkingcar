import { query } from '../config/database.js'

export default class Car {
static async getAll() {
    const sql = "SELECT c.id AS carro_id, c.placa,c.year, c.kilometraje, c.precio, c.tipo_carroceria AS categoria, c.color AS colorExterior, c.motor AS serial_motor, c.vin AS serial_carroceria, c.isNew, (SELECT i.url FROM imagenes_carrosx i WHERE i.carro_id = c.id AND i.es_principal = 1 LIMIT 1) AS imagen_principal_url, m.nombre AS marca_nombre, mo.nombre AS modelo_nombre, i.id AS imagen_id, i.public_id AS imagen_public_id, i.url AS imagen_url, i.es_principal AS imagen_es_principal, i.orden AS imagen_orden FROM carrosx c JOIN modelos mo ON c.modelo_id = mo.id JOIN marcas m  ON mo.marca_id = m.id JOIN imagenes_carrosx i ON c.id = i.carro_id  ORDER BY c.id, i.orden";
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
      
      const sql = "SELECT c.id AS carro_id, c.placa,c.year, c.kilometraje, c.precio, c.tipo_carroceria AS categoria, c.color AS colorExterior, c.motor AS serial_motor, c.vin AS serial_carroceria, c.isNew, (SELECT i.url FROM imagenes_carrosx i WHERE i.carro_id = c.id AND i.es_principal = 1 LIMIT 1) AS imagen_principal_url, m.nombre AS marca_nombre, mo.nombre AS modelo_nombre, i.id AS imagen_id, i.public_id AS imagen_public_id, i.url AS imagen_url, i.es_principal AS imagen_es_principal, i.orden AS imagen_orden FROM carrosx c JOIN modelos mo ON c.modelo_id = mo.id JOIN marcas m  ON mo.marca_id = m.id left JOIN imagenes_carrosx i ON c.id = i.carro_id where c.id = ?";
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


}
