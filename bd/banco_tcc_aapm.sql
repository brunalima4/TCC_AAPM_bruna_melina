-- --------------------------------------------------------
-- Servidor:                     127.0.0.1
-- Versão do servidor:           12.3.3-MariaDB - MariaDB Server
-- OS do Servidor:               Win64
-- HeidiSQL Versão:              12.20.0.7320
-- --------------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;


-- Copiando estrutura do banco de dados para banco_projeto.sql
DROP DATABASE IF EXISTS `banco_projeto.sql`;
CREATE DATABASE IF NOT EXISTS `banco_projeto.sql` /*!40100 DEFAULT CHARACTER SET utf8mb3 COLLATE utf8mb3_bin */;
USE `banco_projeto.sql`;

-- Copiando estrutura para tabela banco_projeto.sql.administradores
DROP TABLE IF EXISTS `administradores`;
CREATE TABLE IF NOT EXISTS `administradores` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nome` varchar(100) NOT NULL,
  `login` varchar(50) NOT NULL,
  `senha` varchar(255) NOT NULL,
  `nif` varchar(50) DEFAULT NULL,
  `cargo` varchar(100) DEFAULT NULL,
  `email` varchar(150) DEFAULT NULL,
  `telefone` varchar(30) DEFAULT NULL,
  `foto_perfil` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `login` (`login`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_bin;

-- Copiando dados para a tabela banco_projeto.sql.administradores: ~1 rows (aproximadamente)
DELETE FROM `administradores`;
INSERT INTO `administradores` (`id`, `nome`, `login`, `senha`, `nif`, `cargo`, `email`, `telefone`, `foto_perfil`) VALUES
	(1, 'Administrador Master', 'admin', '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', NULL, NULL, NULL, NULL, NULL);

-- Copiando estrutura para tabela banco_projeto.sql.avisos
DROP TABLE IF EXISTS `avisos`;
CREATE TABLE IF NOT EXISTS `avisos` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `titulo` varchar(255) NOT NULL,
  `conteudo` text NOT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

-- Copiando dados para a tabela banco_projeto.sql.avisos: ~4 rows (aproximadamente)
DELETE FROM `avisos`;
INSERT INTO `avisos` (`id`, `titulo`, `conteudo`, `created_at`) VALUES
	(1, 'Manutenção na sala', 'dev', '2026-09-24 13:58:14'),
	(2, 'Queda de Internet', 'A internet da sala de DEV está passando por ajustes', '2026-10-01 12:53:44'),
	(3, 'Auditório', 'O auditório do Senai está passando por reformas', '2026-10-01 12:54:08'),
	(4, 'Marmitas', 'Não esqueça de pegar sua marmita ao final do dia!', '2026-10-01 12:54:24');

-- Copiando estrutura para tabela banco_projeto.sql.beneficios
DROP TABLE IF EXISTS `beneficios`;
CREATE TABLE IF NOT EXISTS `beneficios` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `titulo` varchar(255) NOT NULL,
  `categoria` varchar(100) NOT NULL,
  `descricao` text NOT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

-- Copiando dados para a tabela banco_projeto.sql.beneficios: ~4 rows (aproximadamente)
DELETE FROM `beneficios`;
INSERT INTO `beneficios` (`id`, `titulo`, `categoria`, `descricao`, `created_at`) VALUES
	(1, 'Garrafinha Exclusiva', 'Kit Aluno', 'garrafinha senai', '2026-10-01 12:49:47'),
	(2, 'Armário Individual', 'Kit Aluno', 'armário', '2026-10-01 12:50:36'),
	(3, 'Crachá', 'Kit Aluno', 'crachá exclusivo AAPM', '2026-10-01 12:50:59'),
	(4, 'Sorteios Mensais', 'Premiações', 'sorteios de voucher e brindes', '2026-10-01 12:51:26');

-- Copiando estrutura para tabela banco_projeto.sql.cadastroarmario
DROP TABLE IF EXISTS `cadastroarmario`;
CREATE TABLE IF NOT EXISTS `cadastroarmario` (
  `id` int(11) NOT NULL,
  `numero` int(11) DEFAULT NULL,
  `corredor` int(11) DEFAULT NULL,
  `fileira` int(11) DEFAULT NULL,
  `localizacao` int(11) DEFAULT NULL,
  `status` int(11) DEFAULT NULL,
  `idAluno` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_bin;

-- Copiando dados para a tabela banco_projeto.sql.cadastroarmario: ~0 rows (aproximadamente)
DELETE FROM `cadastroarmario`;

-- Copiando estrutura para tabela banco_projeto.sql.chat
DROP TABLE IF EXISTS `chat`;
CREATE TABLE IF NOT EXISTS `chat` (
  `id_mensagem` int(11) DEFAULT NULL,
  `mensagem` int(11) DEFAULT NULL,
  `idEnvio` int(11) DEFAULT NULL,
  `idDestino` int(11) DEFAULT NULL,
  `idLidos` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_bin;

-- Copiando dados para a tabela banco_projeto.sql.chat: ~0 rows (aproximadamente)
DELETE FROM `chat`;

-- Copiando estrutura para tabela banco_projeto.sql.contribuintes
DROP TABLE IF EXISTS `contribuintes`;
CREATE TABLE IF NOT EXISTS `contribuintes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nome_completo` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `matricula` varchar(50) DEFAULT NULL,
  `senha` varchar(255) NOT NULL,
  `data_nascimento` date DEFAULT NULL,
  `cpf` varchar(14) DEFAULT NULL,
  `turma` varchar(50) DEFAULT NULL,
  `num_armario` int(11) DEFAULT NULL,
  `data_associacao` datetime DEFAULT current_timestamp(),
  `comprovante` varchar(255) DEFAULT NULL,
  `status_comprovante` varchar(50) DEFAULT 'pendente',
  `data_cadastro` datetime DEFAULT current_timestamp(),
  `foto_perfil` varchar(255) DEFAULT NULL,
  `curso` varchar(150) DEFAULT NULL,
  `telefone` varchar(50) DEFAULT NULL,
  `turno` varchar(50) DEFAULT NULL,
  `pergunta` varchar(255) DEFAULT NULL,
  `resposta` varchar(255) DEFAULT NULL,
  `tipo` varchar(50) DEFAULT 'aluno',
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `cpf` (`cpf`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_bin;

-- Copiando dados para a tabela banco_projeto.sql.contribuintes: ~10 rows (aproximadamente)
DELETE FROM `contribuintes`;
INSERT INTO `contribuintes` (`id`, `nome_completo`, `email`, `matricula`, `senha`, `data_nascimento`, `cpf`, `turma`, `num_armario`, `data_associacao`, `comprovante`, `status_comprovante`, `data_cadastro`, `foto_perfil`, `curso`, `telefone`, `turno`, `pergunta`, `resposta`, `tipo`) VALUES
	(1, 'Bruna de Oliveira', 'brunalima@123', NULL, '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', '2009-01-20', NULL, NULL, NULL, '2026-04-28 15:36:13', NULL, 'recusado', '2026-09-24 08:59:39', '1791312359220-939291032.jpg', 'Gestor AAPM SENAI', '(18) 99999-8888', NULL, NULL, NULL, 'aluno'),
	(2, 'Bruna Oliveira', 'bb@gmail.com', NULL, '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', '2026-04-02', NULL, NULL, NULL, '2026-04-30 08:20:07', NULL, 'aprovado', '2026-09-24 08:59:39', NULL, NULL, NULL, NULL, NULL, NULL, 'aluno'),
	(3, 'Bruna', 'bruna123@gmail', NULL, '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', '2026-05-07', '123.456.789-00', 'dev2a', NULL, '2026-05-07 13:56:46', NULL, 'aprovado', '2026-09-24 08:59:39', '1790274553095-397789235.jpg', 'Desenvolvimento de Sistemas', '(18) 99999-8888', '2A', NULL, NULL, 'aluno'),
	(4, 'bruna', 'bruna@gmail.com', '25165333', '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', '2026-09-08', NULL, '1A', NULL, '2026-10-01 08:16:06', '1790853366283-804451555.jpg', 'aprovado', '2026-10-01 08:16:06', NULL, NULL, NULL, 'Manhã', 'Qual o nome do seu primeiro animal de estimação?', 'spike', 'aluno'),
	(6, 'bruna', 'bruna2@gmail.com', '25165333', '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', '2026-09-08', NULL, '1A', NULL, '2026-10-01 09:10:40', '1790856640725-933239552.jpg', 'aprovado', '2026-10-01 09:10:40', NULL, NULL, NULL, 'Manhã', 'Qual o nome do seu primeiro animal de estimação?', 'spike', 'aluno'),
	(7, 'ana silva', 'anasilva@gmail.com', '25165111', '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', '2026-10-03', NULL, 'administração', NULL, '2026-10-15 08:36:07', '1792064167636-488657596.png', 'aprovado', '2026-10-15 08:36:07', NULL, NULL, NULL, 'Noite', 'Qual é o nome da sua cidade natal?', 'prudente', 'aluno'),
	(8, 'lucas ferreira', 'lucas@gmail.com', '25165444', '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', '2026-10-01', NULL, 'eletroeletrônica', NULL, '2026-10-15 10:28:31', '1792070911231-935956436.png', 'aprovado', '2026-10-15 10:28:31', NULL, NULL, NULL, 'Manhã', 'Qual o nome do seu primeiro animal de estimação?', 'spike', 'aluno'),
	(10, 'mel', 'mel@email', '14725836', '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', '2008-09-27', NULL, 'dev', NULL, '2026-11-19 13:19:03', '1795105143345-734906719.png', 'aprovado', '2026-11-19 13:19:03', NULL, NULL, NULL, 'Integral', 'Qual é o nome da sua cidade natal?', 'spike', 'aluno'),
	(11, 'mario tomio', 'mario.tomio@email', '25165321', '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', '2009-01-20', NULL, '1º Ano - Turma B', NULL, '2026-11-19 15:46:08', '1795113968268-182933327.png', 'aprovado', '2026-11-19 15:46:08', NULL, 'Itinerário SESI/SENAI - Administração', NULL, 'Tarde', 'Qual o nome do seu primeiro animal de estimação?', 'spike', 'aluno'),
	(12, 'santiago augusto jr', 'santiago.jr@email', '25165354', '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', '2011-06-14', NULL, '2º Ano - Turma A', NULL, '2026-11-19 16:19:19', '1795115959189-975237076.png', 'aprovado', '2026-11-19 16:19:19', '1795116081288-371321422.jpg', 'Itinerário SESI/SENAI - Logística', '', 'Noite', 'Qual era o apelido da sua infância?', 'santinho', 'aluno');

-- Copiando estrutura para tabela banco_projeto.sql.eventos
DROP TABLE IF EXISTS `eventos`;
CREATE TABLE IF NOT EXISTS `eventos` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `titulo` varchar(255) NOT NULL,
  `data` date NOT NULL,
  `horario` varchar(50) NOT NULL,
  `local` varchar(255) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Copiando dados para a tabela banco_projeto.sql.eventos: ~5 rows (aproximadamente)
DELETE FROM `eventos`;
INSERT INTO `eventos` (`id`, `titulo`, `data`, `horario`, `local`) VALUES
	(1, 'Mundo SENAI', '2026-06-15', '17:00', 'Ginásio Poliesportivo'),
	(2, 'Workshop de TI', '2026-07-20', '08:30', 'Laboratório 05'),
	(3, 'Feira de Talentos', '2026-08-10', '14:00', 'Auditório Principal'),
	(4, 'Olimpíada', '2026-06-15', '17:00', 'Ginásio Poliesportivo'),
	(6, 'Formatura', '2026-12-15', '19:30', 'La Vie');

-- Copiando estrutura para tabela banco_projeto.sql.fale_conosco
DROP TABLE IF EXISTS `fale_conosco`;
CREATE TABLE IF NOT EXISTS `fale_conosco` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nome_usuario` varchar(200) NOT NULL DEFAULT '0',
  `email` varchar(200) NOT NULL DEFAULT '0',
  `telefone` varchar(50) DEFAULT '0',
  `assunto` varchar(100) NOT NULL DEFAULT '0',
  `mensagem` longtext NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_bin;

