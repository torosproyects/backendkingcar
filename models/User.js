import { query } from '../config/database.js'
import  { hashPassword, comparePassword } from '../utils/security.js'

export default class User {
  // Crear un nuevo usuario
  static async create(userData) {
    const { name, email, password} = userData

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

    // Insertar el usuario en la base de datos
    const sql = `
      INSERT INTO pre_registro (name, email, password, fecha_registro)
      VALUES (?, ?, ?, NOW())
    `

    const result = await query(sql, [name, email, hashedPassword])
    return result.insertId
  }

  
  // Buscar usuario por email
  static async findByEmail(email) {
    const sql = "SELECT * FROM pre_registro WHERE email = ?"
    const users = await query(sql, [email])
    return users.length ? users[0] : null
  }

  // Buscar usuario por ID
  static async findById(id) {
    const sql = "SELECT id, email, name, fecha_registro FROM pre_registro WHERE id = ?"
    const users = await query(sql, [id])
    return users.length ? users[0] : null
  }
  // Buscar usuario por ID
  static async verificarAutenti(id) {
    const usuario = await query(
    'SELECT documento FROM usuario WHERE pre_registro_id = ? LIMIT 1', 
    [id]
  );
  if (!usuario.length) {
    return { usuario_existe: false, rol: "visitante" };
  }

  // 2. Obtener rol si existe
  const rol = await query(
    `SELECT r.nombre 
     FROM usuario_roles ur
     JOIN roles r ON ur.rol_id = r.id
     WHERE ur.usuario_documento = ? 
     LIMIT 1`, 
    [usuario[0].documento]
  );

  return {
    usuario_existe: true,
    rol: rol.length ? rol[0].nombre : null
  };
}

  // Verificar credenciales de usuario
  static async verifyCredentials(email, password) {
    const user = await this.findByEmail(email)
    if (!user) return null
    const isPasswordValid = await comparePassword(password, user.password)
      if (!isPasswordValid) return null
    // No devolver la contraseña
    const { password: _, ...userWithoutPassword } = user
    return userWithoutPassword
  }

  // Actualizar perfil de usuario
  static async updateProfile(userId, userData) {
    const { name } = userData

    const sql = "UPDATE users SET name = ?, updated_at = NOW() WHERE id = ?"
    return await query(sql, [name, userId])
  }

  // Cambiar contraseña
  static async changePassword(userId, newPassword) {
    const hashedPassword = await hashPassword(newPassword)

    const sql = "UPDATE users SET password = ?, updated_at = NOW() WHERE id = ?"
    return await query(sql, [hashedPassword, userId])
  }
}
