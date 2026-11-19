<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Configurações do Banco de Dados
$host = '127.0.0.1';
$db   = 'banco_projeto.sql'; // Nome exatamente como está no arquivo fornecido
$user = 'root'; 
$pass = '';     

try {
    $pdo = new PDO("mysql:host=$host;dbname=$db;charset=utf8mb4", $user, $pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
    ]);
} catch (PDOException $e) {
    echo json_encode(['sucesso' => false, 'mensagem' => 'Erro na conexão com o banco: ' . $e->getMessage()]);
    exit;
}

$action = $_GET['action'] ?? '';

// --- CADASTRO ---
if ($action === 'cadastrar' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);

    $nome = $input['nome_completo'] ?? '';
    $email = strtolower(trim($input['email'] ?? ''));
    $senha = $input['senha'] ?? '';
    $data_nasc = $input['data_nascimento'] ?? null;
    $cpf = $input['cpf'] ?? null;
    $turma = $input['turma'] ?? null;

    if (empty($nome) || empty($email) || empty($senha)) {
        echo json_encode(['sucesso' => false, 'mensagem' => 'Preencha os campos obrigatórios!']);
        exit;
    }

    // Verificar se e-mail já existe
    $stmt = $pdo->prepare("SELECT id FROM contribuintes WHERE email = ?");
    $stmt->execute([$email]);
    if ($stmt->fetch()) {
        echo json_encode(['sucesso' => false, 'mensagem' => 'E-mail já cadastrado!']);
        exit;
    }

    // O banco usa hash SHA-256 de 64 caracteres
    $senhaHash = hash('sha256', $senha);

    $sql = "INSERT INTO contribuintes (nome_completo, email, senha, data_nascimento, cpf, turma, tipo) 
            VALUES (?, ?, ?, ?, ?, ?, 'aluno')";
    $stmt = $pdo->prepare($sql);
    $sucesso = $stmt->execute([$nome, $email, $senhaHash, $data_nasc, $cpf, $turma]);

    if ($sucesso) {
        // Salva também na tabela 'login' para manter a paridade
        $stmtLogin = $pdo->prepare("INSERT INTO login (login, senha) VALUES (?, ?)");
        $stmtLogin->execute([$email, $senhaHash]);

        echo json_encode(['sucesso' => true, 'mensagem' => 'Cadastro realizado com sucesso!']);
    } else {
        echo json_encode(['sucesso' => false, 'mensagem' => 'Erro ao cadastrar.']);
    }
    exit;
}

// --- LOGIN ---
if ($action === 'login' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $email = strtolower(trim($input['email'] ?? ''));
    $senha = $input['senha'] ?? '';

    $senhaHash = hash('sha256', $senha);

    $stmt = $pdo->prepare("SELECT id, nome_completo, email, tipo FROM contribuintes WHERE email = ? AND senha = ?");
    $stmt->execute([$email, $senhaHash]);
    $usuario = $stmt->fetch();

    if ($usuario) {
        echo json_encode(['sucesso' => true, 'usuario' => $usuario]);
    } else {
        echo json_encode(['sucesso' => false, 'mensagem' => 'E-mail ou senha inválidos!']);
    }
    exit;
}
?>