const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const crypto = require('crypto');
const jwt = require('jsonwebtoken'); // Adicionado

const porta = 3002;
const app = express();

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

        const hash = crypto.createHash("sha256").update(nova_senha).digest("hex");

        const sql = `UPDATE login SET senha = ? WHERE login = ?`;
        const [resultado] = await conexao.query(sql, [hash, login]);

        if (resultado.affectedRows === 1) {
            const token = jwt.sign(
                { 
                    email: login, 
                    senha: nova_senha 
                }, 
                api_chave, 
                { expiresIn: "1h" }
            );

            const dadosDecodificados = jwt.decode(token);
            
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

// --- ROTA PRIMEIRO ACESSO ---
app.post("/primeiro-acesso", async (req, res) => {
    try {
        let { login = "" } = req.body;
        login = login.trim();

        if (login === "") {
            return res.status(400).json({ "resposta": "Informe o login." });
        }

        const [resultado] = await conexao.query(`SELECT * FROM login WHERE login = ? AND (senha IS NULL OR senha = '')`, [login]);

        if (resultado.length === 1) {
            return res.json({ "resposta": "Primeiro acesso detectado.", "login": login });
        } else {
            return res.status(403).json({ "resposta": "Login já possui senha cadastrada ou não existe." });
        }
    } catch (error) {
        console.error("ERRO:", error.message);
        return res.status(500).json({ "resposta": "Erro interno no servidor" });
    }
});

// --- ROTA COMPLETAR CADASTRO ---
app.post("/completar-cadastro", async (req, res) => {
    try {
        let { login = "", senha = "", nome_completo = "", data_nascimento = "", email = "" } = req.body;
        login = login.trim();
        senha = senha.trim();
        nome_completo = nome_completo.trim();
        email = email.trim();

        if (login === "" || senha === "" || nome_completo === "" || data_nascimento === "" || email === "") {
            return res.status(400).json({ "resposta": "Preencha todos os campos obrigatórios." });
        }

        if (senha.length < 6) {
            return res.status(400).json({ "resposta": "A senha deve ter no mínimo 6 caracteres." });
        }

        const [userCheck] = await conexao.query(`SELECT * FROM login WHERE login = ?`, [login]);
        if (userCheck.length === 0) {
            return res.status(404).json({ "resposta": "Login não encontrado." });
        }

        const hash = crypto.createHash("sha256").update(senha).digest("hex");

        await conexao.query(`UPDATE login SET senha = ? WHERE login = ?`, [hash, login]);

        await conexao.query(
            `INSERT INTO contribuintes (nome_completo, email, senha, data_nascimento) VALUES (?, ?, ?, ?)`,
            [nome_completo, email, hash, data_nascimento]
        );

        return res.json({ "resposta": "Cadastro completado com sucesso!" });
    } catch (error) {
        console.error("ERRO:", error.message);
        return res.status(500).json({ "resposta": "Erro ao completar cadastro." });
    }
});

// --- ROTAS DE EVENTOS ---

// Listar todos os eventos
app.get("/eventos", async (req, res) => {
    try {
        const [resultado] = await conexao.query(`SELECT * FROM eventos ORDER BY data ASC`);
        res.json(resultado);
    } catch (error) {
        console.error("ERRO:", error.message);
        return res.status(500).json({ "resposta": "Erro ao buscar eventos." });
    }
});

// Obter um evento por ID
app.get("/eventos/:id", async (req, res) => {
    try {
        const [resultado] = await conexao.query(`SELECT * FROM eventos WHERE id = ?`, [req.params.id]);
        if (resultado.length === 1) {
            res.json(resultado[0]);
        } else {
            res.status(404).json({ "resposta": "Evento não encontrado." });
        }
    } catch (error) {
        console.error("ERRO:", error.message);
        return res.status(500).json({ "resposta": "Erro ao buscar evento." });
    }
});

// Criar novo evento
app.post("/eventos", async (req, res) => {
    try {
        let { titulo = "", data = "", hora = "", local = "", icone = "🔔", tipo = "Geral" } = req.body;
        titulo = titulo.trim();
        local = local.trim();

        if (titulo === "" || data === "" || hora === "" || local === "") {
            return res.status(400).json({ "resposta": "Preencha todos os campos obrigatórios." });
        }

        const [resultado] = await conexao.query(
            `INSERT INTO eventos (titulo, data, hora, local, icone, tipo) VALUES (?, ?, ?, ?, ?, ?)`,
            [titulo, data, hora, local, icone, tipo]
        );

        res.json({ "resposta": "Evento criado com sucesso!", "id": resultado.insertId });
    } catch (error) {
        console.error("ERRO:", error.message);
        return res.status(500).json({ "resposta": "Erro ao criar evento." });
    }
});

// Atualizar evento
app.put("/eventos/:id", async (req, res) => {
    try {
        let { titulo = "", data = "", hora = "", local = "", icone = "🔔", tipo = "Geral" } = req.body;
        titulo = titulo.trim();
        local = local.trim();

        if (titulo === "" || data === "" || hora === "" || local === "") {
            return res.status(400).json({ "resposta": "Preencha todos os campos obrigatórios." });
        }

        const [resultado] = await conexao.query(
            `UPDATE eventos SET titulo = ?, data = ?, hora = ?, local = ?, icone = ?, tipo = ? WHERE id = ?`,
            [titulo, data, hora, local, icone, tipo, req.params.id]
        );

        if (resultado.affectedRows === 1) {
            res.json({ "resposta": "Evento atualizado com sucesso!" });
        } else {
            res.status(404).json({ "resposta": "Evento não encontrado." });
        }
    } catch (error) {
        console.error("ERRO:", error.message);
        return res.status(500).json({ "resposta": "Erro ao atualizar evento." });
    }
});

// Deletar evento
app.delete("/eventos/:id", async (req, res) => {
    try {
        const [resultado] = await conexao.query(`DELETE FROM eventos WHERE id = ?`, [req.params.id]);
        if (resultado.affectedRows === 1) {
            res.json({ "resposta": "Evento removido com sucesso!" });
        } else {
            res.status(404).json({ "resposta": "Evento não encontrado." });
        }
    } catch (error) {
        console.error("ERRO:", error.message);
        return res.status(500).json({ "resposta": "Erro ao remover evento." });
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
