-- --------------------------------------------------------
-- Servidor:                     127.0.0.1
-- Versão do servidor:           10.4.32-MariaDB - mariadb.org binary distribution
-- OS do Servidor:               Win64
-- HeidiSQL Versão:              12.12.0.7122
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
CREATE DATABASE IF NOT EXISTS `banco_projeto.sql` /*!40100 DEFAULT CHARACTER SET utf8 COLLATE utf8_bin */;
USE `banco_projeto.sql`;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;

-- Copiando dados para a tabela banco_projeto.sql.chat: ~0 rows (aproximadamente)
DELETE FROM `chat`;

-- Copiando estrutura para tabela banco_projeto.sql.contribuintes
DROP TABLE IF EXISTS `contribuintes`;
CREATE TABLE IF NOT EXISTS `contribuintes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nome_completo` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `senha` varchar(255) NOT NULL,
  `tipo` enum('aluno','adm') DEFAULT 'aluno',
  `data_nascimento` date DEFAULT NULL,
  `cpf` varchar(14) DEFAULT NULL,
  `turma` varchar(50) DEFAULT NULL,
  `num_armario` int(11) DEFAULT NULL,
  `data_associacao` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `cpf` (`cpf`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8 COLLATE=utf8_bin;

-- Copiando dados para a tabela banco_projeto.sql.contribuintes: ~3 rows (aproximadamente)
DELETE FROM `contribuintes`;
INSERT INTO `contribuintes` (`id`, `nome_completo`, `email`, `senha`, `tipo`, `data_nascimento`, `cpf`, `turma`, `num_armario`, `data_associacao`) VALUES
	(1, 'Bruna de Oliveira Lima', 'brunalima@123', '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', 'aluno', '2009-01-20', NULL, NULL, NULL, '2026-04-28 15:36:13'),
	(2, 'Bruna Oliveira', 'bb@gmail.com', '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', 'aluno', '2026-04-02', NULL, NULL, NULL, '2026-04-30 08:20:07'),
	(3, 'Bruna', 'bruna123@gmail', '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', 'aluno', '2026-05-07', NULL, NULL, NULL, '2026-05-07 13:56:46');

-- Copiando estrutura para tabela banco_projeto.sql.eventos
DROP TABLE IF EXISTS `eventos`;
CREATE TABLE IF NOT EXISTS `eventos` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `titulo` varchar(255) NOT NULL,
  `data` date NOT NULL,
  `horario` varchar(50) NOT NULL,
  `local` varchar(255) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Copiando dados para a tabela banco_projeto.sql.eventos: ~3 rows (aproximadamente)
DELETE FROM `eventos`;
INSERT INTO `eventos` (`id`, `titulo`, `data`, `horario`, `local`) VALUES
	(1, 'Mundo SENAI', '2026-06-15', '19:00', 'Ginásio Poliesportivo'),
	(2, 'Workshop de TI', '2026-07-20', '08:30', 'Laboratório 05'),
	(3, 'Feira de Talentos', '2026-08-10', '14:00', 'Auditório Principal');

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
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8 COLLATE=utf8_bin;

-- Copiando dados para a tabela banco_projeto.sql.fale_conosco: ~5 rows (aproximadamente)
DELETE FROM `fale_conosco`;
INSERT INTO `fale_conosco` (`id`, `nome_usuario`, `email`, `telefone`, `assunto`, `mensagem`) VALUES
	(1, 'Bruna', 'bb@gmail.com', '14 983456765', 'Assunto', 'Mensagem'),
	(2, 'mel', 'mel@gmail.com', '6567576666', 'assunto', 'jfuhfffhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhh'),
	(3, 'ANA', 'ana@gmail.com', '55555555555', 'rrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrr', 'thrwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww'),
	(4, 'Pedro Hild', 'pedroh@gmail.com', '6567576666', 'rrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrr', 'thrwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww'),
	(5, 'Bruna Lima', 'brunalima@', '1234567890', 'hgfyuegfyu4', 'dehfgyfguieguivybevchfevhfvyug4fyg4yuvgrh uihuir gurghtr');

-- Copiando estrutura para tabela banco_projeto.sql.leituranotificacao
DROP TABLE IF EXISTS `leituranotificacao`;
CREATE TABLE IF NOT EXISTS `leituranotificacao` (
  `Coluna 1` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;

-- Copiando dados para a tabela banco_projeto.sql.leituranotificacao: ~0 rows (aproximadamente)
DELETE FROM `leituranotificacao`;

-- Copiando estrutura para tabela banco_projeto.sql.login
DROP TABLE IF EXISTS `login`;
CREATE TABLE IF NOT EXISTS `login` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `login` varchar(100) NOT NULL,
  `senha` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8 COLLATE=utf8_bin;

-- Copiando dados para a tabela banco_projeto.sql.login: ~4 rows (aproximadamente)
DELETE FROM `login`;
INSERT INTO `login` (`id`, `login`, `senha`) VALUES
	(1, 'brunalima', '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92'),
	(3, 'melina', '8bb0cf6eb9b17d0f7d22b456f121257dc1254e1f01665370476383ea776df414'),
	(4, 'brunateste', '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92'),
	(5, 'bruna30', '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92');

-- Copiando estrutura para tabela banco_projeto.sql.vinculoarmario
DROP TABLE IF EXISTS `vinculoarmario`;
CREATE TABLE IF NOT EXISTS `vinculoarmario` (
  `id` int(11) NOT NULL,
  `usuario` varchar(50) DEFAULT NULL,
  `armario` int(11) DEFAULT NULL,
  `data_contribuicao` date DEFAULT NULL,
  `data_devolucao` date DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;

-- Copiando dados para a tabela banco_projeto.sql.vinculoarmario: ~0 rows (aproximadamente)
DELETE FROM `vinculoarmario`;

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
