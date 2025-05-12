const jwt = require("jsonwebtoken");
const SECRET = "tu_secreto";

function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ error: "Token no enviado" });

  const token = header.split(" ")[1];

  try {
    const user = jwt.verify(token, SECRET);
    req.user = user;
    next();
  } catch (e) {
    return res.status(401).json({ error: "Token inválido" });
  }
}

function authorize(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: "No autorizado" });
    }
    next();
  };
}

module.exports = { authenticate, authorize };
