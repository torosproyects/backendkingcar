import User from "../models/User.js";
import UserPre from "../models/UserPre.js";
import { generateToken, generateVerificationCode } from "../utils/security.js";
import { sendVerificationEmail } from "../utils/emailService.js";
import { logger } from "../utils/logger.js";

// Configuración de cookies
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
  maxAge: 60 * 60 * 1000,
  path: '/'
};

// Pre-registro: enviar código de verificación
export const preRegister = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // Verificar si el correo ya está registrado
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(409).json({ error: "El correo electrónico ya está registrado" });
    }

    // Generar código de verificación
    const verificationCode = generateVerificationCode();

    // Calcular fecha de expiración (30 minutos)
    const expiresAt = new Date();
    const actual = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 30);
    
    // Guardar datos de pre-registro
    await UserPre.create(name, email, password, verificationCode, expiresAt, actual);

    // Enviar correo de verificación
    await sendVerificationEmail(email, name, verificationCode);

    res.status(200).json({
      success: true,
      message: "Código de verificación enviado. Por favor, verifica tu correo electrónico.",
    });
  } catch (error) {
    next(error);
  }
};

// Verificación de correo y registro final
export const verifyAndRegister = async (req, res, next) => {
  try {
    const { name, email, code } = req.body;
    
    // Verificar código y obtener datos de pre-registro
    const preRegistrationData = await UserPre.verifyPreRegistrationCode(email, code);
    
    if (!preRegistrationData) {
      return res.status(400).json({ error: "Código de verificación inválido o expirado" });
    }
    
    // Crear usuario con los datos de pre-registro
    const userId = await User.create({
      email: preRegistrationData.email,
      password: preRegistrationData.password,
      name: preRegistrationData.name
    });
    
    const verificado = {
      is_verified: false,
      role: "Usuario" 
    };
      
    // Generar token JWT
    const token = generateToken(userId, verificado);
    // Establecer cookie con el token
    res.cookie('token', token, cookieOptions);
    
    const usera = await User.findById(userId);
    const user = {
      id: String(usera.id),
      email: usera.email,
      name: usera.name, 
      role: "Usuario",
      createdAt: new Date(usera.fecha_registro).toISOString(),
      profileStatus: "pendiente"
    };
    
    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    next(error);
  }
};

// Inicio de sesión
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
  
    // Verificar credenciales
    const usera = await User.verifyCredentials(email, password);
    if (!usera) {
      return res.status(401).json({ error: "Credenciales incorrectas" });
    }
    
    const verificado = await User.verificarAutenti(usera.id);
     
    // Generar token JWT
    const token = generateToken(usera, verificado);
    // Establecer cookie con el token
    res.cookie('token', token, cookieOptions);
    
    const user = {
      id: String(usera.id),
      email: usera.email,
      name: usera.name, 
      role: verificado.rol, 
      createdAt: new Date(usera.fecha_registro).toISOString(),
      profileStatus: "verificado"
    };
    console.log(user)
    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    next(error);
  }
};

// Reenviar código de verificación
export const resendVerificationCode = async (req, res, next) => {
  try {
    const { email, name } = req.body;
    // Generar nuevo código de verificación
    const verificationCode = generateVerificationCode();

    // Calcular fecha de expiración (30 minutos)
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 30);

    // Actualizar código de verificación
    await UserPre.updatePreRegistrationCode(email, verificationCode, expiresAt);

    // Enviar correo de verificación
    await sendVerificationEmail(email, name, verificationCode);

    res.status(200).json({
      success: true,
      message: "Código de verificación reenviado",
    });
  } catch (error) {
    next(error);
  }
};

// Obtener perfil de usuario
export const getProfile = async (req, res, next) => {
  try {
    // req.user viene del middleware de autenticación
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    next(error);
  }
};

// Cerrar sesión
export const logout = async (req, res, next) => {
  try {
    // Eliminar la cookie del token
    res.clearCookie('token');
    
    res.status(200).json({
      success: true,
      message: "Sesión cerrada correctamente"
    });
  } catch (error) {
    next(error);
  }
};

// Exportación por defecto para compatibilidad
export default {
  preRegister,
  verifyAndRegister,
  login,
  resendVerificationCode,
  getProfile,
  logout
};