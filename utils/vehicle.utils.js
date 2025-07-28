export const processVehicleData = (formData, vehicleData) => {
  // Validar y transformar los datos según sea necesario
  return {
    carData: {
      plate: formData.plate.toUpperCase(),
      price: parseFloat(formData.price),
      description: formData.description,
      condition: formData.condition,
      bodyType: formData.bodyType,
      location: formData.location
    },
    vehicleData: {
      make: vehicleData.make,
      model: vehicleData.model,
      year: parseInt(vehicleData.year),
      color: vehicleData.color,
      vin: vehicleData.vin,
      engine: vehicleData.engine,
      transmission: vehicleData.transmission,
      fuelType: vehicleData.fuelType,
      mileage: parseInt(vehicleData.mileage)
    }
  };
};