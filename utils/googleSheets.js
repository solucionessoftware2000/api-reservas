const { google } = require("googleapis");
const path = require("path");
const bcrypt = require("bcrypt");

// Ruta donde se guardará el archivo generado
const credPath = path.join(__dirname, "../config/credenciales.json");

// ✅ Generar el archivo dinámicamente desde la variable de entorno
const jsonCreds = process.env.GOOGLE_CREDENTIALS;

if (jsonCreds && !fs.existsSync(credPath)) {
  fs.mkdirSync(path.dirname(credPath), { recursive: true }); // por si la carpeta no existe
  fs.writeFileSync(credPath, jsonCreds);
}

// ✅ Luego inicializas GoogleAuth como siempre
const auth = new google.auth.GoogleAuth({
  keyFile: credPath,
  scopes: ["https://www.googleapis.com/auth/spreadsheets"]
});

const sheets = google.sheets({ version: "v4", auth });

const SPREADSHEET_ID = "14kKRqByjpwrdglfF7V33x_eWGNrbuLAxfnZq0X2xe68";
const SHEET_USUARIOS = "usuarios";
const SHEET_RESERVAS = "reservas";

// Leer y mostrar datos desde Sheets (sin guardar en DB)
async function loadGoogleSheetsData() {
  try {
    const resUsuarios = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_USUARIOS}!A2:C`
    });

    const resReservas = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_RESERVAS}!A2:L`
    });

    console.log("Usuarios cargados:", resUsuarios.data.values?.length || 0);
    console.log("Reservas cargadas:", resReservas.data.values?.length || 0);
  } catch (error) {
    console.error("Error al cargar datos de Google Sheets:", error);
  }
}

async function saveDataToGoogleSheets() {
  // Esta función no es necesaria si ya estás leyendo directamente desde Sheets
  console.log("Ya no se guarda en DB local, todo va directo a Google Sheets.");
}

async function appendReservaToGoogleSheets(reserva) {
  try {
    const nuevaFila = [[
      reserva.usuario,
      reserva.fecha,
      reserva.horario,
      reserva.origen,
      reserva.destino,
      reserva.pasajero,
      reserva.contacto,
      reserva.numPasajeros,
      reserva.valor,
      reserva.medioPago,
      reserva.referencia
    ]];

    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_RESERVAS}!A2`,
      valueInputOption: "USER_ENTERED",
      insertDataOption: "INSERT_ROWS",
      requestBody: { values: nuevaFila }
    });

    console.log("Reserva agregada a Google Sheets.");
  } catch (error) {
    console.error("Error al agregar reserva a Google Sheets:", error);
  }
}

async function getReservasDesdeSheets() {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_RESERVAS}!A2:L`
  });

  const valores = res.data.values || [];

  return valores.map(fila => ({
    usuario: fila[0],
    fecha: fila[1],
    horario: fila[2],
    origen: fila[3],
    destino: fila[4],
    pasajero: fila[5],
    contacto: fila[6],
    numPasajeros: Number(fila[7]),
    valor: Number(fila[8]),
    medioPago: fila[9],
    referencia: fila[10]
  }));
}

async function getUsuariosDesdeSheets() {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_USUARIOS}!A2:C`
  });

  const filas = res.data.values || [];

  return filas.map(([username, password, role]) => ({
    username,
    password,
    role
  }));
}

async function findUsuario(username) {
  const usuarios = await getUsuariosDesdeSheets();
  return usuarios.find(u => u.username === username);
}

async function appendUsuariosSiNoExisten() {
  const usuarios = await getUsuariosDesdeSheets();
  const nombres = usuarios.map(u => u.username);
  const nuevosUsuarios = [];

  if (!nombres.includes("admin")) {
    const hash = await bcrypt.hash("123", 10);
    nuevosUsuarios.push(["admin", hash, "admin"]);
  }

  if (!nombres.includes("taxista")) {
    const hash = await bcrypt.hash("123", 10);
    nuevosUsuarios.push(["taxista", hash, "taxista"]);
  }

  if (nuevosUsuarios.length > 0) {
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_USUARIOS}!A2`, // <- Esto obliga a empezar desde A2
      valueInputOption: "USER_ENTERED",
      insertDataOption: "INSERT_ROWS",
      requestBody: { values: nuevosUsuarios }
    });

    console.log("Usuarios admin/taxista creados en Google Sheets.");
  } else {
    console.log("Usuarios admin/taxista ya existen en Google Sheets.");
  }
}

module.exports = {
  loadGoogleSheetsData,
  saveDataToGoogleSheets,
  appendReservaToGoogleSheets,
  getReservasDesdeSheets,
  getUsuariosDesdeSheets,
  findUsuario,
  appendUsuariosSiNoExisten
};
