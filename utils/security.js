import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

// Encriptar contraseña
export const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

// Comparar contraseña
export const comparePassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};

// Generar token JWT
export const generateToken = (user, verificado) => {
  const payload = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: verificado.rol || "Por Verificar" 
  };

  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1h" });
};

// Generar código de verificación (6 dígitos)
export const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Generar token de restablecimiento de contraseña
export const generateResetToken = () => {
  const buffer = crypto.randomBytes(32);
  return buffer.toString('hex');
};

// Exportación por defecto para compatibilidad
export default {
  hashPassword,
  comparePassword,
  generateToken,
  generateVerificationCode,
  generateResetToken
};