import nodemailer from "nodemailer";

const emailConfig = {
  host: process.env.EMAIL_HOST || "smtp.gmail.com",
  port: Number.parseInt(process.env.EMAIL_PORT || "587"),
  secure: process.env.EMAIL_SECURE === "true",
  auth: {
    user: process.env.EMAIL_USER || "tu-correo@gmail.com",
    pass: process.env.EMAIL_PASSWORD || "tu-contraseña",
  },
};

const from = process.env.EMAIL_FROM || "KC <no-reply@carsKing.com>";

// Crear transporter
const transporter = nodemailer.createTransport(emailConfig);

// Verificar configuración
export async function verifyEmailConfig() {
  try {
    await transporter.verify();
    console.log("Servidor de correo configurado correctamente");
    return true;
  } catch (error) {
    console.error("Error en la configuración del servidor de correo:", error);
    return false;
  }
}

// Enviar email
export async function sendEmail(options) {
  try {
    const mailOptions = {
      from: from,
      to: options.to,
      subject: options.subject,
      html: options.html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Email enviado:", info.messageId);
    return info;
  } catch (error) {
    console.error("Error al enviar email:", error);
    throw error;
  }
}

// Exportación por defecto para compatibilidad
export default {
  sendEmail,
  verifyEmailConfig,
};