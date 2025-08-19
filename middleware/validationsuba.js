import Joi from 'joi';

// Esquemas de validación
export const schemas = {
  // Registro de usuario
  register: Joi.object({
    name: Joi.string().min(2).max(100).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).max(100).required(),
    phone: Joi.string().pattern(/^\+?[\d\s\-\(\)]+$/).optional()
  }),

  // Login
  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  }),

  // Crear carro
  createCar: Joi.object({
    make: Joi.string().min(1).max(100).required(),
    model: Joi.string().min(1).max(100).required(),
    year: Joi.number().integer().min(1900).max(new Date().getFullYear() + 1).required(),
    mileage: Joi.number().integer().min(0).required(),
    color: Joi.string().min(1).max(50).required(),
    condition: Joi.string().valid('excellent', 'good', 'fair', 'poor').required(),
    description: Joi.string().max(2000).optional(),
    estimatedValue: Joi.number().positive().required(),
    images: Joi.array().items(Joi.string().uri()).min(1).max(10).required()
  }),

  // Crear subasta
  createAuction: Joi.object({
    carId: Joi.string().required(),
    startPrice: Joi.number().positive().required(),
    reservePrice: Joi.number().positive().optional(),
    duration: Joi.number().integer().min(1).max(168).required(), // 1 hora a 7 días
    startImmediately: Joi.boolean().required(),
    scheduledStartTime: Joi.date().when('startImmediately', {
      is: false,
      then: Joi.required(),
      otherwise: Joi.optional()
    })
  }),

  // Realizar puja
  placeBid: Joi.object({
    amount: Joi.number().positive().required()
  }),

  // Actualizar perfil
  updateProfile: Joi.object({
    name: Joi.string().min(2).max(100).optional(),
    phone: Joi.string().pattern(/^\+?[\d\s\-\(\)]+$/).optional()
  })
};

// Middleware de validación
export const validate = (schemaName) => {
  return (req, res, next) => {
   const schema = schemas[schemaName];
    
    if (!schema) {
      return res.status(500).json({ error: 'Esquema de validación no encontrado' });
    }
   const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      return res.status(400).json({
        error: 'Datos de entrada inválidos',
        details: errors
      });
    }

    req.validatedData = value;
    next();
  };
};

// Validación de parámetros de URL
export const validateParams = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.params);

    if (error) {
      return res.status(400).json({
        error: 'Parámetros inválidos',
        details: error.details.map(detail => detail.message)
      });
    }

    req.params = value;
    next();
  };
};

// Esquemas para parámetros
export const paramSchemas = {
  uuid: Joi.object({
    id: Joi.string().uuid().required()
  })
};

