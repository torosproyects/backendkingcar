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
export const sendRevisionEmail = async (email, name, code) => {
  try {
    await sendEmail({
      to: email,
      subject: "Tienes un carro por revisar en Carking",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Hola ${name},</h2>
          <p>Tienes un carro por revisar ${code}</p>
          <p></p>
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

// Enviar correo de notificación de estado de verificación
export const sendVerificationStatusEmail = async (email, name, estado, notas = null) => {
  try {
    let subject, message;

    // Definir asunto y mensaje según el estado
    switch (estado) {
      case 'aprobada':
        subject = "✅ Tu verificación ha sido aprobada - CarsKing";
        message = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Hola ${name},</h2>
            <p>¡Excelente noticia! Tu verificación de cuenta ha sido aprobada.</p>
            <p>Ya puedes acceder a todas las funcionalidades de CarsKing.</p>
            <p>¡Bienvenido a bordo!</p>
            <p>Saludos,<br>El equipo de CarsKing</p>
          </div>
        `;
        break;

      case 'rechazada':
        subject = "❌ Tu verificación requiere correcciones - CarsKing";
        message = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Hola ${name},</h2>
            <p>Tu solicitud de verificación ha sido rechazada por el siguiente motivo:</p>
            <div style="background-color: #f8f9fa; padding: 15px; border-left: 4px solid #dc3545; margin: 20px 0;">
              <p style="margin: 0; color: #721c24;"><strong>${notas || 'No se proporcionó motivo específico'}</strong></p>
            </div>
            <p>Por favor, corrige los documentos y envía una nueva solicitud.</p>
            <p>Saludos,<br>El equipo de CarsKing</p>
          </div>
        `;
        break;

      case 'en_revision':
        subject = "🔍 Tu verificación está en proceso - CarsKing";
        message = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Hola ${name},</h2>
            <p>Tu solicitud de verificación está siendo revisada por nuestro equipo.</p>
            <p>Te notificaremos el resultado en breve.</p>
            <p>Saludos,<br>El equipo de CarsKing</p>
          </div>
        `;
        break;

      default:
        throw new Error(`Estado de verificación no válido: ${estado}`);
    }

    // Enviar el correo
    await sendEmail({
      to: email,
      subject: subject,
      html: message,
    });

    logger.info(`Correo de estado de verificación enviado a ${email} - Estado: ${estado}`);
    return true;

  } catch (error) {
    logger.error(`Error al enviar correo de estado de verificación a ${email} - Estado: ${estado}:`, error);
    throw error;
  }
}

export default{
  sendVerificationEmail,
  sendWelcomeEmail,
  sendRevisionEmail,
  sendVerificationStatusEmail
}