-- Copiando dados para a tabela banco_projeto.sql.fale_conosco: ~5 rows (aproximadamente)
DELETE FROM `fale_conosco`;
INSERT INTO `fale_conosco` (`id`, `nome_usuario`, `email`, `telefone`, `assunto`, `mensagem`) VALUES
	(1, 'Bruna', 'bb@gmail.com', '14 983456765', 'Assunto', 'Mensagem'),
	(2, 'mel', 'mel@gmail.com', '6567576666', 'assunto', 'jfuhfffhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhh'),
	(3, 'ANA', 'ana@gmail.com', '55555555555', 'rrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrr', 'thrwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww'),
	(4, 'Pedro Hild', 'pedroh@gmail.com', '6567576666', 'rrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrr', 'thrwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww'),
	(5, 'Bruna Lima', 'brunalima@', '1234567890', 'hgfyuegfyu4', 'dehfgyfguieguivybevchfevhfvyug4fyg4yuvgrh uihuir gurghtr');

-- Copiando estrutura para tabela banco_projeto.sql.inscricoes_eventos
DROP TABLE IF EXISTS `inscricoes_eventos`;
CREATE TABLE IF NOT EXISTS `inscricoes_eventos` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `evento_id` int(11) NOT NULL,
  `contribuinte_id` int(11) NOT NULL,
  `data_inscricao` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `evento_id` (`evento_id`),
  KEY `contribuinte_id` (`contribuinte_id`),
  CONSTRAINT `1` FOREIGN KEY (`evento_id`) REFERENCES `eventos` (`id`) ON DELETE CASCADE,
  CONSTRAINT `2` FOREIGN KEY (`contribuinte_id`) REFERENCES `contribuintes` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

