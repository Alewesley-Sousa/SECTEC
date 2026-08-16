SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;

-- --------------------------------------------------------
-- 1. ATUALIZAR TABELA: usuarios
-- Adicionar a role 'avaliador' no ENUM da coluna 'role_cargo'
-- --------------------------------------------------------
ALTER TABLE `usuarios` 
  MODIFY COLUMN `role_cargo` ENUM('aluno','orientador','coordenador','avaliador') NOT NULL;

-- --------------------------------------------------------
-- 2. ATUALIZAR TABELA: projetos
-- Adicionar coluna para armazenar o QR Code único do projeto
-- --------------------------------------------------------
ALTER TABLE `projetos` 
  ADD COLUMN `qr_code` VARCHAR(255) DEFAULT NULL UNIQUE AFTER `descricao`,
  ADD COLUMN `status` ENUM('EM_RASCUNHO', 'SUBMETIDO', 'APROVADO', 'RECUSADO') DEFAULT 'APROVADO' AFTER `qr_code`;

-- --------------------------------------------------------
-- 3. NOVA TABELA: avaliador_projetos (Distribuição Automática / Sorteio)
-- Controla os projetos atribuídos a cada avaliador
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

-- --------------------------------------------------------
-- 4. NOVA TABELA: avaliacoes
-- Armazena a avaliação e a nota final consolidada do avaliador
-- --------------------------------------------------------
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

-- --------------------------------------------------------
-- 5. NOVA TABELA: avaliacao_criterios
-- Armazena a nota individual de cada critério
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `avaliacao_criterios` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `avaliacao_id` INT(11) NOT NULL,
  `criterio_nome` VARCHAR(100) NOT NULL,
  `nota` DECIMAL(4,2) NOT NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_ac_avaliacao` FOREIGN KEY (`avaliacao_id`) REFERENCES `avaliacoes` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

COMMIT;