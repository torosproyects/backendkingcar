import { body, validationResult } from "express-validator";

// Validar resultados
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// Validaciones para registro de usuario
export const registerValidation = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("El nombre es requerido")
    .isLength({ min: 2, max: 100 })
    .withMessage("El nombre debe tener entre 2 y 100 caracteres"),

  body("email")
    .trim()
    .notEmpty()
    .withMessage("El correo electrónico es requerido")
    .isEmail()
    .withMessage("Correo electrónico inválido")
    .normalizeEmail({ gmail_remove_dots: false }),

  body("password")
    .trim()
    .notEmpty()
    .withMessage("La contraseña es requerida")
    .isLength({ min: 8 })
    .withMessage("La contraseña debe tener al menos 8 caracteres")
    .matches(/[A-Z]/)
    .withMessage("La contraseña debe contener al menos una letra mayúscula")
    .matches(/[a-z]/)
    .withMessage("La contraseña debe contener al menos una letra minúscula")
    .matches(/[0-9]/)
    .withMessage("La contraseña debe contener al menos un número")
    .matches(/[!@#$%^&*(),.?":{}|<>]/)
    .withMessage("La contraseña debe contener al menos un carácter especial"),

  validate
];

// Validaciones para inicio de sesión
export const loginValidation = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("El correo electrónico es requerido")
    .isEmail()
    .withMessage("Correo electrónico inválido"),

  body("password").trim().notEmpty().withMessage("La contraseña es requerida"),

  validate
];

// Validaciones para verificación de correo
export const verifyEmailValidation = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("El correo electrónico es requerido")
    .isEmail()
    .withMessage("Correo electrónico inválido"),

  body("code")
    .trim()
    .notEmpty()
    .withMessage("El código de verificación es requerido")
    .isLength({ min: 6, max: 6 })
    .withMessage("El código debe tener 6 dígitos"),

  validate
];

// Validaciones para creación/actualización de producto
export const productValidation = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("El nombre del producto es requerido")
    .isLength({ min: 2, max: 100 })
    .withMessage("El nombre debe tener entre 2 y 100 caracteres"),

  body("description")
    .trim()
    .notEmpty()
    .withMessage("La descripción es requerida")
    .isLength({ min: 10, max: 1000 })
    .withMessage("La descripción debe tener entre 10 y 1000 caracteres"),

  body("price")
    .notEmpty()
    .withMessage("El precio es requerido")
    .isFloat({ min: 0.01 })
    .withMessage("El precio debe ser un número positivo"),

  body("year")
    .notEmpty()
    .withMessage("El año es requerido")
    .isInt({ min: 1900, max: new Date().getFullYear() })
    .withMessage("Año inválido"),

  body("color").trim().notEmpty().withMessage("El color es requerido"),

  body("category").trim().notEmpty().withMessage("La categoría es requerida"),

  validate
];

// Validaciones para cambio de contraseña
export const changePasswordValidation = [
  body("currentPassword").trim().notEmpty().withMessage("La contraseña actual es requerida"),

  body("newPassword")
    .trim()
    .notEmpty()
    .withMessage("La nueva contraseña es requerida")
    .isLength({ min: 8 })
    .withMessage("La contraseña debe tener al menos 8 caracteres")
    .matches(/[A-Z]/)
    .withMessage("La contraseña debe contener al menos una letra mayúscula")
    .matches(/[a-z]/)
    .withMessage("La contraseña debe contener al menos una letra minúscula")
    .matches(/[0-9]/)
    .withMessage("La contraseña debe contener al menos un número")
    .matches(/[!@#$%^&*(),.?":{}|<>]/)
    .withMessage("La contraseña debe contener al menos un carácter especial"),

  validate
];

// Exportación por defecto para compatibilidad
export default {
  registerValidation,
  loginValidation,
  verifyEmailValidation,
  productValidation,
  changePasswordValidation
};