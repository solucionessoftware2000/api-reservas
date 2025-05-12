const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const { loadGoogleSheetsData, appendUsuariosSiNoExisten } = require("./utils/googleSheets");
const authController = require("./controllers/authController");
const reservaController = require("./controllers/reservaController");
const { authenticate, authorize } = require("./middleware/auth");
require('dotenv').config();


async function init() {
  await loadGoogleSheetsData(); // si aún lo usás para reservas

  await appendUsuariosSiNoExisten(); // la nueva función
}

init();

const app = express();

// Configuración de CORS
app.use(cors({
  origin: "http://localhost:5173", // Permite solo este origen
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true               // Si necesitas enviar cookies o headers de auth
}));

app.use(bodyParser.json());

app.post("/api/auth/login", authController.login);

app.get("/api/reservas", authenticate, reservaController.getReservas);
app.post("/api/reservas", authenticate, authorize("admin"), reservaController.createReserva);

const puerto = process.env.PORT || 3001;

app.listen(puerto, () => console.log("Server listening en puerto 3001"));
