const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const crypto = require('crypto');

const porta = 3002;
const app = express();

// Importante: Verifique se o db.js está exportando a conexão corretamente
const conexao = require('./db.js');

app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Rota de login
app.post("/login", async (req, res) => {
    try {
        let { login = "", senha = "" } = req.body;
        login = login.trim();

        if (login === "" || senha === "") {
            return res.status(400).json({ "resposta": "Preencha o login e a senha." });
        }

        // 1. Gera o Hash da senha digitada
        const hash = crypto.createHash("sha256").update(senha).digest("hex");
        
        // DEBUG: Descomente as linhas abaixo para ver o que está acontecendo no terminal
        // console.log("Tentativa de login:", login);
        // console.log("Hash gerado:", hash);

        // 2. Consulta ao banco
        // DICA: Verifique se o nome da tabela é 'login' ou 'usuarios'
        let sql = `SELECT * FROM login WHERE login = ? AND senha = ?`;
        const [resultado] = await conexao.query(sql, [login, hash]);

        if (resultado.length === 1) {
            return res.json({ 
                "resposta": "Login realizado com sucesso", 
                "usuario": resultado[0].login 
            });
        } else {
            // Se chegou aqui, o SELECT não achou o par login/senha
            return res.status(401).json({ "resposta": "Login ou senha incorretos." });
        }

    } catch (error) {
        // Se der erro de servidor, o console vai cuspir o motivo exato (ex: tabela não existe)
        console.error("ERRO CRÍTICO NO LOGIN:", error.message);
        return res.status(500).json({ "resposta": "Erro interno no servidor: " + error.message });
    }
});

// Recuperar senha - Corrigido para garantir que o hash seja salvo corretamente
app.post("/esqueci-senha", async (req, res) => {
    try {
        let { login = "", nova_senha = "" } = req.body;
        login = login.trim();

        if (login === "" || nova_senha.length < 6) {
            return res.status(400).json({ "resposta": "Preencha o login e uma senha válida (mín. 6 caracteres)." });
        }

        // Verifica se usuário existe
        let [userCheck] = await conexao.query(`SELECT * FROM login WHERE login = ?`, [login]);
        if (userCheck.length === 0) {
            return res.status(404).json({ "resposta": "Este login não existe no sistema." });
        }

        const hash = crypto.createHash("sha256").update(nova_senha).digest("hex");

        let sql = `UPDATE login SET senha = ? WHERE login = ?`;
        let [resultado] = await conexao.query(sql, [hash, login]);

        if (resultado.affectedRows === 1) {
            return res.json({ "resposta": "Senha redefinida com sucesso!" });
        } else {
            throw new Error("Não foi possível atualizar o banco.");
        }

    } catch (error) {
        console.error("ERRO RECUPERAÇÃO:", error.message);
        return res.status(500).json({ "resposta": "Erro ao redefinir senha." });
    }
});

// ROTA DE FALE CONOSCO
app.post("/enviar", async (req, res) => {
    try {
        let { nome_usuario, email, telefone, assunto, mensagem } = req.body;

        if (!nome_usuario || !email || !assunto || !mensagem) {
            return res.status(400).json({ "resposta": "Campos obrigatórios faltando." });
        }

        let sql = `INSERT INTO fale_conosco (nome_usuario, email, telefone, assunto, mensagem) VALUES (?,?,?,?,?)`;
        let [resultado] = await conexao.query(sql, [nome_usuario.trim(), email.trim(), telefone, assunto.trim(), mensagem.trim()]);

        if (resultado.affectedRows === 1) {
            return res.json({ "resposta": "Mensagem enviada com sucesso!" });
        }
    } catch (error) {
        console.error("ERRO FALE CONOSCO:", error.message);
        return res.status(500).json({ "resposta": "Erro ao salvar mensagem no banco." });
    }
});

app.listen(porta, () => {
    console.log(`Servidor rodando em http://localhost:${porta}`);
});