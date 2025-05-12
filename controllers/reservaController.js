const { appendReservaToGoogleSheets, getReservasDesdeSheets } = require("../utils/googleSheets");

async function getReservas(req, res) {
  const reservas = await getReservasDesdeSheets();
  res.json(reservas);
}

async function createReserva(req, res) {
  const nuevaReserva = {
    usuario: req.user.username,
    ...req.body
  };

  await appendReservaToGoogleSheets(nuevaReserva);

  res.status(201).json(nuevaReserva);
}

module.exports = { getReservas, createReserva };
