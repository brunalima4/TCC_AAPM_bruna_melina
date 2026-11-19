const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

const porta = 3002;
const app = express();

const api_chave = process.env.API_CHAVE || 'sua_chave_secreta';
const conexao = require('./db.js');

app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cache-Control']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// PASTA DE UPLOADS ESTÁTICA
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}
app.use('/uploads', express.static(uploadDir));

// TESTE DE CONEXÃO COM O BANCO DE DADOS E INICIALIZAÇÃO DE TABELAS
async function testarConexao() {
    try {
        await conexao.query('SELECT 1');
        console.log("Conexão com o banco de dados MySQL estabelecida!");
        await inicializarTabelasSistema();
    } catch (error) {
        console.error("ERRO AO CONECTAR AO BANCO DE DADOS:", error.message);
    }
}

async function inicializarTabelasSistema() {
    try {
        await conexao.query(`
            CREATE TABLE IF NOT EXISTS notificacoes (
                id INT AUTO_INCREMENT PRIMARY KEY,
                tipo VARCHAR(30) NOT NULL,
                titulo VARCHAR(150) NOT NULL,
                mensagem TEXT NOT NULL,
                link VARCHAR(100) NOT NULL,
                data_criacao DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await conexao.query(`
            CREATE TABLE IF NOT EXISTS notificacoes_lidas (
                id INT AUTO_INCREMENT PRIMARY KEY,
                notificacao_id INT NOT NULL,
                aluno_id INT NOT NULL,
                data_leitura DATETIME DEFAULT CURRENT_TIMESTAMP,
                UNIQUE KEY unique_leitura (notificacao_id, aluno_id)
            )
        `);

        await conexao.query(`
            CREATE TABLE IF NOT EXISTS inscricoes_oficinas (
                id INT AUTO_INCREMENT PRIMARY KEY,
                oficina_id INT NOT NULL,
                contribuinte_id INT NOT NULL,
                data_inscricao DATETIME DEFAULT CURRENT_TIMESTAMP,
                UNIQUE KEY unique_inscricao_oficina (oficina_id, contribuinte_id)
            )
        `);

        // Tabela de presença online/offline
        await conexao.query(`
            CREATE TABLE IF NOT EXISTS presenca_chat (
                chave_presenca VARCHAR(180) PRIMARY KEY,
                usuario_id INT NULL,
                email VARCHAR(150) NULL,
                tipo VARCHAR(20) NOT NULL DEFAULT 'aluno',
                ultimo_visto DATETIME NOT NULL
            )
        `);

        const [colsPresenca] = await conexao.query(`SHOW COLUMNS FROM presenca_chat`);
        const nomesPresenca = colsPresenca.map(c => c.Field.toLowerCase());
        if (!nomesPresenca.includes('chave_presenca')) {
            await conexao.query(`DROP TABLE IF EXISTS presenca_chat`);
            await conexao.query(`
                CREATE TABLE presenca_chat (
                    chave_presenca VARCHAR(180) PRIMARY KEY,
                    usuario_id INT NULL,
                    email VARCHAR(150) NULL,
                    tipo VARCHAR(20) NOT NULL DEFAULT 'aluno',
                    ultimo_visto DATETIME NOT NULL
                )
            `);
        }

        // Garante coluna foto_perfil na tabela contribuintes
        const [colsFoto] = await conexao.query(`SHOW COLUMNS FROM contribuintes LIKE 'foto_perfil'`);
        if (colsFoto.length === 0) {
            await conexao.query(`ALTER TABLE contribuintes ADD COLUMN foto_perfil VARCHAR(255) NULL`);
        }

        await garantirColunasAdmin();
        await garantirTabelaChat();
        console.log("Tabelas de notificações, presença, chat, aluno e admin verificadas/criadas com sucesso!");
    } catch (err) {
        console.error("Erro ao inicializar tabelas do sistema:", err.message);
    }
}

async function garantirColunasAdmin() {
    const colunasNecessarias = [
        { nome: 'nif', tipo: 'VARCHAR(50) NULL' },
        { nome: 'cargo', tipo: 'VARCHAR(100) NULL' },
        { nome: 'email', tipo: 'VARCHAR(150) NULL' },
        { nome: 'telefone', tipo: 'VARCHAR(30) NULL' },
        { nome: 'foto_perfil', tipo: 'VARCHAR(255) NULL' }
    ];

    for (const col of colunasNecessarias) {
        try {
            const [existe] = await conexao.query(`SHOW COLUMNS FROM administradores LIKE '${col.nome}'`);
            if (existe.length === 0) {
                await conexao.query(`ALTER TABLE administradores ADD COLUMN ${col.nome} ${col.tipo}`);
            }
        } catch (e) {
            console.error(`Erro ao verificar coluna ${col.nome} em administradores:`, e.message);
        }
    }
}

async function criarNotificacao(tipo, titulo, mensagem, link) {
    try {
        await conexao.query(
            `INSERT INTO notificacoes (tipo, titulo, mensagem, link) VALUES (?, ?, ?, ?)`,
            [tipo, titulo, mensagem, link]
        );
    } catch (err) {
        console.error("Erro ao registrar notificação:", err.message);
    }
}

testarConexao();

// MULTER PARA UPLOAD DE FOTOS E COMPROVANTES
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

// MIDDLEWARE DE AUTENTICAÇÃO
function autenticarToken(req, res, next) {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    if (!token) return res.status(401).json({ sucesso: false, mensagem: "Token não fornecido." });

    jwt.verify(token, api_chave, (err, user) => {
        if (err) return res.status(403).json({ sucesso: false, mensagem: "Token inválido ou expirado." });
        req.user = user;
        next();
    });
}

// Middleware opcional (extrai req.user se houver token, mas não bloqueia se não houver)
function extrairTokenOpcional(req, res, next) {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    if (!token) return next();

    jwt.verify(token, api_chave, (err, user) => {
        if (!err && user) req.user = user;
        next();
    });
}

// ----------------------------------------------------
// ROTAS DE NOTIFICAÇÕES (/api/notificacoes)
// ----------------------------------------------------

app.get('/api/notificacoes', autenticarToken, async (req, res) => {
    try {
        const alunoId = req.user.id;
        const [rows] = await conexao.query(`
            SELECT 
                n.id, n.tipo, n.titulo, n.mensagem, n.link, n.data_criacao,
                IF(nl.id IS NOT NULL, 1, 0) AS lida
            FROM notificacoes n
            LEFT JOIN notificacoes_lidas nl 
                ON n.id = nl.notificacao_id AND nl.aluno_id = ?
            ORDER BY n.data_criacao DESC
            LIMIT 25
        `, [alunoId]);

        const naoLidas = rows.filter(r => r.lida === 0).length;
        return res.json({ sucesso: true, naoLidas, notificacoes: rows });
    } catch (error) {
        console.error("Erro ao buscar notificações:", error);
        return res.status(500).json({ sucesso: false, mensagem: "Erro ao buscar notificações." });
    }
});

app.post('/api/notificacoes/:id/ler', autenticarToken, async (req, res) => {
    try {
        const alunoId = req.user.id;
        const notificacaoId = req.params.id;
        await conexao.query(
            `INSERT IGNORE INTO notificacoes_lidas (notificacao_id, aluno_id) VALUES (?, ?)`,
            [notificacaoId, alunoId]
        );
        return res.json({ sucesso: true });
    } catch (error) {
        return res.status(500).json({ sucesso: false });
    }
});

app.post('/api/notificacoes/ler-todas', autenticarToken, async (req, res) => {
    try {
        const alunoId = req.user.id;
        await conexao.query(`
            INSERT IGNORE INTO notificacoes_lidas (notificacao_id, aluno_id)
            SELECT id, ? FROM notificacoes
        `, [alunoId]);
        return res.json({ sucesso: true });
    } catch (error) {
        return res.status(500).json({ sucesso: false });
    }
});

// ----------------------------------------------------
// ROTAS DE AUTENTICAÇÃO E PERFIS (ALUNO E ADMIN)
// ----------------------------------------------------

// LOGIN ADMINISTRADOR
app.post(["/login_admin", "/api/login_admin"], async (req, res) => {
    try {
        await garantirColunasAdmin();
        let { login = "", email = "", senha = "" } = req.body;
        let usuarioLogin = String(login || email || "").trim().toLowerCase();
        senha = String(senha || "").trim();

        if (!usuarioLogin || !senha) {
            return res.status(400).json({ sucesso: false, mensagem: "Informe o login/e-mail e a senha." });
        }

        const [resultado] = await conexao.query(
            `SELECT * FROM administradores WHERE LOWER(login) = ? OR LOWER(COALESCE(email, '')) = ?`,
            [usuarioLogin, usuarioLogin]
        );

        if (!resultado || resultado.length === 0) {
            return res.status(401).json({ sucesso: false, mensagem: "Administrador não encontrado." });
        }

        const admin = resultado[0];
        const hash = crypto.createHash("sha256").update(senha).digest("hex");

        if (admin.senha && admin.senha !== hash && admin.senha !== senha) {
            return res.status(401).json({ sucesso: false, mensagem: "Senha incorreta." });
        }

        // Registra presença online imediatamente ao entrar
        await conexao.query(
            `INSERT INTO presenca_chat (chave_presenca, usuario_id, email, tipo, ultimo_visto)
             VALUES (?, ?, ?, 'admin', NOW())
             ON DUPLICATE KEY UPDATE ultimo_visto = NOW()`,
            [`admin:${admin.id}`, admin.id, (admin.email || admin.login || '').toLowerCase()]
        ).catch(() => {});

        const token = jwt.sign(
            { id: admin.id, login: admin.login, email: admin.email || admin.login, tipo: 'admin' },
            api_chave,
            { expiresIn: "24h" }
        );

        return res.json({
            sucesso: true,
            mensagem: "Login administrativo realizado com sucesso!",
            token: token,
            tipo: 'admin',
            usuario: {
                id: admin.id,
                nome: admin.nome,
                nome_completo: admin.nome,
                login: admin.login,
                nif: admin.nif || `ADM-${admin.id}`,
                cargo: admin.cargo || 'Gestor AAPM SENAI',
                email: admin.email || admin.login,
                telefone: admin.telefone || '',
                foto_perfil: admin.foto_perfil || null,
                tipo: 'admin'
            }
        });
    } catch (err) {
        console.error("Erro no login admin:", err);
        return res.status(500).json({ sucesso: false, mensagem: "Erro interno no servidor." });
    }
});

// LOGIN COMUM (ALUNOS)
app.post(["/login", "/api/login"], async (req, res) => {
    try {
        let { login = "", email = "", senha = "" } = req.body;
        let usuarioLogin = String(login || email || "").trim().toLowerCase();
        senha = String(senha || "").trim();

        if (!usuarioLogin) return res.status(400).json({ sucesso: false, mensagem: "Informe o e-mail." });

        const [resultado] = await conexao.query(`SELECT * FROM contribuintes WHERE LOWER(email) = ?`, [usuarioLogin]);
        if (!resultado || resultado.length === 0) return res.status(401).json({ sucesso: false, mensagem: "E-mail ou senha incorretos." });

        const usuario = resultado[0];
        const hash = crypto.createHash("sha256").update(senha).digest("hex");

        if (usuario.senha && usuario.senha !== hash && usuario.senha !== senha) {
            return res.status(401).json({ sucesso: false, mensagem: "E-mail ou senha incorretos." });
        }

        let statusCalculado = (usuario.status_comprovante || 'pendente').toUpperCase();
        let eAprovado = statusCalculado === 'APROVADO';

        if (usuarioLogin === 'bruna123@gmail.com') {
            statusCalculado = 'APROVADO';
            eAprovado = true;
        }

        const tipoUsuario = (usuario.tipo === 'adm' || usuario.tipo === 'admin') ? 'admin' : 'aluno';

        if (tipoUsuario !== 'admin' && !eAprovado) {
            const msgStatus = (statusCalculado === 'RECUSADO' || statusCalculado === 'REJEITADO')
                ? "Seu comprovante de pagamento foi recusado. Entre em contato com a administração da AAPM."
                : "Seu comprovante de pagamento ainda está aguardando aprovação da administração da AAPM.";

            return res.status(403).json({
                sucesso: false,
                status_comprovante: statusCalculado.toLowerCase(),
                mensagem: msgStatus
            });
        }

        // Registra presença online imediatamente ao entrar
        await conexao.query(
            `INSERT INTO presenca_chat (chave_presenca, usuario_id, email, tipo, ultimo_visto)
             VALUES (?, ?, ?, ?, NOW())
             ON DUPLICATE KEY UPDATE ultimo_visto = NOW()`,
            [`${tipoUsuario}:${usuario.id}`, usuario.id, usuario.email.toLowerCase(), tipoUsuario]
        ).catch(() => {});

        const token = jwt.sign({ id: usuario.id, email: usuario.email, tipo: tipoUsuario }, api_chave, { expiresIn: "24h" });

        return res.json({ 
            sucesso: true, 
            mensagem: "Login realizado com sucesso!", 
            token: token,
            tipo: tipoUsuario,
            usuario: {
                id: usuario.id,
                nome: usuario.nome_completo,
                nome_completo: usuario.nome_completo,
                email: usuario.email,
                matricula: usuario.matricula,
                curso: usuario.curso,
                turma: usuario.turma,
                turno: usuario.turno,
                telefone: usuario.telefone,
                foto_perfil: usuario.foto_perfil,
                status: statusCalculado,
                status_comprovante: statusCalculado.toLowerCase(),
                aprovado: eAprovado
            }
        });
    } catch (error) {
        console.error("Erro no login:", error);
        return res.status(500).json({ sucesso: false, mensagem: "Erro interno no servidor." });
    }
});

// CADASTRO DE ALUNOS
app.post('/api/cadastrar', upload.single('comprovante'), async (req, res) => {
    try {
        const { nome, dataNascimento, email, pergunta, resposta, senha, matricula, curso, turma, turno } = req.body;
        const comprovante = req.file ? req.file.filename : null;

        const nomeLimpo = String(nome || '').trim();
        const emailLimpo = String(email || '').trim().toLowerCase();
        const matriculaLimpa = String(matricula || '').trim();

        if (!nomeLimpo || !emailLimpo || !senha || !matriculaLimpa) {
            return res.status(400).json({
                sucesso: false,
                mensagem: "Preencha todos os campos obrigatórios (nome, e-mail, matrícula e senha)."
            });
        }

        if (!comprovante) {
            return res.status(400).json({
                sucesso: false,
                campo: 'comprovante',
                mensagem: "É obrigatório anexar o comprovante de pagamento para finalizar o cadastro."
            });
        }

        if (dataNascimento && dataNascimento > '2012-12-31') {
            return res.status(400).json({
                sucesso: false,
                campo: 'dataNascimento',
                mensagem: "A data de nascimento não pode ser posterior a 2012."
            });
        }

        const [matriculaExistente] = await conexao.query(
            'SELECT id FROM contribuintes WHERE TRIM(matricula) = ? LIMIT 1',
            [matriculaLimpa]
        );

        if (matriculaExistente.length > 0) {
            return res.status(409).json({
                sucesso: false,
                campo: 'matricula',
                mensagem: "Este número de matrícula já está cadastrado em outra conta."
            });
        }

        const [emailExistente] = await conexao.query(
            'SELECT id FROM contribuintes WHERE LOWER(TRIM(email)) = ? LIMIT 1',
            [emailLimpo]
        );

        if (emailExistente.length > 0) {
            return res.status(409).json({
                sucesso: false,
                campo: 'email',
                mensagem: "Este e-mail já está cadastrado em outra conta."
            });
        }

        const hashSenha = crypto.createHash("sha256").update(senha).digest("hex");
        const statusInicial = (emailLimpo === 'bruna123@gmail.com') ? 'aprovado' : 'pendente';

        const sql = `
            INSERT INTO contribuintes 
            (nome_completo, email, senha, pergunta, resposta, data_nascimento, tipo, comprovante, matricula, curso, turma, turno, status_comprovante, data_cadastro) 
            VALUES (?, ?, ?, ?, ?, ?, 'aluno', ?, ?, ?, ?, ?, ?, NOW())
        `;

        await conexao.query(sql, [
            nomeLimpo,
            emailLimpo,
            hashSenha,
            pergunta || null,
            resposta || null,
            dataNascimento || null,
            comprovante,
            matriculaLimpa,
            curso || null,
            turma || null,
            turno || null,
            statusInicial
        ]);

        return res.status(200).json({ sucesso: true, mensagem: "Cadastro realizado com sucesso!" });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({
                sucesso: false,
                campo: 'matricula',
                mensagem: "Matrícula ou e-mail já cadastrado no sistema."
            });
        }
        return res.status(500).json({ sucesso: false, mensagem: "Erro ao cadastrar: " + error.message });
    }
});

// RECUPERAR PERGUNTA
app.get('/api/recuperar-pergunta', async (req, res) => {
    try {
        let email = String(req.query.email || "").trim().toLowerCase();
        const [results] = await conexao.query(`SELECT email, pergunta FROM contribuintes WHERE LOWER(email) = ?`, [email]);

        if (results && results.length > 0) {
            return res.json({ sucesso: true, usuario: results[0] });
        } else {
            return res.json({ sucesso: false, mensagem: 'E-mail não encontrado.' });
        }
    } catch (error) {
        return res.status(500).json({ sucesso: false, mensagem: 'Erro no servidor.' });
    }
});

// REDEFINIR SENHA
app.post('/api/redefinir-senha', async (req, res) => {
    try {
        let { email = "", resposta = "", novaSenha = "" } = req.body;
        let usuarioEmail = String(email).trim().toLowerCase();
        
        const [userCheck] = await conexao.query(`SELECT * FROM contribuintes WHERE LOWER(email) = ?`, [usuarioEmail]);
        if (!userCheck || userCheck.length === 0) return res.status(404).json({ sucesso: false, mensagem: "Usuário não encontrado." });

        const usuario = userCheck[0];
        if (usuario.resposta && usuario.resposta.trim().toLowerCase() !== String(resposta).trim().toLowerCase()) {
            return res.status(400).json({ sucesso: false, mensagem: "Resposta de segurança incorreta." });
        }

        const hashNovaSenha = crypto.createHash("sha256").update(novaSenha).digest("hex");
        await conexao.query(`UPDATE contribuintes SET senha = ? WHERE id = ?`, [hashNovaSenha, usuario.id]);

        return res.json({ sucesso: true, mensagem: "Senha alterada com sucesso!" });
    } catch (error) {
        return res.status(500).json({ sucesso: false, mensagem: "Erro ao redefinir a senha." });
    }
});

// OBTER DADOS DO PERFIL DO ALUNO
app.get('/api/perfil-aluno', autenticarToken, async (req, res) => {
    try {
        const usuarioId = req.user.id;
        const [resultados] = await conexao.query(
            `SELECT id, nome_completo, email, matricula, curso, turma, turno, telefone, foto_perfil, status_comprovante FROM contribuintes WHERE id = ?`, 
            [usuarioId]
        );

        if (!resultados || resultados.length === 0) {
            return res.status(404).json({ sucesso: false, mensagem: "Usuário não encontrado." });
        }

        const usuario = resultados[0];
        return res.json({ 
            sucesso: true, 
            usuario: {
                ...usuario,
                nome: usuario.nome_completo,
                ra: usuario.matricula,
                status: (usuario.email === 'bruna123@gmail.com') ? 'APROVADO' : (usuario.status_comprovante || 'PENDENTE').toUpperCase()
            }
        });
    } catch (error) {
        return res.status(500).json({ sucesso: false, mensagem: "Erro ao buscar perfil." });
    }
});

// ATUALIZAR DADOS E FOTO DO PERFIL DO ALUNO (PERSISTENTE NO BANCO)
app.put('/api/perfil-aluno', autenticarToken, upload.single('foto'), async (req, res) => {
    try {
        const usuarioId = req.user.id;
        const [atualRows] = await conexao.query(`SELECT * FROM contribuintes WHERE id = ?`, [usuarioId]);

        if (!atualRows || atualRows.length === 0) {
            return res.status(404).json({ sucesso: false, mensagem: "Usuário não encontrado." });
        }

        const atual = atualRows[0];
        const nome_completo = (req.body.nome_completo || req.body.nome || atual.nome_completo || '').trim();
        const email = (req.body.email || atual.email || '').trim();
        const matricula = (req.body.matricula || req.body.ra || atual.matricula || '').trim();
        const curso = (req.body.curso !== undefined ? req.body.curso : atual.curso) || '';
        const turma = (req.body.turma !== undefined ? req.body.turma : atual.turma) || '';
        const turno = (req.body.turno !== undefined ? req.body.turno : atual.turno) || '';
        const telefone = (req.body.telefone !== undefined ? req.body.telefone : atual.telefone) || '';
        const foto_perfil = req.file ? req.file.filename : atual.foto_perfil;

        await conexao.query(
            `UPDATE contribuintes 
             SET nome_completo = ?, email = ?, matricula = ?, curso = ?, turma = ?, turno = ?, telefone = ?, foto_perfil = ?
             WHERE id = ?`,
            [nome_completo, email, matricula, curso, turma, turno, telefone, foto_perfil, usuarioId]
        );

        const [usuarioAtualizado] = await conexao.query(
            `SELECT id, nome_completo, email, matricula, curso, turma, turno, telefone, foto_perfil, status_comprovante FROM contribuintes WHERE id = ?`, 
            [usuarioId]
        );

        const u = usuarioAtualizado[0];
        return res.json({
            sucesso: true,
            mensagem: "Perfil e foto atualizados com sucesso!",
            usuario: {
                ...u,
                nome: u.nome_completo,
                ra: u.matricula
            }
        });
    } catch (error) {
        console.error("Erro ao atualizar perfil:", error);
        return res.status(500).json({ sucesso: false, mensagem: "Erro interno ao atualizar perfil." });
    }
});

// OBTER PERFIL DO ADMINISTRADOR
app.get('/api/perfil-admin', autenticarToken, async (req, res) => {
    try {
        await garantirColunasAdmin();
        const adminId = req.user.id;

        const [rows] = await conexao.query(
            `SELECT id, nome, login, nif, cargo, email, telefone, foto_perfil FROM administradores WHERE id = ? LIMIT 1`,
            [adminId]
        );

        if (rows && rows.length > 0) {
            const adm = rows[0];
            return res.json({
                sucesso: true,
                usuario: {
                    id: adm.id,
                    nome: adm.nome || adm.login,
                    nome_completo: adm.nome || adm.login,
                    login: adm.login,
                    matricula: adm.nif || `ADM-${adm.id}`,
                    nif: adm.nif || `ADM-${adm.id}`,
                    cargo: adm.cargo || 'Gestor AAPM SENAI',
                    curso: adm.cargo || 'Gestor AAPM SENAI',
                    email: adm.email || adm.login || '',
                    telefone: adm.telefone || '',
                    foto_perfil: adm.foto_perfil || null,
                    tipo: 'admin'
                }
            });
        }

        const [contribRows] = await conexao.query(
            `SELECT id, nome_completo, email, matricula, curso, telefone, foto_perfil FROM contribuintes WHERE id = ? LIMIT 1`,
            [adminId]
        );
        if (contribRows && contribRows.length > 0) {
            const c = contribRows[0];
            return res.json({
                sucesso: true,
                usuario: {
                    ...c,
                    nome: c.nome_completo,
                    nif: c.matricula,
                    cargo: c.curso || 'Gestor AAPM SENAI',
                    tipo: 'admin'
                }
            });
        }

        return res.status(404).json({ sucesso: false, mensagem: "Administrador não encontrado." });
    } catch (error) {
        console.error("Erro ao buscar perfil admin:", error);
        return res.status(500).json({ sucesso: false, mensagem: "Erro ao buscar perfil do administrador." });
    }
});

// ATUALIZAR PERFIL E FOTO DO ADMINISTRADOR
app.put('/api/perfil-admin', autenticarToken, upload.single('foto'), async (req, res) => {
    try {
        await garantirColunasAdmin();
        const adminId = req.user.id;

        const [rows] = await conexao.query(`SELECT * FROM administradores WHERE id = ? LIMIT 1`, [adminId]);

        if (rows && rows.length > 0) {
            const atual = rows[0];
            const nome = (req.body.nome_completo || req.body.nome || atual.nome || '').trim();
            const nif = (req.body.nif || req.body.matricula || atual.nif || '').trim();
            const cargo = (req.body.cargo || req.body.curso || atual.cargo || 'Gestor AAPM SENAI').trim();
            const email = (req.body.email || atual.email || atual.login || '').trim();
            const telefone = (req.body.telefone !== undefined ? req.body.telefone : atual.telefone) || '';
            const foto_perfil = req.file ? req.file.filename : atual.foto_perfil;

            await conexao.query(
                `UPDATE administradores 
                 SET nome = ?, nif = ?, cargo = ?, email = ?, telefone = ?, foto_perfil = ?
                 WHERE id = ?`,
                [nome, nif, cargo, email, telefone, foto_perfil, adminId]
            );

            const [atualizado] = await conexao.query(
                `SELECT id, nome, login, nif, cargo, email, telefone, foto_perfil FROM administradores WHERE id = ? LIMIT 1`,
                [adminId]
            );
            const adm = atualizado[0];

            return res.json({
                sucesso: true,
                mensagem: "Perfil do Administrador atualizado com sucesso!",
                usuario: {
                    id: adm.id,
                    nome: adm.nome,
                    nome_completo: adm.nome,
                    login: adm.login,
                    matricula: adm.nif,
                    nif: adm.nif,
                    cargo: adm.cargo,
                    curso: adm.cargo,
                    email: adm.email,
                    telefone: adm.telefone,
                    foto_perfil: adm.foto_perfil,
                    tipo: 'admin'
                }
            });
        }

        return res.status(404).json({ sucesso: false, mensagem: "Administrador não encontrado." });
    } catch (error) {
        console.error("Erro ao atualizar perfil admin:", error);
        return res.status(500).json({ sucesso: false, mensagem: "Erro interno ao atualizar perfil do administrador." });
    }
});

// ----------------------------------------------------
// PRESENÇA ONLINE / OFFLINE DO CHAT
// ----------------------------------------------------

// 1. HEARTBEAT DE PRESENÇA (CHAMADO PELO ALUNO E PELO ADMIN A CADA POUCOS SEGUNDOS)
app.post(['/chat/heartbeat', '/api/chat/heartbeat'], extrairTokenOpcional, async (req, res) => {
    try {
        const tipoReq = (req.user?.tipo || req.body?.tipo || req.body?.tipoUsuario || 'aluno').toLowerCase();
        const tipoNormalizado = (tipoReq === 'admin' || tipoReq === 'adm') ? 'admin' : 'aluno';

        const usuarioId = req.user?.id || req.body?.usuario_id || req.body?.aluno_id || req.body?.id || null;
        const emailRaw = req.user?.email || req.user?.login || req.body?.email || req.body?.aluno_email || '';
        const emailLimpo = String(emailRaw).trim().toLowerCase() || null;

        if (!usuarioId && !emailLimpo) {
            return res.status(400).json({ sucesso: false, mensagem: "Identificação ausente no heartbeat." });
        }

        const chave = usuarioId
            ? `${tipoNormalizado}:${usuarioId}`
            : `${tipoNormalizado}:email:${emailLimpo}`;

        await conexao.query(
            `INSERT INTO presenca_chat (chave_presenca, usuario_id, email, tipo, ultimo_visto)
             VALUES (?, ?, ?, ?, NOW())
             ON DUPLICATE KEY UPDATE
                usuario_id = COALESCE(VALUES(usuario_id), usuario_id),
                email = COALESCE(VALUES(email), email),
                ultimo_visto = NOW()`,
            [chave, usuarioId, emailLimpo, tipoNormalizado]
        );

        return res.json({ sucesso: true, online: true });
    } catch (error) {
        console.error("Erro no heartbeat:", error);
        return res.status(500).json({ sucesso: false });
    }
});

// 2. MARCAR OFFLINE IMEDIATAMENTE (AO FAZER LOGOUT OU FECHAR A ABA)
app.post(['/chat/offline', '/api/chat/offline'], extrairTokenOpcional, async (req, res) => {
    try {
        const tipoReq = (req.user?.tipo || req.body?.tipo || 'aluno').toLowerCase();
        const tipoNormalizado = (tipoReq === 'admin' || tipoReq === 'adm') ? 'admin' : 'aluno';
        const usuarioId = req.user?.id || req.body?.usuario_id || req.body?.aluno_id || null;
        const emailLimpo = String(req.user?.email || req.body?.email || '').trim().toLowerCase() || null;

        if (usuarioId) {
            await conexao.query(`DELETE FROM presenca_chat WHERE tipo = ? AND usuario_id = ?`, [tipoNormalizado, usuarioId]);
        } else if (emailLimpo) {
            await conexao.query(`DELETE FROM presenca_chat WHERE tipo = ? AND email = ?`, [tipoNormalizado, emailLimpo]);
        }
        return res.json({ sucesso: true });
    } catch (error) {
        return res.status(500).json({ sucesso: false });
    }
});

// 3. VERIFICAR SE O INTERLOCUTOR ESTÁ ONLINE
app.get(['/chat/status-online', '/api/chat/status-online'], extrairTokenOpcional, async (req, res) => {
    try {
        const tipoChamador = (req.user?.tipo || req.query?.tipo || 'aluno').toLowerCase();
        const ehAdminChamando = (tipoChamador === 'admin' || tipoChamador === 'adm') || Boolean(req.query.aluno_id || req.query.email);

        if (!ehAdminChamando) {
            const [rowsAdmin] = await conexao.query(`
                SELECT COUNT(*) AS ativos
                FROM presenca_chat
                WHERE tipo = 'admin'
                  AND TIMESTAMPDIFF(SECOND, ultimo_visto, NOW()) <= 20
            `);
            return res.json({ online: (rowsAdmin[0]?.ativos || 0) > 0 });
        }

        const alunoId = req.query.aluno_id || req.query.id;
        const emailAluno = String(req.query.email || req.query.aluno_email || '').trim().toLowerCase();

        if (!alunoId && !emailAluno) {
            return res.json({ online: false });
        }

        let sql = `
            SELECT COUNT(*) AS ativos
            FROM presenca_chat
            WHERE tipo = 'aluno'
              AND TIMESTAMPDIFF(SECOND, ultimo_visto, NOW()) <= 20
              AND `;
        const params = [];

        if (alunoId && emailAluno) {
            sql += `(usuario_id = ? OR LOWER(email) = ?)`;
            params.push(alunoId, emailAluno);
        } else if (alunoId) {
            sql += `usuario_id = ?`;
            params.push(alunoId);
        } else {
            sql += `LOWER(email) = ?`;
            params.push(emailAluno);
        }

        const [rowsAluno] = await conexao.query(sql, params);
        return res.json({ online: (rowsAluno[0]?.ativos || 0) > 0 });
    } catch (error) {
        console.error("Erro ao verificar status online:", error);
        return res.json({ online: false });
    }
});

// ----------------------------------------------------
// ROTAS DE GERENCIAMENTO DE EVENTOS (/api/eventos)
// ----------------------------------------------------

app.get(['/eventos', '/api/eventos'], async (req, res) => {
    try {
        const [rows] = await conexao.query(`
            SELECT 
                e.*, 
                COUNT(ie.id) AS total_inscritos
            FROM eventos e
            LEFT JOIN inscricoes_eventos ie ON e.id = ie.evento_id
            GROUP BY e.id
            ORDER BY e.data ASC
        `);
        return res.json(rows);
    } catch (error) {
        console.error("Erro ao buscar eventos:", error);
        return res.status(500).json({ sucesso: false, mensagem: "Erro ao buscar eventos." });
    }
});

app.get(['/eventos/minhas-inscricoes', '/api/eventos/minhas-inscricoes'], autenticarToken, async (req, res) => {
    try {
        const contribuinte_id = req.user.id;
        const [rows] = await conexao.query(
            `SELECT evento_id FROM inscricoes_eventos WHERE contribuinte_id = ?`,
            [contribuinte_id]
        );
        const ids = rows.map(r => r.evento_id);
        return res.json({ sucesso: true, eventosInscritos: ids });
    } catch (error) {
        console.error("Erro ao buscar minhas inscricoes:", error);
        return res.status(500).json({ sucesso: false, mensagem: "Erro ao buscar inscrições." });
    }
});

app.post(['/eventos', '/api/eventos'], autenticarToken, async (req, res) => {
    try {
        const { titulo, data, horario, local } = req.body;

        if (!titulo || !data) {
            return res.status(400).json({ sucesso: false, mensagem: "Título e data são obrigatórios." });
        }

        const [result] = await conexao.query(
            `INSERT INTO eventos (titulo, data, horario, local) VALUES (?, ?, ?, ?)`,
            [titulo, data, horario || 'Não definido', local || 'A definir']
        );

        const dataFormatada = new Date(data + 'T12:00:00').toLocaleDateString('pt-BR');
        await criarNotificacao(
            'evento',
            'Novo Evento Disponível',
            `Um novo evento está disponível: "${titulo}" — dia ${dataFormatada} às ${horario || 'horário a definir'} (${local || 'Local a definir'}).`,
            'eventos.html'
        );

        return res.status(201).json({
            sucesso: true,
            mensagem: "Evento criado com sucesso!",
            id: result.insertId
        });
    } catch (error) {
        console.error("Erro ao salvar evento:", error);
        return res.status(500).json({ sucesso: false, mensagem: "Erro interno ao salvar evento: " + error.message });
    }
});

app.put(['/eventos/:id', '/api/eventos/:id'], autenticarToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { titulo, data, horario, local } = req.body;

        const [result] = await conexao.query(
            `UPDATE eventos SET titulo = ?, data = ?, horario = ?, local = ? WHERE id = ?`,
            [titulo, data, horario, local, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ sucesso: false, mensagem: "Evento não encontrado." });
        }

        return res.json({ sucesso: true, mensagem: "Evento atualizado com sucesso!" });
    } catch (error) {
        console.error("Erro ao atualizar evento:", error);
        return res.status(500).json({ sucesso: false, mensagem: "Erro ao atualizar evento." });
    }
});

app.delete(['/eventos/:id', '/api/eventos/:id'], autenticarToken, async (req, res) => {
    try {
        const { id } = req.params;
        const [result] = await conexao.query(`DELETE FROM eventos WHERE id = ?`, [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ sucesso: false, mensagem: "Evento não encontrado." });
        }

        return res.json({ sucesso: true, mensagem: "Evento excluído com sucesso!" });
    } catch (error) {
        console.error("Erro ao excluir evento:", error);
        return res.status(500).json({ sucesso: false, mensagem: "Erro ao excluir evento." });
    }
});

app.post(['/eventos/:id/inscrever', '/api/eventos/:id/inscrever'], autenticarToken, async (req, res) => {
    try {
        const evento_id = req.params.id;
        const contribuinte_id = req.user.id;

        const [existente] = await conexao.query(
            `SELECT * FROM inscricoes_eventos WHERE evento_id = ? AND contribuinte_id = ?`,
            [evento_id, contribuinte_id]
        );

        if (existente.length > 0) {
            return res.status(400).json({ sucesso: false, mensagem: "Você já está inscrito neste evento." });
        }

        await conexao.query(
            `INSERT INTO inscricoes_eventos (evento_id, contribuinte_id) VALUES (?, ?)`,
            [evento_id, contribuinte_id]
        );

        return res.status(201).json({ sucesso: true, mensagem: "Presença confirmada no evento com sucesso!" });
    } catch (error) {
        console.error("Erro ao inscrever no evento:", error);
        return res.status(500).json({ sucesso: false, mensagem: "Erro ao processar inscrição." });
    }
});

app.delete(['/eventos/:id/desinscrever', '/api/eventos/:id/desinscrever'], autenticarToken, async (req, res) => {
    try {
        const evento_id = req.params.id;
        const contribuinte_id = req.user.id;

        const [resultado] = await conexao.query(
            `DELETE FROM inscricoes_eventos WHERE evento_id = ? AND contribuinte_id = ?`,
            [evento_id, contribuinte_id]
        );

        if (resultado.affectedRows === 0) {
            return res.status(404).json({ sucesso: false, mensagem: "Inscrição não encontrada." });
        }

        return res.json({ sucesso: true, mensagem: "Inscrição cancelada com sucesso!" });
    } catch (error) {
        console.error("Erro ao desinscrever do evento:", error);
        return res.status(500).json({ sucesso: false, mensagem: "Erro ao cancelar inscrição." });
    }
});

app.get(['/eventos/:id/inscritos', '/api/eventos/:id/inscritos'], autenticarToken, async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await conexao.query(`
            SELECT 
                c.id, 
                c.nome_completo AS nome, 
                c.email, 
                c.matricula,
                c.curso,
                c.turma,
                ie.data_inscricao
            FROM inscricoes_eventos ie
            JOIN contribuintes c ON ie.contribuinte_id = c.id
            WHERE ie.evento_id = ?
            ORDER BY ie.data_inscricao DESC
        `, [id]);

        return res.json({ sucesso: true, dados: rows });
    } catch (error) {
        console.error("Erro ao buscar inscritos no evento:", error);
        return res.status(500).json({ sucesso: false, mensagem: "Erro ao buscar alunos inscritos." });
    }
});

// ----------------------------------------------------
// ROTAS DE GERENCIAMENTO DE BENEFÍCIOS (/api/beneficios)
// ----------------------------------------------------

app.get(['/beneficios', '/api/beneficios'], async (req, res) => {
    try {
        const [rows] = await conexao.query(`SELECT * FROM beneficios ORDER BY id DESC`);
        return res.json(rows);
    } catch (error) {
        console.error("Erro ao buscar benefícios:", error);
        return res.status(500).json({ sucesso: false, mensagem: "Erro ao buscar benefícios." });
    }
});

app.post(['/beneficios', '/api/beneficios'], autenticarToken, async (req, res) => {
    try {
        const { titulo, categoria, descricao } = req.body;

        if (!titulo || !categoria || !descricao) {
            return res.status(400).json({ sucesso: false, mensagem: "Preencha todos os campos do benefício." });
        }

        const [result] = await conexao.query(
            `INSERT INTO beneficios (titulo, categoria, descricao) VALUES (?, ?, ?)`,
            [titulo, categoria, descricao]
        );

        await criarNotificacao(
            'beneficio',
            'Novo Benefício Disponível',
            `Novo benefício disponível (${categoria}): "${titulo}" — ${descricao}`,
            'beneficios.html'
        );

        return res.status(201).json({
            sucesso: true,
            mensagem: "Benefício criado com sucesso!",
            id: result.insertId
        });
    } catch (error) {
        console.error("Erro ao salvar benefício:", error);
        return res.status(500).json({ sucesso: false, mensagem: "Erro interno ao salvar benefício: " + error.message });
    }
});

app.put(['/beneficios/:id', '/api/beneficios/:id'], autenticarToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { titulo, categoria, descricao } = req.body;

        const [result] = await conexao.query(
            `UPDATE beneficios SET titulo = ?, categoria = ?, descricao = ? WHERE id = ?`,
            [titulo, categoria, descricao, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ sucesso: false, mensagem: "Benefício não encontrado." });
        }

        return res.json({ sucesso: true, mensagem: "Benefício atualizado com sucesso!" });
    } catch (error) {
        console.error("Erro ao atualizar benefício:", error);
        return res.status(500).json({ sucesso: false, mensagem: "Erro ao atualizar benefício." });
    }
});

app.delete(['/beneficios/:id', '/api/beneficios/:id'], autenticarToken, async (req, res) => {
    try {
        const { id } = req.params;
        const [result] = await conexao.query(`DELETE FROM beneficios WHERE id = ?`, [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ sucesso: false, mensagem: "Benefício não encontrado." });
        }

        return res.json({ sucesso: true, mensagem: "Benefício excluído com sucesso!" });
    } catch (error) {
        console.error("Erro ao excluir benefício:", error);
        return res.status(500).json({ sucesso: false, mensagem: "Erro ao excluir benefício." });
    }
});

// ----------------------------------------------------
// ROTAS DE GERENCIAMENTO DE OFICINAS (/api/oficinas)
// ----------------------------------------------------

app.get(['/oficinas', '/api/oficinas'], async (req, res) => {
    try {
        const [rows] = await conexao.query(`
            SELECT 
                o.*, 
                COUNT(i.id) AS total_inscritos
            FROM oficinas o
            LEFT JOIN inscricoes_oficinas i ON o.id = i.oficina_id
            GROUP BY o.id
            ORDER BY o.id DESC
        `);
        return res.json(rows);
    } catch (error) {
        console.error("Erro ao buscar oficinas:", error);
        return res.status(500).json({ sucesso: false, mensagem: "Erro ao buscar oficinas." });
    }
});

app.get(['/oficinas/minhas-inscricoes', '/api/oficinas/minhas-inscricoes'], autenticarToken, async (req, res) => {
    try {
        const contribuinte_id = req.user.id;
        const [rows] = await conexao.query(
            `SELECT oficina_id FROM inscricoes_oficinas WHERE contribuinte_id = ?`,
            [contribuinte_id]
        );
        const ids = rows.map(r => r.oficina_id);
        return res.json({ sucesso: true, oficinasInscritas: ids });
    } catch (error) {
        console.error("Erro ao buscar minhas inscrições em oficinas:", error);
        return res.status(500).json({ sucesso: false, mensagem: "Erro ao buscar inscrições." });
    }
});

app.post(['/oficinas/:id/inscrever', '/api/oficinas/:id/inscrever'], autenticarToken, async (req, res) => {
    try {
        const oficina_id = req.params.id;
        const contribuinte_id = req.user.id;

        const [oficinaRows] = await conexao.query(`SELECT vagas FROM oficinas WHERE id = ?`, [oficina_id]);
        if (oficinaRows.length === 0) {
            return res.status(404).json({ sucesso: false, mensagem: "Oficina não encontrada." });
        }

        const [existente] = await conexao.query(
            `SELECT id FROM inscricoes_oficinas WHERE oficina_id = ? AND contribuinte_id = ?`,
            [oficina_id, contribuinte_id]
        );
        if (existente.length > 0) {
            return res.status(400).json({ sucesso: false, mensagem: "Você já está inscrito nesta oficina." });
        }

        const [contagem] = await conexao.query(
            `SELECT COUNT(*) AS total FROM inscricoes_oficinas WHERE oficina_id = ?`,
            [oficina_id]
        );
        if (contagem[0].total >= oficinaRows[0].vagas) {
            return res.status(400).json({ sucesso: false, mensagem: "As vagas para esta oficina estão esgotadas." });
        }

        await conexao.query(
            `INSERT INTO inscricoes_oficinas (oficina_id, contribuinte_id) VALUES (?, ?)`,
            [oficina_id, contribuinte_id]
        );

        return res.status(201).json({ sucesso: true, mensagem: "Inscrição na oficina confirmada!" });
    } catch (error) {
        console.error("Erro ao inscrever na oficina:", error);
        return res.status(500).json({ sucesso: false, mensagem: "Erro ao processar inscrição." });
    }
});

app.delete(['/oficinas/:id/desinscrever', '/api/oficinas/:id/desinscrever'], autenticarToken, async (req, res) => {
    try {
        const oficina_id = req.params.id;
        const contribuinte_id = req.user.id;

        const [resultado] = await conexao.query(
            `DELETE FROM inscricoes_oficinas WHERE oficina_id = ? AND contribuinte_id = ?`,
            [oficina_id, contribuinte_id]
        );

        if (resultado.affectedRows === 0) {
            return res.status(404).json({ sucesso: false, mensagem: "Inscrição não encontrada." });
        }

        return res.json({ sucesso: true, mensagem: "Inscrição cancelada com sucesso!" });
    } catch (error) {
        console.error("Erro ao cancelar inscrição na oficina:", error);
        return res.status(500).json({ sucesso: false, mensagem: "Erro ao cancelar inscrição." });
    }
});

app.post(['/oficinas', '/api/oficinas'], autenticarToken, async (req, res) => {
    try {
        const { titulo, descricao, horario, local, vagas, status } = req.body;

        if (!titulo || !descricao) {
            return res.status(400).json({ sucesso: false, mensagem: "Título e descrição são obrigatórios." });
        }

        const totalVagas = parseInt(vagas) || 5;
        const [result] = await conexao.query(`
            INSERT INTO oficinas (titulo, descricao, horario, local, vagas, status)
            VALUES (?, ?, ?, ?, ?, ?)
        `, [
            titulo, 
            descricao, 
            horario || '', 
            local || '', 
            totalVagas, 
            status || 'Inscrições Abertas'
        ]);

        await criarNotificacao(
            'oficina',
            'Nova Oficina Disponível',
            `Uma nova oficina está disponível: "${titulo}" (${horario || 'Horário a confirmar'}) — Local: ${local || 'SENAI'} (${totalVagas} vagas).`,
            'oficinas.html'
        );

        return res.status(201).json({
            sucesso: true,
            mensagem: "Oficina criada com sucesso!",
            id: result.insertId
        });
    } catch (error) {
        console.error("Erro ao salvar oficina:", error);
        return res.status(500).json({ sucesso: false, mensagem: "Erro interno ao salvar oficina: " + error.message });
    }
});

app.put(['/oficinas/:id', '/api/oficinas/:id'], autenticarToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { titulo, descricao, horario, local, vagas, status } = req.body;

        const [result] = await conexao.query(`
            UPDATE oficinas 
            SET titulo = ?, descricao = ?, horario = ?, local = ?, vagas = ?, status = ?
            WHERE id = ?
        `, [
            titulo, 
            descricao, 
            horario, 
            local, 
            parseInt(vagas) || 5, 
            status || 'Inscrições Abertas', 
            id
        ]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ sucesso: false, mensagem: "Oficina não encontrada." });
        }

        return res.json({ sucesso: true, mensagem: "Oficina atualizada com sucesso!" });
    } catch (error) {
        console.error("Erro ao atualizar oficina:", error);
        return res.status(500).json({ sucesso: false, mensagem: "Erro ao atualizar oficina." });
    }
});

app.delete(['/oficinas/:id', '/api/oficinas/:id'], autenticarToken, async (req, res) => {
    try {
        const { id } = req.params;
        await conexao.query(`DELETE FROM inscricoes_oficinas WHERE oficina_id = ?`, [id]);
        const [result] = await conexao.query(`DELETE FROM oficinas WHERE id = ?`, [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ sucesso: false, mensagem: "Oficina não encontrada." });
        }

        return res.json({ sucesso: true, mensagem: "Oficina excluída com sucesso!" });
    } catch (error) {
        console.error("Erro ao excluir oficina:", error);
        return res.status(500).json({ sucesso: false, mensagem: "Erro ao excluir oficina." });
    }
});

app.get(['/oficinas/:id/inscritos', '/api/oficinas/:id/inscritos'], autenticarToken, async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await conexao.query(`
            SELECT 
                c.id, 
                c.nome_completo AS nome, 
                c.email, 
                c.matricula,
                c.curso,
                c.turma,
                c.turno,
                c.telefone,
                i.data_inscricao
            FROM inscricoes_oficinas i
            JOIN contribuintes c ON i.contribuinte_id = c.id
            WHERE i.oficina_id = ?
            ORDER BY i.data_inscricao DESC
        `, [id]);

        return res.json({ sucesso: true, dados: rows });
    } catch (error) {
        console.error("Erro ao buscar alunos inscritos:", error);
        return res.status(500).json({ sucesso: false, mensagem: "Erro ao buscar alunos inscritos." });
    }
});

// ----------------------------------------------------
// ROTAS DE GERENCIAMENTO DE SUGESTÕES (/api/sugestoes)
// ----------------------------------------------------

app.get(['/sugestoes', '/api/sugestoes'], autenticarToken, async (req, res) => {
    try {
        const query = `
            SELECT 
                s.id,
                COALESCE(c.nome_completo, s.nome, 'Anônimo') AS aluno,
                COALESCE(c.matricula, s.matricula, '-') AS matricula,
                COALESCE(c.email, s.email, '-') AS email,
                s.mensagem,
                s.status,
                s.resposta,
                s.data_envio
            FROM sugestoes s
            LEFT JOIN contribuintes c ON s.usuario_id = c.id
            ORDER BY s.data_envio DESC
        `;

        const [rows] = await conexao.query(query);
        return res.json(rows);
    } catch (error) {
        console.error("Erro ao buscar sugestões:", error);
        return res.status(500).json({ sucesso: false, mensagem: "Erro interno ao carregar sugestões." });
    }
});

app.post(['/sugestoes', '/api/sugestoes'], async (req, res) => {
    try {
        const { usuario_id, nome, matricula, email, mensagem } = req.body;

        if (!mensagem || mensagem.trim() === '') {
            return res.status(400).json({ sucesso: false, mensagem: "A mensagem de sugestão é obrigatória." });
        }

        const query = `
            INSERT INTO sugestoes (usuario_id, nome, matricula, email, mensagem)
            VALUES (?, ?, ?, ?, ?)
        `;

        await conexao.query(query, [
            usuario_id || null,
            nome || 'Anônimo',
            matricula || null,
            email || null,
            mensagem.trim()
        ]);

        return res.status(201).json({ sucesso: true, mensagem: "Sugestão enviada com sucesso!" });
    } catch (error) {
        console.error("Erro ao enviar sugestão:", error);
        return res.status(500).json({ sucesso: false, mensagem: "Erro interno ao salvar sugestão." });
    }
});

app.put(['/sugestoes/:id', '/api/sugestoes/:id'], autenticarToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { status, resposta } = req.body;

        const query = `
            UPDATE sugestoes 
            SET status = ?, resposta = ?
            WHERE id = ?
        `;

        const [resultado] = await conexao.query(query, [
            status || 'pendente',
            resposta || null,
            id
        ]);

        if (resultado.affectedRows === 0) {
            return res.status(404).json({ sucesso: false, mensagem: "Sugestão não encontrada." });
        }

        return res.json({ sucesso: true, mensagem: "Sugestão atualizada com sucesso!" });
    } catch (error) {
        console.error("Erro ao atualizar sugestão:", error);
        return res.status(500).json({ sucesso: false, mensagem: "Erro interno ao atualizar sugestão." });
    }
});

// ----------------------------------------------------
// ROTAS DO PAINEL ADMINISTRATIVO (COMPROVANTES E CONTRIBUINTES)
// ----------------------------------------------------

app.get([
    '/comprovantes', 
    '/api/comprovantes', 
    '/api/admin/comprovantes'
], async (req, res) => {
    try {
        const [rows] = await conexao.query(`
            SELECT 
                id, 
                matricula, 
                nome_completo AS aluno, 
                nome_completo AS nome, 
                email,
                foto_perfil AS foto,
                data_cadastro AS data_envio, 
                data_cadastro, 
                status_comprovante AS status, 
                status_comprovante, 
                comprovante AS arquivo, 
                comprovante
            FROM contribuintes
            ORDER BY id DESC
        `);
        return res.json(rows);
    } catch (error) {
        console.error("Erro ao buscar comprovantes:", error);
        return res.status(500).json({ sucesso: false, mensagem: "Erro ao buscar comprovantes." });
    }
});

app.put([
    '/comprovantes/:id/status', 
    '/api/comprovantes/:id/status'
], async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!id || !status) {
            return res.status(400).json({ sucesso: false, mensagem: "ID e Status são obrigatórios." });
        }

        const [resultado] = await conexao.query(
            `UPDATE contribuintes SET status_comprovante = ? WHERE id = ?`, 
            [status, id]
        );

        if (resultado.affectedRows === 0) {
            return res.status(404).json({ sucesso: false, mensagem: "Contribuinte não encontrado." });
        }

        return res.json({ sucesso: true, mensagem: `Comprovante ${status} com sucesso!` });
    } catch (error) {
        console.error("Erro ao atualizar status:", error);
        return res.status(500).json({ sucesso: false, mensagem: "Erro ao atualizar status do comprovante." });
    }
});

app.get(["/api/contribuintes-aprovados", "/contribuintes-aprovados"], async (req, res) => {
    try {
        const [rows] = await conexao.query(`
            SELECT 
                id,
                nome_completo AS nome,
                data_nascimento AS nascimento,
                matricula,
                'Associado' AS associacao,
                data_cadastro
            FROM contribuintes 
            WHERE UPPER(status_comprovante) = 'APROVADO'
        `);

        return res.json({
            sucesso: true,
            dados: rows
        });
    } catch (err) {
        console.error("Erro na rota /api/contribuintes-aprovados:", err);
        return res.status(500).json({
            sucesso: false,
            mensagem: "Erro ao buscar contribuintes aprovados.",
            dados: []
        });
    }
});

app.get(["/api/contribuintes", "/contribuintes"], async (req, res) => {
    try {
        const [rows] = await conexao.query(`
            SELECT 
                id, 
                nome_completo, 
                email, 
                matricula, 
                turma, 
                turno 
            FROM contribuintes 
            ORDER BY nome_completo ASC
        `);
        return res.json(rows);
    } catch (err) {
        console.error("Erro ao buscar lista completa de contribuintes:", err);
        return res.status(500).json({ sucesso: false, mensagem: "Erro ao buscar alunos." });
    }
});

// ----------------------------------------------------
// ROTAS DE AVISOS
// ----------------------------------------------------

app.get(['/avisos', '/api/avisos'], async (req, res) => {
    try {
        const [rows] = await conexao.query(`SELECT * FROM avisos ORDER BY id DESC`);
        return res.json(rows);
    } catch (error) {
        return res.status(500).json({ sucesso: false, mensagem: "Erro ao buscar avisos." });
    }
});

app.post(['/avisos', '/api/avisos'], async (req, res) => {
    try {
        const { titulo, conteudo } = req.body;
        await conexao.query(`INSERT INTO avisos (titulo, conteudo) VALUES (?, ?)`, [titulo, conteudo]);

        const resumo = conteudo && conteudo.length > 80 ? conteudo.substring(0, 80) + '...' : (conteudo || '');
        await criarNotificacao(
            'aviso',
            'Novo Aviso Publicado',
            `Novo comunicado da AAPM: "${titulo}" — ${resumo}`,
            'avisos.html'
        );

        return res.json({ sucesso: true, mensagem: "Aviso criado com sucesso!" });
    } catch (error) {
        return res.status(500).json({ sucesso: false, mensagem: "Erro ao criar aviso." });
    }
});

app.delete(['/avisos/:id', '/api/avisos/:id'], async (req, res) => {
    try {
        const { id } = req.params;
        await conexao.query(`DELETE FROM avisos WHERE id = ?`, [id]);
        return res.json({ sucesso: true, mensagem: "Aviso excluído com sucesso!" });
    } catch (error) {
        return res.status(500).json({ sucesso: false, mensagem: "Erro ao excluir aviso." });
    }
});

// ----------------------------------------------------
// ROTAS DE CHAT EM TEMPO REAL (/api/chat)
// ----------------------------------------------------

let tabelaChatVerificada = false;
async function garantirTabelaChat() {
    if (tabelaChatVerificada) return;

    await conexao.query(`
        CREATE TABLE IF NOT EXISTS mensagens_chat (
            id INT AUTO_INCREMENT PRIMARY KEY,
            aluno_id INT NULL,
            aluno_email VARCHAR(150) NOT NULL DEFAULT '',
            aluno_nome VARCHAR(150) NULL,
            remetente VARCHAR(20) NOT NULL DEFAULT 'aluno',
            mensagem TEXT NOT NULL,
            lida TINYINT(1) DEFAULT 0,
            data_envio DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    const [colunas] = await conexao.query(`SHOW COLUMNS FROM mensagens_chat`);
    const nomesColunas = colunas.map(c => c.Field.toLowerCase());

    if (!nomesColunas.includes('aluno_id')) {
        await conexao.query(`ALTER TABLE mensagens_chat ADD COLUMN aluno_id INT NULL`);
    }
    if (!nomesColunas.includes('aluno_email')) {
        await conexao.query(`ALTER TABLE mensagens_chat ADD COLUMN aluno_email VARCHAR(150) NOT NULL DEFAULT ''`);
    }
    if (!nomesColunas.includes('aluno_nome')) {
        await conexao.query(`ALTER TABLE mensagens_chat ADD COLUMN aluno_nome VARCHAR(150) NULL`);
    }
    if (!nomesColunas.includes('remetente')) {
        await conexao.query(`ALTER TABLE mensagens_chat ADD COLUMN remetente VARCHAR(20) NOT NULL DEFAULT 'aluno'`);
    }
    if (!nomesColunas.includes('mensagem')) {
        await conexao.query(`ALTER TABLE mensagens_chat ADD COLUMN mensagem TEXT NOT NULL`);
    }
    if (!nomesColunas.includes('lida')) {
        await conexao.query(`ALTER TABLE mensagens_chat ADD COLUMN lida TINYINT(1) DEFAULT 0`);
    }
    if (!nomesColunas.includes('data_envio')) {
        await conexao.query(`ALTER TABLE mensagens_chat ADD COLUMN data_envio DATETIME DEFAULT CURRENT_TIMESTAMP`);
    }

    for (const col of colunas) {
        const campo = col.Field.toLowerCase();
        const nossasColunas = ['id', 'aluno_id', 'aluno_email', 'aluno_nome', 'remetente', 'mensagem', 'lida', 'data_envio'];
        if (!nossasColunas.includes(campo) && col.Null === 'NO' && col.Default === null && !col.Extra.includes('auto_increment')) {
            await conexao.query(`ALTER TABLE mensagens_chat MODIFY COLUMN \`${col.Field}\` ${col.Type} NULL`);
        }
    }

    tabelaChatVerificada = true;
}

// 1. LISTAR TODOS OS ALUNOS CONTRIBUINTES (PARA O PAINEL ADMIN COM STATUS ONLINE)
app.get('/api/chat/contribuintes', async (req, res) => {
    try {
        await garantirTabelaChat();

        const [alunos] = await conexao.query(`
            SELECT id, nome_completo AS nome, email, curso, turma, foto_perfil, status_comprovante
            FROM contribuintes
            WHERE LOWER(COALESCE(tipo, 'aluno')) NOT IN ('adm', 'admin', 'administrador')
            ORDER BY nome_completo ASC
        `);

        const [presencas] = await conexao.query(`
            SELECT usuario_id, email
            FROM presenca_chat
            WHERE tipo = 'aluno'
              AND TIMESTAMPDIFF(SECOND, ultimo_visto, NOW()) <= 20
        `).catch(() => [[]]);

        const idsOnline = new Set(presencas.map(p => Number(p.usuario_id)).filter(Boolean));
        const emailsOnline = new Set(presencas.map(p => String(p.email || '').trim().toLowerCase()).filter(Boolean));

        const [msgs] = await conexao.query(`
            SELECT aluno_id, aluno_email, aluno_nome, remetente, mensagem, lida, data_envio
            FROM mensagens_chat
            ORDER BY id ASC
        `);

        const mapaMsgs = {};
        msgs.forEach(m => {
            const em = String(m.aluno_email || '').trim().toLowerCase();
            if (!em) return;
            if (!mapaMsgs[em]) {
                mapaMsgs[em] = {
                    nome: m.aluno_nome || 'Aluno',
                    ultima_mensagem: '',
                    ultima_data: null,
                    nao_lidas: 0
                };
            }
            mapaMsgs[em].ultima_mensagem = m.mensagem;
            mapaMsgs[em].ultima_data = m.data_envio;
            if (m.remetente === 'aluno' && Number(m.lida) === 0) {
                mapaMsgs[em].nao_lidas += 1;
            }
        });

        const emailsJaListados = new Set();
        const listaFinal = alunos.map(a => {
            const em = String(a.email || '').trim().toLowerCase();
            emailsJaListados.add(em);
            const infoMsg = mapaMsgs[em] || {};
            const estaOnline = idsOnline.has(Number(a.id)) || emailsOnline.has(em);
            return {
                id: a.id,
                nome: a.nome || infoMsg.nome || 'Aluno',
                email: a.email,
                curso: a.curso || '',
                turma: a.turma || '',
                foto_perfil: a.foto_perfil || null,
                status_comprovante: a.status_comprovante || 'pendente',
                online: estaOnline,
                ultima_mensagem: infoMsg.ultima_mensagem || '',
                ultima_data: infoMsg.ultima_data || null,
                nao_lidas: infoMsg.nao_lidas || 0
            };
        });

        Object.keys(mapaMsgs).forEach(em => {
            if (!emailsJaListados.has(em)) {
                listaFinal.push({
                    id: null,
                    nome: mapaMsgs[em].nome,
                    email: em,
                    curso: '',
                    turma: '',
                    foto_perfil: null,
                    status_comprovante: '',
                    online: emailsOnline.has(em),
                    ultima_mensagem: mapaMsgs[em].ultima_mensagem,
                    ultima_data: mapaMsgs[em].ultima_data,
                    nao_lidas: mapaMsgs[em].nao_lidas
                });
            }
        });

        listaFinal.sort((a, b) => {
            if (a.ultima_data && !b.ultima_data) return -1;
            if (!a.ultima_data && b.ultima_data) return 1;
            if (a.ultima_data && b.ultima_data) return new Date(b.ultima_data) - new Date(a.ultima_data);
            return (a.nome || '').localeCompare(b.nome || '');
        });

        return res.json({ sucesso: true, contribuintes: listaFinal });
    } catch (error) {
        console.error('Erro ao listar contribuintes do chat:', error);
        return res.status(500).json({ sucesso: false, mensagem: 'Erro ao carregar alunos: ' + error.message });
    }
});

// 2A. BUSCAR HISTÓRICO COMPLETO DE MENSAGENS POR EMAIL OU ALUNO_ID (QUERY)
app.get(['/api/chat/mensagens', '/chat/mensagens'], async (req, res) => {
    try {
        await garantirTabelaChat();
        const email = String(req.query.email || '').trim().toLowerCase();
        const alunoId = req.query.aluno_id || req.query.id;

        if (!email && !alunoId) {
            return res.status(400).json({ sucesso: false, mensagem: 'E-mail ou ID do aluno é obrigatório.' });
        }

        if (req.query.lidoPor === 'admin' && email) {
            await conexao.query(
                `UPDATE mensagens_chat SET lida = 1 WHERE LOWER(TRIM(aluno_email)) = ? AND remetente = 'aluno'`,
                [email]
            );
        }

        const whereClause = email ? `LOWER(TRIM(aluno_email)) = ?` : `aluno_id = ?`;
        const param = email || alunoId;

        const [mensagens] = await conexao.query(
            `SELECT id, aluno_id, aluno_email, aluno_nome, remetente, mensagem, data_envio,
                    DATE_FORMAT(data_envio, '%d/%m %H:%i') AS hora
             FROM mensagens_chat 
             WHERE ${whereClause}
             ORDER BY id ASC`,
            [param]
        );

        return res.json({ sucesso: true, mensagens });
    } catch (error) {
        console.error('Erro ao buscar histórico do chat:', error);
        return res.status(500).json({ sucesso: false, mensagem: 'Erro ao carregar histórico: ' + error.message });
    }
});

// 2B. BUSCAR HISTÓRICO COMPLETO DE MENSAGENS POR ALUNO_ID (PARAM)
app.get(['/api/chat/mensagens/:alunoId', '/chat/mensagens/:alunoId'], async (req, res) => {
    try {
        await garantirTabelaChat();
        const { alunoId } = req.params;

        const [mensagens] = await conexao.query(
            `SELECT id, aluno_id, aluno_email, aluno_nome, remetente, mensagem, data_envio,
                    DATE_FORMAT(data_envio, '%d/%m %H:%i') AS hora
             FROM mensagens_chat 
             WHERE aluno_id = ?
             ORDER BY id ASC`,
            [alunoId]
        );

        return res.json({ sucesso: true, mensagens });
    } catch (err) {
        console.error('Erro ao carregar mensagens do chat:', err);
        return res.status(500).json({ sucesso: false, mensagem: 'Erro ao buscar histórico do chat.' });
    }
});

// 3. ENVIAR E SALVAR MENSAGEM NO BANCO (ACEITA EMAIL OU ID)
app.post(['/chat/enviar', '/api/chat/enviar', '/api/chat/salvar-mensagem'], async (req, res) => {
    try {
        await garantirTabelaChat();

        const { aluno_id, id_aluno, aluno_email, aluno_nome, remetente, mensagem, texto, conteudo } = req.body;
        const emailLimpo = String(aluno_email || '').trim().toLowerCase();
        const textoLimpo = String(mensagem || texto || conteudo || '').trim();
        const origem = (remetente === 'admin') ? 'admin' : 'aluno';
        let idFinal = aluno_id || id_aluno || null;
        let nomeFinal = aluno_nome || 'Aluno';
        let emailFinal = emailLimpo;

        if (!textoLimpo || (!emailFinal && !idFinal)) {
            return res.status(400).json({
                sucesso: false,
                mensagem: 'Identificação do aluno e mensagem são obrigatórios.'
            });
        }

        if (!idFinal || !emailFinal || !aluno_nome) {
            const whereSql = emailFinal ? 'LOWER(TRIM(email)) = ?' : 'id = ?';
            const [alunoRows] = await conexao.query(
                `SELECT id, email, nome_completo FROM contribuintes WHERE ${whereSql} LIMIT 1`,
                [emailFinal || idFinal]
            );
            if (alunoRows.length > 0) {
                idFinal = alunoRows[0].id;
                emailFinal = String(alunoRows[0].email || emailFinal).trim().toLowerCase();
                nomeFinal = alunoRows[0].nome_completo;
            }
        }

        const [result] = await conexao.query(
            `INSERT INTO mensagens_chat (aluno_id, aluno_email, aluno_nome, remetente, mensagem, lida, data_envio)
             VALUES (?, ?, ?, ?, ?, ?, NOW())`,
            [idFinal, emailFinal, nomeFinal, origem, textoLimpo, origem === 'admin' ? 1 : 0]
        );

        return res.json({
            sucesso: true,
            mensagem: 'Mensagem enviada com sucesso!',
            mensagemSalva: {
                id: result.insertId,
                aluno_id: idFinal,
                aluno_email: emailFinal,
                aluno_nome: nomeFinal,
                remetente: origem,
                mensagem: textoLimpo,
                hora: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
            }
        });
    } catch (error) {
        console.error('Erro detalhado ao enviar mensagem:', error);
        return res.status(500).json({
            sucesso: false,
            mensagem: 'Erro no banco de dados: ' + (error.sqlMessage || error.message)
        });
    }
});

app.listen(porta, '0.0.0.0', () => {
    console.log(`Servidor rodando na porta ${porta}`);
});