import { query } from '../config/database.js'
import { hashPassword} from '../utils/security.js'

export default class UserPre {
  // Crear un nuevo usuario
  static async create(name, email, password, code, expiresAt, actual) {
    
    // Verificar si el usuario ya existe
    const existingUser = await this.findByEmail(email)
    if (existingUser) {
      throw new Error("El correo electrónico ya está registrado")
    }

    // Encriptar la contraseña si no viene ya encriptada
    let hashedPassword = password;
    if (!password.startsWith('$2')) { // Verificar si ya es un hash de bcrypt
      hashedPassword = await hashPassword(password);
    }
// Primero eliminamos cualquier pre-registro existente para este email
    await query("DELETE FROM registro_pendiente WHERE email = ?", [email])
    // Insertar el usuario en la base de datos
    const sql = `
      INSERT INTO registro_pendiente (name, email, password, codigo, fecha_expiracion, fecha_registro)
      VALUES (?, ?, ?, ?, ?, ?)
    `

    const result = await query(sql, [ name, email, hashedPassword, code, expiresAt,actual])
    return result.insertId
  }

    // Obtener datos de pre-registro
  static async getPreRegistration(email) {
    const sql = "SELECT * registro_pendiente WHERE email = ?"
    const results = await query(sql, [email])
    return results.length ? results[0] : null
  }

  // Actualizar código de verificación para pre-registro
  static async updatePreRegistrationCode(email, code, expiresAt) {
    const actual = new Date()
    const sql = `
      UPDATE registro_pendiente
      SET codigo = ?, fecha_expiracion = ?, fecha_registro = ?
      WHERE email = ?
    `
    return await query(sql, [code, expiresAt, actual, email])
  }

  // Verificar código de pre-registro
  static async verifyPreRegistrationCode(email, code) {
    const actual = new Date()
    const sql = `
      SELECT * FROM registro_pendiente 
      WHERE email = ? AND codigo = ? AND fecha_expiracion > ?
    `
    const results = await query(sql, [email, code, actual])
    if (!results.length) return null

    // Eliminar el pre-registro una vez verificado
    await query("DELETE FROM registro_pendiente WHERE email = ?", [email])

    return results[0]
  }

  // Buscar usuario por email
  static async findByEmail(email) {
    const sql = "SELECT * FROM pre_registro WHERE email = ?"
    const users = await query(sql, [email])
    return users.length ? users[0] : null
  }
  
}
