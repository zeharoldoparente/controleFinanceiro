// //Teste de conexão com o banco de dados
// const db = require("./src/config/database");
// db.getConnection()
//    .then(() => console.log("Conectado ao MySQL!"))
//    .catch((err) => console.error("Erro ao conectar: ", err));

const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
   res.json({ message: "API do Controle Financeiro funcionando" });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
   console.log(`Servidor rodando na porta ${PORT}`);
});
