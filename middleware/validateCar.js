import Joi from 'joi';

const carSchema = Joi.object({
  plate: Joi.string().pattern(/^[A-Z]{3}-?\d{3,4}$/).required(),
  brand: Joi.string().required(),
  model: Joi.string().required(),
  year: Joi.number().integer().min(1900).max(new Date().getFullYear() + 1),
  mileage: Joi.number().integer().min(0),
  price: Joi.number().precision(2).min(0).required(),
  transmission: Joi.string().valid('manual', 'automatic', 'semi-automatic'),
  fuelType: Joi.string().valid('gasoline', 'diesel', 'electric', 'hybrid')
});

const validateCar = (req, res, next) => {
  const { error } = carSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  if (!req.files || req.files.length !== 10) {
    return res.status(400).json({ 
      error: 'Se requieren exactamente 10 imágenes del vehículo' 
    });
  }

  next();
};
export default validateCar;