const User = require("../models/User");
const jwt = require("jsonwebtoken");

class AuthController {
   static async register(req, res) {
      try {
         const { nome, email, senha } = req.body;

         if (!nome || !email || !senha) {
            return res
               .status(400)
               .json({ error: "Todos os campos são obrigatórios" });
         }

         const usuarioExiste = await User.findByEmail(email);
         if (usuarioExiste) {
            return res.status(400).json({ error: "Email já cadastrado" });
         }

         const userId = await User.create(nome, email, senha);

         res.status(201).json({
            message: "Usuário criado com sucesso!",
            userId,
         });
      } catch (error) {
         console.error(error);
         res.status(500).json({ error: "Erro ao criar usuário" });
      }
   }
   static async login(req, res) {
      try {
         const { email, senha } = req.body;

         if (!email || !senha) {
            return res
               .status(400)
               .json({ error: "Email e senha são obrigatórios" });
         }

         const user = await User.findByEmail(email);
         if (!user) {
            return res.status(401).json({ error: "Email ou senha inválidos" });
         }

         const senhaValida = await User.verificarSenha(senha, user.senha);
         if (!senhaValida) {
            return res.status(401).json({ error: "Email ou senha inválidos" });
         }

         const token = jwt.sign(
            { id: user.id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: "7d" },
         );

         res.json({
            message: "Login realizado com sucesso!",
            token,
            user: {
               id: user.id,
               nome: user.nome,
               email: user.email,
            },
         });
      } catch (error) {
         console.error(error);
         res.status(500).json({ error: "Erro ao fazer login" });
      }
   }
}
module.exports = AuthController;
