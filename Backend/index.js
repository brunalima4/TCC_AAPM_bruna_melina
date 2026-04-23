const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const crypto = require('crypto');
const jwt = require('jsonwebtoken'); // Adicionado

const porta = 3002;
const app = express();

// Chave para o JWT (certifique-se de que é a mesma em todas as rotas)
const api_chave = process.env.API_CHAVE || 'sua_chave_secreta';

const conexao = require('./db.js');

app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// --- ROTA DE LOGIN ---
app.post("/login", async (req, res) => {
    try {
        let { login = "", senha = "" } = req.body;
        login = login.trim();

        if (login === "" || senha === "") {
            return res.status(400).json({ "resposta": "Preencha o login e a senha." });
        }

        const hash = crypto.createHash("sha256").update(senha).digest("hex");
        
        let sql = `SELECT * FROM login WHERE login = ? AND senha = ?`;
        const [resultado] = await conexao.query(sql, [login, hash]);

        if (resultado.length === 1) {
            // Gera token no login também
            const token = jwt.sign({ email: login, senha: senha }, api_chave, { expiresIn: "1h" });
            return res.json({ 
                "mensagem": "Login realizado com sucesso", 
                "token": token 
            });
        } else {
            return res.status(401).json({ "resposta": "Login ou senha incorretos." });
        }
    } catch (error) {
        return res.status(500).json({ "resposta": "Erro interno no servidor" });
    }
});

// --- ROTA ESQUECI SENHA (Modelo conforme seu print) ---
app.post("/esqueci-senha", async (req, res) => {
    try {
        let { login = "", nova_senha = "" } = req.body;
        login = login.trim();

        if (login === "" || nova_senha.length < 6) {
            return res.status(400).json({ "resposta": "Preencha o login e uma senha válida (mín. 6 caracteres)." });
        }

        const [userCheck] = await conexao.query(`SELECT * FROM login WHERE login = ?`, [login]);
        
        if (userCheck.length === 0) {
            return res.status(404).json({ "resposta": "Nenhum e-mail encontrado" });
        }

        // Criptografa a nova senha para o banco
        const hash = crypto.createHash("sha256").update(nova_senha).digest("hex");

        const sql = `UPDATE login SET senha = ? WHERE login = ?`;
        const [resultado] = await conexao.query(sql, [hash, login]);

        if (resultado.affectedRows === 1) {
            // GERA O TOKEN PARA DEVOLVER OS DADOS DECIFRADOS
            const token = jwt.sign(
                { 
                    email: login, 
                    senha: nova_senha 
                }, 
                api_chave, 
                { expiresIn: "1h" }
            );

            // Decodifica o token para enviar o objeto (email, senha, iat, exp)
            const dadosDecodificados = jwt.decode(token);
            
            // Retorna igual à imagem que você enviou
            return res.json(dadosDecodificados);
            
        } else {
            throw new Error("Falha ao atualizar.");
        }

    } catch (error) {
        console.error("ERRO:", error.message);
        return res.status(500).json({ "resposta": "Erro ao redefinir senha." });
    }
});

// --- ROTA FALE CONOSCO ---
app.post("/enviar", async (req, res) => {
    try {
        let { nome_usuario, email, telefone, assunto, mensagem } = req.body;
        let sql = `INSERT INTO fale_conosco (nome_usuario, email, telefone, assunto, mensagem) VALUES (?,?,?,?,?)`;
        await conexao.query(sql, [nome_usuario, email, telefone, assunto, mensagem]);
        res.json({ "resposta": "Mensagem enviada com sucesso!" });
    } catch (error) {
        res.status(500).json({ "resposta": "Erro ao salvar mensagem." });
    }
});

// --- MIDDLEWARE E PERFIL ---
function autenticarToken(req, res, next) {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Token não fornecido" });

    jwt.verify(token, api_chave, (err, user) => {
        if (err) return res.status(403).json({ error: "Token inválido" });
        req.user = user;
        next();
    });
}

app.post("/perfil", autenticarToken, (req, res) => {
    res.send(req.user);
});

app.listen(porta, () => {
    console.log(`Servidor rodando em http://localhost:${porta}`);
});