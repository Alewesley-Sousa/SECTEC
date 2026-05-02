SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Banco de dados: `sectec`
--

-- --------------------------------------------------------

--
-- Estrutura da tabela `eventos`
--

CREATE TABLE `eventos` (
  `id` int(11) NOT NULL,
  `titulo` varchar(255) NOT NULL,
  `descricao` text DEFAULT NULL,
  `coordenador_id` int(11) DEFAULT NULL,
  `prazo_inicial` datetime NOT NULL,
  `prazo_final` datetime NOT NULL,
  `criado_em` timestamp NOT NULL DEFAULT current_timestamp(),
  `atualizado_em` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=sjis COLLATE=sjis_japanese_ci;

-- --------------------------------------------------------

--
-- Estrutura da tabela `logs_auditoria`
--

CREATE TABLE `logs_auditoria` (
  `id` int(11) NOT NULL,
  `usuario_id` int(11) NOT NULL,
  `projeto_id` int(11) DEFAULT NULL,
  `acao` varchar(100) NOT NULL,
  `detalhe` text DEFAULT NULL,
  `feito_em` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=sjis COLLATE=sjis_japanese_ci;

-- --------------------------------------------------------

--
-- Estrutura da tabela `projetos`
--

CREATE TABLE `projetos` (
  `id` int(11) NOT NULL,
  `evento_id` int(11) NOT NULL,
  `aluno_autor_id` int(11) NOT NULL,
  `titulo` varchar(255) NOT NULL,
  `tema` varchar(100) DEFAULT NULL,
  `sub_tema` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=sjis COLLATE=sjis_japanese_ci;

-- --------------------------------------------------------

--
-- Estrutura da tabela `projeto_alunos`
--

CREATE TABLE `projeto_alunos` (
  `id` int(11) NOT NULL,
  `projeto_id` int(11) NOT NULL,
  `aluno_id` int(11) NOT NULL,
  `criado_em` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=sjis COLLATE=sjis_japanese_ci;

-- --------------------------------------------------------

--
-- Estrutura da tabela `projeto_materiais`
--

CREATE TABLE `projeto_materiais` (
  `id` int(11) NOT NULL,
  `projeto_id` int(11) NOT NULL,
  `tipo` enum('pdf','link') NOT NULL,
  `status` enum('em_analise','aprovado','recusado') DEFAULT 'em_analise',
  `conteudo` text NOT NULL,
  `opiniao` text NOT NULL,
  `criado_em` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=sjis COLLATE=sjis_japanese_ci;

-- --------------------------------------------------------

--
-- Estrutura da tabela `projeto_orientador`
--

CREATE TABLE `projeto_orientador` (
  `id` int(11) NOT NULL,
  `projeto_id` int(11) NOT NULL,
  `orientador_id` int(11) NOT NULL,
  `status` enum('pendente','aceito','recusado') DEFAULT 'pendente',
  `respondido_em` datetime DEFAULT NULL,
  `criado_em` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=sjis COLLATE=sjis_japanese_ci;

-- --------------------------------------------------------

--
-- Estrutura da tabela `usuarios`
--

CREATE TABLE `usuarios` (
  `id` int(11) NOT NULL,
  `nome` varchar(255) NOT NULL,
  `email_institucional` varchar(255) NOT NULL,
  `role_cargo` enum('aluno','orientador','coordenador') NOT NULL,
  `ativo` tinyint(1) DEFAULT 1,
  `criado_em` timestamp NOT NULL DEFAULT current_timestamp(),
  `senha` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=sjis COLLATE=sjis_japanese_ci;

--
-- Índices para tabelas despejadas
--

--
-- Índices para tabela `eventos`
--
ALTER TABLE `eventos`
  ADD PRIMARY KEY (`id`),
  ADD KEY `coordenador_id` (`coordenador_id`);

--
-- Índices para tabela `logs_auditoria`
--
ALTER TABLE `logs_auditoria`
  ADD PRIMARY KEY (`id`),
  ADD KEY `usuario_id` (`usuario_id`),
  ADD KEY `projeto_id` (`projeto_id`);

--
-- Índices para tabela `projetos`
--
ALTER TABLE `projetos`
  ADD PRIMARY KEY (`id`),
  ADD KEY `evento_id` (`evento_id`),
  ADD KEY `aluno_autor_id` (`aluno_autor_id`);

--
-- Índices para tabela `projeto_alunos`
--
ALTER TABLE `projeto_alunos`
  ADD PRIMARY KEY (`id`),
  ADD KEY `projeto_id` (`projeto_id`),
  ADD KEY `aluno_id` (`aluno_id`);

--
-- Índices para tabela `projeto_materiais`
--
ALTER TABLE `projeto_materiais`
  ADD PRIMARY KEY (`id`),
  ADD KEY `projeto_id` (`projeto_id`);

--
-- Índices para tabela `projeto_orientador`
--
ALTER TABLE `projeto_orientador`
  ADD PRIMARY KEY (`id`),
  ADD KEY `projeto_id` (`projeto_id`),
  ADD KEY `orientador_id` (`orientador_id`);

--
-- Índices para tabela `usuarios`
--
ALTER TABLE `usuarios`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email_institucional` (`email_institucional`);

--
-- AUTO_INCREMENT de tabelas despejadas
--

--
-- AUTO_INCREMENT de tabela `eventos`
--
ALTER TABLE `eventos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `logs_auditoria`
--
ALTER TABLE `logs_auditoria`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `projetos`
--
ALTER TABLE `projetos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `projeto_alunos`
--
ALTER TABLE `projeto_alunos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `projeto_materiais`
--
ALTER TABLE `projeto_materiais`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `projeto_orientador`
--
ALTER TABLE `projeto_orientador`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `usuarios`
--
ALTER TABLE `usuarios`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- Restrições para despejos de tabelas
--

--
-- Limitadores para a tabela `eventos`
--
ALTER TABLE `eventos`
  ADD CONSTRAINT `eventos_ibfk_1` FOREIGN KEY (`coordenador_id`) REFERENCES `usuarios` (`id`);

--
-- Limitadores para a tabela `logs_auditoria`
--
ALTER TABLE `logs_auditoria`
  ADD CONSTRAINT `logs_auditoria_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`),
  ADD CONSTRAINT `logs_auditoria_ibfk_2` FOREIGN KEY (`projeto_id`) REFERENCES `projetos` (`id`) ON DELETE SET NULL;

--
-- Limitadores para a tabela `projetos`
--
ALTER TABLE `projetos`
  ADD CONSTRAINT `projetos_ibfk_1` FOREIGN KEY (`evento_id`) REFERENCES `eventos` (`id`),
  ADD CONSTRAINT `projetos_ibfk_2` FOREIGN KEY (`aluno_autor_id`) REFERENCES `usuarios` (`id`);

--
-- Limitadores para a tabela `projeto_alunos`
--
ALTER TABLE `projeto_alunos`
  ADD CONSTRAINT `projeto_alunos_ibfk_1` FOREIGN KEY (`projeto_id`) REFERENCES `projetos` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `projeto_alunos_ibfk_2` FOREIGN KEY (`aluno_id`) REFERENCES `usuarios` (`id`);

--
-- Limitadores para a tabela `projeto_materiais`
--
ALTER TABLE `projeto_materiais`
  ADD CONSTRAINT `projeto_materiais_ibfk_1` FOREIGN KEY (`projeto_id`) REFERENCES `projetos` (`id`) ON DELETE CASCADE;

--
-- Limitadores para a tabela `projeto_orientador`
--
ALTER TABLE `projeto_orientador`
  ADD CONSTRAINT `projeto_orientador_ibfk_1` FOREIGN KEY (`projeto_id`) REFERENCES `projetos` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `projeto_orientador_ibfk_2` FOREIGN KEY (`orientador_id`) REFERENCES `usuarios` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
