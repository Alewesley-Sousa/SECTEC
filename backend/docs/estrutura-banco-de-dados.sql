SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;

-- --------------------------------------------------------
-- 1. TABELA: usuarios
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `usuarios` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `nome` VARCHAR(255) NOT NULL,
  `email_institucional` VARCHAR(255) NOT NULL UNIQUE,
  `role_cargo` ENUM('aluno','orientador','coordenador','comissao','avaliador') NOT NULL,
  `senha` VARCHAR(255) NOT NULL,
  `ativo` TINYINT(1) DEFAULT 1,
  `ano` INT(11) DEFAULT 1,
  `ano_progressao_processado` INT(11) DEFAULT NULL,
  `turma` ENUM('informatica','enfermagem','contabilidade') DEFAULT NULL,
  `criado_em` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 2. TABELA: eventos e temas
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `eventos` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `titulo` VARCHAR(255) NOT NULL,
  `descricao` TEXT DEFAULT NULL,
  `inscricao_inicio` DATETIME DEFAULT NULL,
  `inscricao_fim` DATETIME DEFAULT NULL,
  `submissao_inicio` DATETIME DEFAULT NULL,
  `submissao_fim` DATETIME DEFAULT NULL,
  `avaliacao_inicio` DATETIME DEFAULT NULL,
  `avaliacao_fim` DATETIME DEFAULT NULL,
  `coordenador_id` INT(11) DEFAULT NULL,
  `prazo_inicial` DATETIME DEFAULT NULL,
  `prazo_final` DATETIME DEFAULT NULL,
  `status` ENUM('ativo','inativo') DEFAULT 'ativo',
  `criado_em` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `atualizado_em` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_eventos_coordenador` FOREIGN KEY (`coordenador_id`) REFERENCES `usuarios` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `tema_eventos` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `nome` VARCHAR(255) NOT NULL,
  `evento_id` INT(11) NOT NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_te_evento` FOREIGN KEY (`evento_id`) REFERENCES `eventos` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 3. TABELA: projetos
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `projetos` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `titulo` VARCHAR(255) NOT NULL,
  `descricao` TEXT DEFAULT NULL,
  `qr_code` VARCHAR(255) DEFAULT NULL UNIQUE,
  `status` ENUM('EM_RASCUNHO', 'SUBMETIDO', 'APROVADO', 'RECUSADO') DEFAULT 'APROVADO',
  `tema_id` INT(11) DEFAULT NULL,
  `evento_id` INT(11) NOT NULL,
  `aluno_autor_id` INT(11) NOT NULL,
  `criado_em` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_projetos_tema` FOREIGN KEY (`tema_id`) REFERENCES `tema_eventos` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_projetos_evento` FOREIGN KEY (`evento_id`) REFERENCES `eventos` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_projetos_autor` FOREIGN KEY (`aluno_autor_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 4. TABELAS: avaliacoes e avaliador_projetos
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `avaliador_projetos` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `projeto_id` INT(11) NOT NULL,
  `avaliador_id` INT(11) NOT NULL,
  `status` ENUM('pendente', 'avaliado') DEFAULT 'pendente',
  `data_atribuicao` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `data_avaliacao` DATETIME DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_avaliador_projeto` (`projeto_id`, `avaliador_id`),
  CONSTRAINT `fk_ap_projeto` FOREIGN KEY (`projeto_id`) REFERENCES `projetos` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_ap_avaliador` FOREIGN KEY (`avaliador_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `avaliacoes` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `projeto_id` INT(11) NOT NULL,
  `avaliador_id` INT(11) NOT NULL,
  `nota_final` DECIMAL(4,2) NOT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_avaliacao_unica` (`projeto_id`, `avaliador_id`),
  CONSTRAINT `fk_av_projeto` FOREIGN KEY (`projeto_id`) REFERENCES `projetos` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_av_avaliador` FOREIGN KEY (`avaliador_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `avaliacao_criterios` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `avaliacao_id` INT(11) NOT NULL,
  `criterio_nome` VARCHAR(100) NOT NULL,
  `nota` DECIMAL(4,2) NOT NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_ac_avaliacao` FOREIGN KEY (`avaliacao_id`) REFERENCES `avaliacoes` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

COMMIT;