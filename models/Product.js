import { query } from '../config/database.js'

export default class Product {
  // Obtener todos los productos con filtros
  static async getAll(filters = {}) {
    let sql = `
      SELECT * FROM products 
      WHERE 1=1
    `

    const params = []

    // Aplicar filtros
    if (filters.minPrice !== undefined) {
      sql += " AND price >= ?"
      params.push(filters.minPrice)
    }

    if (filters.maxPrice !== undefined) {
      sql += " AND price <= ?"
      params.push(filters.maxPrice)
    }

    if (filters.year !== undefined) {
      sql += " AND year = ?"
      params.push(filters.year)
    }

    if (filters.color) {
      sql += " AND color = ?"
      params.push(filters.color)
    }

    if (filters.category) {
      sql += " AND category = ?"
      params.push(filters.category)
    }

    // Contar total de productos para paginación
    const countSql = sql.replace("SELECT *", "SELECT COUNT(*) as total")
    const countResult = await query(countSql, params)
    const total = countResult[0].total

    // Aplicar paginación
    const page = filters.page || 1
    const limit = filters.limit || 20
    const offset = (page - 1) * limit

    sql += " ORDER BY id DESC LIMIT ? OFFSET ?"
    params.push(limit, offset)

    const products = await query(sql, params)

    // Obtener imágenes adicionales para cada producto
    for (const product of products) {
      product.images = await this.getProductImages(product.id)
    }

    return {
      products,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    }
  }

  // Obtener un producto por ID
  static async getById(id) {
    const sql = "SELECT * FROM products WHERE id = ?"
    const products = await query(sql, [id])

    if (products.length === 0) return null

    const product = products[0]

    // Obtener imágenes adicionales
    product.images = await this.getProductImages(id)

    return product
  }

  // Obtener imágenes adicionales de un producto
  static async getProductImages(productId) {
    try {
      const sql = "SELECT image_url FROM product_images WHERE product_id = ?"
      const images = await query(sql, [productId])
      return images.map((img) => img.image_url)
    } catch (error) {
      console.error("Error al obtener imágenes del producto:", error)
      return []
    }
  }

  // Obtener productos relacionados por categoría
  static async getRelatedProducts(category, currentProductId, limit = 4) {
    const sql = `
      SELECT * FROM products 
      WHERE category = ? AND id != ?
      ORDER BY RAND()
      LIMIT ?
    `

    const products = await query(sql, [category, currentProductId, limit])

    // Obtener imágenes adicionales para cada producto
    for (const product of products) {
      product.images = await this.getProductImages(product.id)
    }

    return products
  }

  // Obtener valores disponibles para filtros
  static async getFilterOptions() {
    // Obtener años disponibles
    const yearsSql = "SELECT DISTINCT year FROM products ORDER BY year DESC"
    const years = await query(yearsSql)

    // Obtener colores disponibles
    const colorsSql = "SELECT DISTINCT color FROM products ORDER BY color"
    const colors = await query(colorsSql)

    // Obtener categorías disponibles
    const categoriesSql = "SELECT DISTINCT category FROM products ORDER BY category"
    const categories = await query(categoriesSql)

    // Obtener rango de precios
    const priceSql = "SELECT MIN(price) as minPrice, MAX(price) as maxPrice FROM products"
    const priceRange = await query(priceSql)

    return {
      years: years.map((y) => y.year),
      colors: colors.map((c) => c.color),
      categories: categories.map((c) => c.category),
      priceRange: priceRange[0],
    }
  }

  // Crear un nuevo producto (para administradores)
  static async create(productData) {
    const { name, description, price, year, color, image, category, images = [] } = productData

    const sql = `
      INSERT INTO products (name, description, price, year, color, image, category, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
    `

    const result = await query(sql, [name, description, price, year, color, image, category])
    const productId = result.insertId

    // Guardar imágenes adicionales
    if (images.length > 0) {
      await this.saveProductImages(productId, images)
    }

    return productId
  }

  // Guardar imágenes adicionales de un producto
  static async saveProductImages(productId, images) {
    const sql = `
      INSERT INTO product_images (product_id, image_url, created_at)
      VALUES (?, ?, NOW())
    `

    for (const imageUrl of images) {
      await query(sql, [productId, imageUrl])
    }
  }

  // Actualizar un producto (para administradores)
  static async update(id, productData) {
    const { name, description, price, year, color, image, category, images } = productData

    const sql = `
      UPDATE products 
      SET name = ?, description = ?, price = ?, year = ?, color = ?, 
          image = ?, category = ?, updated_at = NOW()
      WHERE id = ?
    `

    await query(sql, [name, description, price, year, color, image, category, id])

    // Actualizar imágenes adicionales si se proporcionan
    if (images) {
      // Eliminar imágenes existentes
      await query("DELETE FROM product_images WHERE product_id = ?", [id])

      // Guardar nuevas imágenes
      await this.saveProductImages(id, images)
    }

    return true
  }

  // Eliminar un producto (para administradores)
  static async delete(id) {
    // Primero eliminar imágenes relacionadas
    await query("DELETE FROM product_images WHERE product_id = ?", [id])

    // Luego eliminar el producto
    const sql = "DELETE FROM products WHERE id = ?"
    return await query(sql, [id])
  }
}