-- Copiando dados para a tabela banco_projeto.sql.inscricoes_eventos: ~6 rows (aproximadamente)
DELETE FROM `inscricoes_eventos`;
INSERT INTO `inscricoes_eventos` (`id`, `evento_id`, `contribuinte_id`, `data_inscricao`) VALUES
	(2, 2, 3, '2026-10-06 13:43:35'),
	(3, 3, 3, '2026-10-06 13:43:40'),
	(4, 4, 3, '2026-10-06 13:48:31'),
	(5, 1, 3, '2026-10-06 14:01:12'),
	(6, 1, 1, '2026-11-19 15:15:52'),
	(7, 1, 10, '2026-11-19 15:16:26');

-- Copiando estrutura para tabela banco_projeto.sql.inscricoes_oficinas
DROP TABLE IF EXISTS `inscricoes_oficinas`;
CREATE TABLE IF NOT EXISTS `inscricoes_oficinas` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `oficina_id` int(11) NOT NULL,
  `contribuinte_id` int(11) NOT NULL,
  `data_inscricao` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_inscricao_oficina` (`oficina_id`,`contribuinte_id`),
  KEY `contribuinte_id` (`contribuinte_id`),
  CONSTRAINT `1` FOREIGN KEY (`oficina_id`) REFERENCES `oficinas` (`id`) ON DELETE CASCADE,
  CONSTRAINT `2` FOREIGN KEY (`contribuinte_id`) REFERENCES `contribuintes` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_bin;

-- Copiando dados para a tabela banco_projeto.sql.inscricoes_oficinas: ~4 rows (aproximadamente)
DELETE FROM `inscricoes_oficinas`;
INSERT INTO `inscricoes_oficinas` (`id`, `oficina_id`, `contribuinte_id`, `data_inscricao`) VALUES
	(1, 1, 3, '2026-09-24 13:38:59'),
	(3, 2, 1, '2026-11-19 15:08:03'),
	(4, 2, 10, '2026-11-19 15:10:28'),
	(5, 1, 1, '2026-11-19 15:16:43');

-- Copiando estrutura para tabela banco_projeto.sql.leituranotificacao
DROP TABLE IF EXISTS `leituranotificacao`;
CREATE TABLE IF NOT EXISTS `leituranotificacao` (
  `Coluna 1` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_bin;

-- Copiando dados para a tabela banco_projeto.sql.leituranotificacao: ~0 rows (aproximadamente)
DELETE FROM `leituranotificacao`;

-- Copiando estrutura para tabela banco_projeto.sql.login
DROP TABLE IF EXISTS `login`;
CREATE TABLE IF NOT EXISTS `login` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `login` varchar(100) NOT NULL,
  `senha` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_bin;

-- Copiando dados para a tabela banco_projeto.sql.login: ~4 rows (aproximadamente)
DELETE FROM `login`;
INSERT INTO `login` (`id`, `login`, `senha`) VALUES
	(1, 'brunalima', '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92'),
	(3, 'melina', '8bb0cf6eb9b17d0f7d22b456f121257dc1254e1f01665370476383ea776df414'),
	(4, 'brunateste', '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92'),
	(5, 'bruna30', '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92');

-- Copiando estrutura para tabela banco_projeto.sql.mensagens_chat
DROP TABLE IF EXISTS `mensagens_chat`;
CREATE TABLE IF NOT EXISTS `mensagens_chat` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `aluno_id` int(11) DEFAULT NULL,
  `aluno_email` varchar(150) NOT NULL,
  `aluno_nome` varchar(150) DEFAULT NULL,
  `remetente` varchar(20) NOT NULL,
  `mensagem` text NOT NULL,
  `lida` tinyint(1) DEFAULT 0,
  `data_envio` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_bin;

-- Copiando dados para a tabela banco_projeto.sql.mensagens_chat: ~4 rows (aproximadamente)
DELETE FROM `mensagens_chat`;
INSERT INTO `mensagens_chat` (`id`, `aluno_id`, `aluno_email`, `aluno_nome`, `remetente`, `mensagem`, `lida`, `data_envio`) VALUES
	(1, 11, 'mario.tomio@email', 'mario tomio', 'admin', 'oi', 1, '2026-11-19 16:06:47'),
	(2, 11, 'mario.tomio@email', 'mario tomio', 'aluno', 'olá', 1, '2026-11-19 16:08:25'),
	(3, 3, 'bruna123@gmail', 'Bruna', 'aluno', 'tudo bem', 1, '2026-11-19 16:09:54'),
	(4, 12, 'santiago.jr@email', 'santiago augusto jr', 'aluno', 'olá', 1, '2026-11-19 16:38:29');

-- Copiando estrutura para tabela banco_projeto.sql.notificacoes
DROP TABLE IF EXISTS `notificacoes`;
CREATE TABLE IF NOT EXISTS `notificacoes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tipo` varchar(30) NOT NULL,
  `titulo` varchar(150) NOT NULL,
  `mensagem` text NOT NULL,
  `link` varchar(100) NOT NULL,
  `data_criacao` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_bin;

-- Copiando dados para a tabela banco_projeto.sql.notificacoes: ~3 rows (aproximadamente)
DELETE FROM `notificacoes`;
INSERT INTO `notificacoes` (`id`, `tipo`, `titulo`, `mensagem`, `link`, `data_criacao`) VALUES
	(1, 'evento', 'Novo Evento Disponível', 'Um novo evento está disponível: "Formatura" — dia 15/12/2026 às 19:30 (La Vie).', 'eventos.html', '2026-11-12 16:30:29'),
	(2, 'evento', 'Novo Evento Disponível', 'Um novo evento está disponível: "Formatura" — dia 15/12/2026 às 19:30 (La Vie).', 'eventos.html', '2026-11-12 16:36:52'),
	(3, 'oficina', 'Nova Oficina Disponível', 'Uma nova oficina está disponível: "Impressao 3D" (Terças, Sextas das 13:00 às 15:00 (20/11/2026)) — Local: Sala de Eletro eletrônica 2 (12 vagas).', 'oficinas.html', '2026-11-19 09:55:48');

-- Copiando estrutura para tabela banco_projeto.sql.notificacoes_lidas
DROP TABLE IF EXISTS `notificacoes_lidas`;
CREATE TABLE IF NOT EXISTS `notificacoes_lidas` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `notificacao_id` int(11) NOT NULL,
  `aluno_id` int(11) NOT NULL,
  `data_leitura` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_leitura` (`notificacao_id`,`aluno_id`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_bin;

-- Copiando dados para a tabela banco_projeto.sql.notificacoes_lidas: ~8 rows (aproximadamente)
DELETE FROM `notificacoes_lidas`;
INSERT INTO `notificacoes_lidas` (`id`, `notificacao_id`, `aluno_id`, `data_leitura`) VALUES
	(1, 1, 3, '2026-11-12 16:37:26'),
	(2, 2, 3, '2026-11-12 16:37:26'),
	(5, 3, 11, '2026-11-19 15:52:21'),
	(7, 2, 11, '2026-11-19 15:52:25'),
	(8, 1, 11, '2026-11-19 15:52:27'),
	(9, 1, 12, '2026-11-19 16:38:12'),
	(10, 2, 12, '2026-11-19 16:38:12'),
	(11, 3, 12, '2026-11-19 16:38:12');

-- Copiando estrutura para tabela banco_projeto.sql.oficinas
DROP TABLE IF EXISTS `oficinas`;
CREATE TABLE IF NOT EXISTS `oficinas` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `titulo` varchar(100) NOT NULL,
  `descricao` text NOT NULL,
  `horario` varchar(100) NOT NULL,
  `local` varchar(100) NOT NULL,
  `vagas` int(11) DEFAULT 5,
  `status` varchar(50) DEFAULT 'Inscrições Abertas',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_bin;

-- Copiando dados para a tabela banco_projeto.sql.oficinas: ~2 rows (aproximadamente)
DELETE FROM `oficinas`;
INSERT INTO `oficinas` (`id`, `titulo`, `descricao`, `horario`, `local`, `vagas`, `status`) VALUES
	(1, 'Robótica', 'oficina', 'Segundas, Terças • das 10:35 às 11:35 (05/11/2026)', 'Sala DEV', 4, 'Inscrições Abertas'),
	(2, 'Impressao 3D', 'Oficina de impressão 3D', 'Terças, Sextas das 13:00 às 15:00 (20/11/2026)', 'Sala de Eletro eletrônica 2', 12, 'Inscrições Abertas');

-- Copiando estrutura para tabela banco_projeto.sql.presenca_chat
DROP TABLE IF EXISTS `presenca_chat`;
CREATE TABLE IF NOT EXISTS `presenca_chat` (
  `chave_presenca` varchar(180) NOT NULL,
  `usuario_id` int(11) DEFAULT NULL,
  `email` varchar(150) DEFAULT NULL,
  `tipo` varchar(20) NOT NULL DEFAULT 'aluno',
  `ultimo_visto` datetime NOT NULL,
  PRIMARY KEY (`chave_presenca`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_bin;

-- Copiando dados para a tabela banco_projeto.sql.presenca_chat: ~2 rows (aproximadamente)
DELETE FROM `presenca_chat`;
INSERT INTO `presenca_chat` (`chave_presenca`, `usuario_id`, `email`, `tipo`, `ultimo_visto`) VALUES
	('admin:1', 1, 'admin', 'admin', '2026-11-19 16:42:30'),
	('aluno:12', 12, 'santiago.jr@email', 'aluno', '2026-11-19 16:42:17');

-- Copiando estrutura para tabela banco_projeto.sql.sugestoes
DROP TABLE IF EXISTS `sugestoes`;
CREATE TABLE IF NOT EXISTS `sugestoes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `usuario_id` int(11) DEFAULT NULL,
  `nome` varchar(100) DEFAULT 'Anônimo',
  `matricula` varchar(50) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `mensagem` text NOT NULL,
  `status` enum('pendente','lido','respondido') DEFAULT 'pendente',
  `resposta` text DEFAULT NULL,
  `data_envio` timestamp NULL DEFAULT current_timestamp(),
  `data_atualizacao` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_bin;

-- Copiando dados para a tabela banco_projeto.sql.sugestoes: ~1 rows (aproximadamente)
DELETE FROM `sugestoes`;
INSERT INTO `sugestoes` (`id`, `usuario_id`, `nome`, `matricula`, `email`, `mensagem`, `status`, `resposta`, `data_envio`, `data_atualizacao`) VALUES
	(1, 1, 'Bruna de Oliveira', NULL, 'brunalima@123', 'muito bom', 'pendente', NULL, '2026-10-06 19:34:09', '2026-10-06 19:34:09');

-- Copiando estrutura para tabela banco_projeto.sql.vinculoarmario
DROP TABLE IF EXISTS `vinculoarmario`;
CREATE TABLE IF NOT EXISTS `vinculoarmario` (
  `id` int(11) NOT NULL,
  `usuario` varchar(50) DEFAULT NULL,
  `armario` int(11) DEFAULT NULL,
  `data_contribuicao` date DEFAULT NULL,
  `data_devolucao` date DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_bin;

-- Copiando dados para a tabela banco_projeto.sql.vinculoarmario: ~0 rows (aproximadamente)
DELETE FROM `vinculoarmario`;

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
