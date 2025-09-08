import { getPool } from "../config/database.js";

const pool = getPool();

export class CarModel {
  static async create({ plate, price, description, condition, bodyType, location, userId, ...vehicleData }) {

    const [rows] = await pool.query(
        'SELECT documento FROM usuario WHERE pre_registro_id = ? LIMIT 1', 
        [userId]
      );
    const usuariID=rows[0].documento;
    const [rowsx]= await pool.query(
        'SELECT id FROM modelos WHERE nombre = ? LIMIT 1', 
        [vehicleData.model]
      );
    const modeloID=rowsx[0].id;
    const [result] = await pool.query(
      `INSERT INTO carrosx (placa, precio, descripcion, condicion, tipo_carroceria,
       ubicacion, usuario_id, modelo_id, year,color, vin, motor, transmision, tipo_combustible, kilometraje, fecha_creacion)VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        plate, price, description, condition, bodyType, location, usuariID,
        modeloID, vehicleData.year, vehicleData.color,
        vehicleData.vin, vehicleData.engine, vehicleData.transmission,
        vehicleData.fuelType, vehicleData.mileage
      ]
    );
    await pool.query(`INSERT INTO carrosx_estadocar (id_car, id_estado,fecha_inicio) VALUES ( ?, 8, NOW())`,
      [result.insertId]
    );
    return result.insertId;
  }
  
  static async findByPlate(plate) {
    const [rows] = await pool.query(
      `SELECT * FROM carros WHERE placa = ?`,
      [plate]
    );
    return rows[0];
  }

  static async addImages(carId, images) {
    if (images.length === 0) return;
    
    const values = images.map(image => [
      carId,
      image.publicId,
      image.url,
      image.templateId,
      image.isMain || false
    ]);

    await pool.query(
      `INSERT INTO imagenes_carrosx 
       (carro_id, public_id, url, template_id, es_principal) 
       VALUES ?`,
      [values]
    );
  }
}