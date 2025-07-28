import User from '../models/User.js'
import comparePassword from '../utils/security.js'
// Actualizar perfil de usuario
export const updateProfile = async (req, res, next) => {
  try {
    const userId = req.user.id
    const { name } = req.body

    await User.updateProfile(userId, { name })

    res.status(200).json({
      success: true,
      message: "Perfil actualizado correctamente",
    })
  } catch (error) {
    next(error)
  }
}

// Cambiar contraseña
export const changePassword = async (req, res, next) => {
  try {
    const userId = req.user.id
    const { currentPassword, newPassword } = req.body

    // Obtener usuario
    const user = await User.findByEmail(req.user.email)
    if (!user) {
      return res.status(404).json({ error: "Usuario no encontrado" })
    }

    // Verificar contraseña actual
    const isPasswordValid = await comparePassword(currentPassword, user.password)
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Contraseña actual incorrecta" })
    }

    // Cambiar contraseña
    await User.changePassword(userId, newPassword)

    res.status(200).json({
      success: true,
      message: "Contraseña cambiada correctamente",
    })
  } catch (error) {
    next(error)
  }
}
export default {
  changePassword,
  updateProfile
};
