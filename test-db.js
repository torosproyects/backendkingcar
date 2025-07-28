import 'dotenv/config'; // Configura las variables de entorno
import db from './config/database.js'; // Ajusta la ruta según tu estructura

async function runTest() {
  console.log("Iniciando prueba de conexión...");
  
  try {
    const isConnected = await db.testConnection();
    if (isConnected) {
      console.log("✅ Conexión exitosa con la base de datos");
      process.exit(0); // Código 0 indica éxito
    } else {
      console.log("❌ Falló la conexión a la base de datos");
      process.exit(1); // Código diferente de 0 indica error
    }
  } catch (error) {
    console.error("❌ Error durante la prueba de conexión:", error.message);
    process.exit(1);
  }
}

runTest();