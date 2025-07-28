import { sendEmail } from '../config/email.js'
import { logger } from './logger.js'

// Enviar correo de verificación
export const sendVerificationEmail = async (email, name, code) => {
  try {
    await sendEmail({
      to: email,
      subject: "Verifica tu cuenta en Carking",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Hola ${name},</h2>
          <p>Gracias por registrarte en Carking. Para completar tu registro, utiliza el siguiente código:</p>
          <div style="background-color: #f4f4f4; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;">
            ${code}
          </div>
          <p>Este código expirará en 30 minutos.</p>
          <p>Si no has solicitado este correo, puedes ignorarlo.</p>
          <p>Saludos,<br>El equipo de KingCars</p>
        </div>
      `,
    })

    logger.info(`Correo de verificación enviado a ${email}`)
    return true
  } catch (error) {
    logger.error(`Error al enviar correo de verificación a ${email}:`, error)
    throw error
  }
}

// Enviar correo de bienvenida
export const sendWelcomeEmail = async (email, name) => {
  try {
    await sendEmail({
      to: email,
      subject: "¡Bienvenido a kincar!",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">¡Bienvenido ${name}!</h2>
          <p>Gracias por unirte a kingcar. Tu cuenta ha sido creada correctamente.</p>
          <p>Ahora puedes disfrutar de todos nuestros productos y servicios.</p>
          <p>Si tienes alguna pregunta, no dudes en contactarnos.</p>
          <p>Saludos,<br>El equipo de kingcar</p>
        </div>
      `,
    })

    logger.info(`Correo de bienvenida enviado a ${email}`)
    return true
  } catch (error) {
    logger.error(`Error al enviar correo de bienvenida a ${email}:`, error)
    return false
  }
}
export default{
  sendVerificationEmail,
  sendWelcomeEmail
}