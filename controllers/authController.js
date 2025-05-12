const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { findUsuario } = require("../utils/googleSheets");

const SECRET = "tu_secreto"; // poné esto en .env si querés

async function login(req, res) {
  const { username, password } = req.body;

  const user = await findUsuario(username);

  console.log(user)

  if (!user) {
    return res.status(401).json({ error: "Usuario no encontrado" });
  }

  const esValido = await bcrypt.compare(password, user.password);

  if (!esValido) {
    return res.status(401).json({ error: "Contraseña incorrecta" });
  }

  const token = jwt.sign({ username: user.username, role: user.role }, SECRET, { expiresIn: "1d" });

  res.json({ token, role: user.role });
}

module.exports = { login };
