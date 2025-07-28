import express from 'express'
import productController from '../controllers/productController.js'
import { authenticate, isVerified, isAdmin } from '../middleware/auth.js'
import { productValidation } from '../middleware/validator.js'

const router = express.Router()

// Rutas públicas
router.get("/", productController.getProducts)
router.get("/filter-options", productController.getFilterOptions)

// Rutas que requieren autenticación
router.get("/:id", authenticate, isVerified, productController.getProductById)
router.get("/:id/related", authenticate, isVerified, productController.getRelatedProducts)

// Rutas que requieren permisos de administrador
router.post("/", authenticate, isVerified, isAdmin, productValidation, productController.createProduct)
router.put("/:id", authenticate, isVerified, isAdmin, productValidation, productController.updateProduct)
router.delete("/:id", authenticate, isVerified, isAdmin, productController.deleteProduct)

export default router;