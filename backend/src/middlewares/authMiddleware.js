const jwt = require("jsonwebtoken");

function authMiddleware(req, res, next) {
   try {
      const token = req.headers.authorization?.split(" ")[1];

      if (!token) {
         return res.status(401).json({ error: "Token não fornecido" });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      req.userId = decoded.id;
      req.userEmail = decoded.email;

      next();
   } catch (error) {
      return res.status(401).json({ error: "Token inválido" });
   }
}

module.exports = authMiddleware;
