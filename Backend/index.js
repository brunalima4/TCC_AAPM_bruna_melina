const express = require('express')
const cors = require('cors')
const mysql = require('mysql2/promise')
const crypto = require('crypto')

const porta = 3002 
const app = express() 

const conexao = require('./db.js') 

app.use(cors({
    origin: '*', 
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json())

// Rota de login
app.post("/login", async (req, res) => {
    try {
        let { login = "", senha = "" } = req.body;
        login = login.trim();

        if (login === "" || senha === "") {
            return res.status(400).json({ "resposta": "Preencha o login e a senha." });
        }

        const hash = crypto.createHash("sha256").update(senha).digest("hex");

        let sql = `SELECT * FROM login WHERE login = ? AND senha = ?`;
        let [resultado] = await conexao.query(sql, [login, hash]);

        if (resultado.length === 1) {
            return res.json({ "resposta": "Login realizado com sucesso", "usuario": resultado[0].login });
        } else {
            return res.status(401).json({ "resposta": "Login ou senha incorretos." });
        }

    } catch (error) {
        console.error("Erro na rota de Login:", error);
        return res.status(500).json({ "resposta": "Erro interno no servidor." });
    }
});

// Recuperar senha
app.post("/esqueci-senha", async (req, res) => {
    try {
        let { login = "", nova_senha = "" } = req.body;
        login = login.trim();

        if (login === "" || nova_senha.length < 6) {
            return res.status(400).json({ "resposta": "Preencha o login e uma nova senha válida (mín. 6 caracteres)." });
        }

        let sql = `SELECT * FROM login WHERE login = ?`;
        let [resultado] = await conexao.query(sql, [login]);
        if (resultado.length === 0) {
            return res.status(404).json({ "resposta": "Login não encontrado." });
        }

        const hash = crypto.createHash("sha256").update(nova_senha).digest("hex");

        sql = `UPDATE login SET senha = ? WHERE login = ?`;
        let [resultado2] = await conexao.query(sql, [hash, login]);

        if (resultado2.affectedRows === 1) {
            return res.json({ "resposta": "Senha redefinida com sucesso! Você já pode fazer login." });
        } else {
            return res.status(500).json({ "resposta": "Erro ao atualizar a senha." });
        }

    } catch (error) {
        console.error("Erro na rota de Recuperação de Senha:", error);
        return res.status(500).json({ "resposta": "Erro interno no servidor." });
    }
});

// incluir o novo ID
const QUADROS = ['quadro-login', 'quadro-recuperacao', 'quadro-contato', 'quadro-associe'];

// Mudar página
function mudarParaQuadroAssocie() { 
    mudarParaQuadro('quadro-associe'); 
}



// ROTA DE FALE CONOSCO 
app.post("/enviar", async (req,res) =>{
    try {
        let {nome_usuario, email, telefone, assunto, mensagem} = req.body

        nome_usuario = nome_usuario ? nome_usuario.trim() : "";
        email = email ? email.trim() : "";
        assunto = assunto ? assunto.trim() : "";
        mensagem = mensagem ? mensagem.trim() : ""; 
        
        if(nome_usuario.length < 3){
            return res.status(400).json({"resposta":"Preencha seu nome completo (mínimo 3 caracteres)"})
        }else if(email.length <= 5 || !email.includes('@')){ 
            return res.status(400).json({"resposta":"Preencha um e-mail válido"})
        }else if(assunto.length < 6){
            return res.status(400).json({"resposta":"O assunto deve ter pelo menos 6 caracteres"})
        }else if(mensagem.length < 6){ 
            return res.status(400).json({"resposta":"A mensagem deve ter pelo menos 6 caracteres"})
        }
        
        let sql = `INSERT INTO fale_conosco(nome_usuario, email, telefone, assunto, mensagem) VALUES (?,?,?,?,?)`
        let [resultado2] = await conexao.query(sql, [nome_usuario, email, telefone, assunto, mensagem])

        if(resultado2.affectedRows == 1){
            return res.json({"resposta":"Mensagem enviada com sucesso!"})
        }else{
            return res.status(500).json({"resposta":"Erro ao enviar mensagem!"})
        }

    } catch (error) {
        console.error("Erro na rota de Enviar Mensagem:", error);
        return res.status(500).json({ "resposta": "Erro interno no servidor." });
    }
})

app.listen(porta,()=>{
    console.log(`Servidor unificado funcionando na porta ${porta}`)
})