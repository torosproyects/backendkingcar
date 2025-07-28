import Product from '../models/Product.js';

// Obtener todos los productos con filtros y paginación
export const getProducts = async (req, res, next) => {
  try {
    const filters = {
      minPrice: req.query.minPrice ? Number.parseInt(req.query.minPrice) : undefined,
      maxPrice: req.query.maxPrice ? Number.parseInt(req.query.maxPrice) : undefined,
      year: req.query.year ? Number.parseInt(req.query.year) : undefined,
      color: req.query.color !== "all" ? req.query.color : undefined,
      category: req.query.category !== "all" ? req.query.category : undefined,
      page: Number.parseInt(req.query.page || "1"),
      limit: Number.parseInt(req.query.limit || "20"),
    };

    const result = await Product.getAll(filters);

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

// Obtener un producto por ID
export const getProductById = async (req, res, next) => {
  try {
    const productId = Number.parseInt(req.params.id);

    const product = await Product.getById(productId);
    if (!product) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }

    res.status(200).json(product);
  } catch (error) {
    next(error);
  }
};

// Obtener productos relacionados por categoría
export const getRelatedProducts = async (req, res, next) => {
  try {
    const productId = Number.parseInt(req.params.id);
    const { category } = req.query;
    const limit = Number.parseInt(req.query.limit || "4");

    if (!category) {
      return res.status(400).json({ error: "Se requiere la categoría para obtener productos relacionados" });
    }

    const relatedProducts = await Product.getRelatedProducts(category, productId, limit);

    res.status(200).json({ products: relatedProducts });
  } catch (error) {
    next(error);
  }
};

// Obtener opciones de filtrado
export const getFilterOptions = async (req, res, next) => {
  try {
    const filterOptions = await Product.getFilterOptions();

    res.status(200).json(filterOptions);
  } catch (error) {
    next(error);
  }
};

// Crear un nuevo producto (solo administradores)
export const createProduct = async (req, res, next) => {
  try {
    // Verificar si el usuario es administrador
    if (!req.user.isAdmin) {
      return res.status(403).json({ error: "No tienes permisos para realizar esta acción" });
    }

    const productData = {
      name: req.body.name,
      description: req.body.description,
      price: Number.parseFloat(req.body.price),
      year: Number.parseInt(req.body.year),
      color: req.body.color,
      image: req.body.image,
      category: req.body.category,
      images: req.body.images || [], // Imágenes adicionales
    };

    const productId = await Product.create(productData);

    res.status(201).json({
      success: true,
      productId,
      message: "Producto creado correctamente",
    });
  } catch (error) {
    next(error);
  }
};

// Actualizar un producto (solo administradores)
export const updateProduct = async (req, res, next) => {
  try {
    // Verificar si el usuario es administrador
    if (!req.user.isAdmin) {
      return res.status(403).json({ error: "No tienes permisos para realizar esta acción" });
    }

    const productId = Number.parseInt(req.params.id);

    // Verificar si el producto existe
    const product = await Product.getById(productId);
    if (!product) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }

    const productData = {
      name: req.body.name,
      description: req.body.description,
      price: Number.parseFloat(req.body.price),
      year: Number.parseInt(req.body.year),
      color: req.body.color,
      image: req.body.image,
      category: req.body.category,
      images: req.body.images, // Imágenes adicionales
    };

    await Product.update(productId, productData);

    res.status(200).json({
      success: true,
      message: "Producto actualizado correctamente",
    });
  } catch (error) {
    next(error);
  }
};

// Eliminar un producto (solo administradores)
export const deleteProduct = async (req, res, next) => {
  try {
    // Verificar si el usuario es administrador
    if (!req.user.isAdmin) {
      return res.status(403).json({ error: "No tienes permisos para realizar esta acción" });
    }

    const productId = Number.parseInt(req.params.id);

    // Verificar si el producto existe
    const product = await Product.getById(productId);
    if (!product) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }

    await Product.delete(productId);

    res.status(200).json({
      success: true,
      message: "Producto eliminado correctamente",
    });
  } catch (error) {
    next(error);
  }
};

// Exportación por defecto (opcional)
export default {
  getProducts,
  getProductById,
  getRelatedProducts,
  getFilterOptions,
  createProduct,
  updateProduct,
  deleteProduct
};