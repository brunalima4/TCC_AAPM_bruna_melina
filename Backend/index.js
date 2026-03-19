const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const crypto = require('crypto');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger.json');

const app = express();
const porta = 3002;

// Configurações de Banco de Dados
const conexao = require('./db.js');

// Middlewares
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// --- CONFIGURAÇÃO DO SWAGGER ---
// Deve vir após a inicialização do app
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// --- ROTAS ---

/**
 * @route POST /login
 * @description Realiza a autenticação do usuário
 */
app.post("/login", async (req, res) => {
    try {
        let { login = "", senha = "" } = req.body;
        login = login.trim();

        if (login === "" || senha === "") {
            return res.status(400).json({ "resposta": "Preencha o login e a senha." });
        }

        const hash = crypto.createHash("sha256").update(senha).digest("hex");
        const sql = `SELECT * FROM login WHERE login = ? AND senha = ?`;
        const [resultado] = await conexao.query(sql, [login, hash]);

        if (resultado.length === 1) {
            return res.status(200).json({ "resposta": "Login realizado com sucesso", "usuario": resultado[0].login });
        } else {
            return res.status(401).json({ "resposta": "Login ou senha incorretos." });
        }
    } catch (error) {
        console.error("Erro na rota de Login:", error);
        return res.status(500).json({ "resposta": "Erro interno no servidor." });
    }
});

/**
 * @route POST /esqueci-senha
 * @description Redefine a senha do usuário
 */
app.post("/esqueci-senha", async (req, res) => {
    try {
        let { login = "", nova_senha = "" } = req.body;
        login = login.trim();

        if (login === "" || nova_senha.length < 6) {
            return res.status(400).json({ "resposta": "Preencha o login e uma nova senha válida (mín. 6 caracteres)." });
        }

        const [resultado] = await conexao.query(`SELECT * FROM login WHERE login = ?`, [login]);
        if (resultado.length === 0) {
            return res.status(404).json({ "resposta": "Login não encontrado." });
        }

        const hash = crypto.createHash("sha256").update(nova_senha).digest("hex");
        const [resultado2] = await conexao.query(`UPDATE login SET senha = ? WHERE login = ?`, [hash, login]);

        if (resultado2.affectedRows === 1) {
            return res.status(200).json({ "resposta": "Senha redefinida com sucesso! Você já pode fazer login." });
        } else {
            return res.status(500).json({ "resposta": "Erro ao atualizar a senha." });
        }
    } catch (error) {
        console.error("Erro na rota de Recuperação de Senha:", error);
        return res.status(500).json({ "resposta": "Erro interno no servidor." });
    }
});

/**
 * @route POST /enviar
 * @description Salva mensagem do Fale Conosco
 */
app.post("/enviar", async (req, res) => {
    try {
        let { nome_usuario, email, telefone, assunto, mensagem } = req.body;

        // Limpeza simples
        nome_usuario = nome_usuario?.trim() || "";
        email = email?.trim() || "";
        assunto = assunto?.trim() || "";
        mensagem = mensagem?.trim() || "";

        if (nome_usuario.length < 3 || !email.includes('@') || assunto.length < 6 || mensagem.length < 6) {
            return res.status(400).json({ "resposta": "Dados inválidos. Verifique os campos e tente novamente." });
        }

        const sql = `INSERT INTO fale_conosco(nome_usuario, email, telefone, assunto, mensagem) VALUES (?,?,?,?,?)`;
        const [resultado] = await conexao.query(sql, [nome_usuario, email, telefone, assunto, mensagem]);

        if (resultado.affectedRows === 1) {
            return res.status(201).json({ "resposta": "Mensagem enviada com sucesso!" });
        } else {
            return res.status(500).json({ "resposta": "Erro ao enviar mensagem!" });
        }
    } catch (error) {
        console.error("Erro na rota de Enviar Mensagem:", error);
        return res.status(500).json({ "resposta": "Erro interno no servidor." });
    }
});

app.listen(porta, () => {
    console.log(`Servidor unificado funcionando na porta ${porta}`);
    console.log(`Documentação disponível em: http://localhost:${porta}/api-docs`);
});