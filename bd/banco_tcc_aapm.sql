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
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;

-- Copiando dados para a tabela banco_projeto.sql.contribuintes: ~0 rows (aproximadamente)
DELETE FROM `contribuintes`;

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

-- Copiando dados para a tabela banco_projeto.sql.fale_conosco: ~4 rows (aproximadamente)
DELETE FROM `fale_conosco`;
INSERT INTO `fale_conosco` (`id`, `nome_usuario`, `email`, `telefone`, `assunto`, `mensagem`) VALUES
	(1, 'Bruna', 'bb@gmail.com', '14 983456765', 'Assunto', 'Mensagem'),
	(2, 'mel', 'mel@gmail.com', '6567576666', 'assunto', 'jfuhfffhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhh'),
	(3, 'ANA', 'ana@gmail.com', '55555555555', 'rrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrr', 'thrwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww'),
	(4, 'Pedro Hild', 'pedroh@gmail.com', '6567576666', 'rrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrr', 'thrwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww'),
	(5, 'Bruna Lima', 'brunalima@', '1234567890', 'hgfyuegfyu4', 'dehfgyfguieguivybevchfevhfvyug4fyg4yuvgrh uihuir gurghtr');

-- Copiando estrutura para tabela banco_projeto.sql.login
DROP TABLE IF EXISTS `login`;
CREATE TABLE IF NOT EXISTS `login` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `login` varchar(100) NOT NULL,
  `senha` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8 COLLATE=utf8_bin;

-- Copiando dados para a tabela banco_projeto.sql.login: ~2 rows (aproximadamente)
DELETE FROM `login`;
INSERT INTO `login` (`id`, `login`, `senha`) VALUES
	(1, 'brunalima', '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92'),
	(3, 'melina', '8bb0cf6eb9b17d0f7d22b456f121257dc1254e1f01665370476383ea776df414');

-- Copiando estrutura para tabela banco_projeto.sql.eventos
DROP TABLE IF EXISTS `eventos`;
CREATE TABLE IF NOT EXISTS `eventos` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `titulo` varchar(200) NOT NULL,
  `data` date NOT NULL,
  `hora` varchar(50) NOT NULL,
  `local` varchar(200) NOT NULL,
  `icone` varchar(10) DEFAULT '🔔',
  `tipo` varchar(50) DEFAULT 'Geral',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;

-- Copiando dados para a tabela banco_projeto.sql.eventos: ~6 rows (aproximadamente)
DELETE FROM `eventos`;
INSERT INTO `eventos` (`id`, `titulo`, `data`, `hora`, `local`, `icone`, `tipo`) VALUES
	(1, 'Feira de Ciências', '2025-06-15', '08:00 - 17:00', 'Auditório Principal', '🔬', 'Acadêmico'),
	(2, 'Campeonato de Futsal', '2025-06-22', '14:00 - 18:00', 'Quadra Poliesportiva', '⚽', 'Esporte'),
	(3, 'Workshop de Robótica', '2025-07-05', '09:00 - 12:00', 'Laboratório de Informática', '🤖', 'Tecnologia'),
	(4, 'Dia da Família', '2025-07-12', '10:00 - 16:00', 'Área externa do SENAI', '👨‍👩‍👧‍👦', 'Social'),
	(5, 'Semana da Indústria', '2025-08-18', '08:00 - 18:00', 'Hall de Entrada', '🏭', 'Acadêmico'),
	(6, 'Gincana Cultural', '2025-08-25', '13:00 - 17:00', 'Pátio Central', '🎭', 'Cultural');

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
