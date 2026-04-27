-- Criação de tipos ENUM (Caso use PostgreSQL)
-- Se estiver usando MySQL, os ENUMs são definidos direto na criação da tabela.

-- 1. TABELA DOS USUARIOS
CREATE TABLE usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    email_constituicional VARCHAR(255) UNIQUE NOT NULL,
    role_cargo ENUM('aluno', 'orientador', 'coordenador') NOT NULL,
    ativo BOOLEAN DEFAULT TRUE,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. TABELA DE EVENTOS
CREATE TABLE eventos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(255) NOT NULL,
    descricao TEXT,
    coordenador_id INT,
    prazo_inicial DATETIME NOT NULL,
    prazo_final DATETIME NOT NULL,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (coordenador_id) REFERENCES usuarios(id)
);

-- 3. TABELA DOS PROJETOS
CREATE TABLE projetos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    evento_id INT NOT NULL,
    aluno_autor_id INT NOT NULL,
    titulo VARCHAR(255) NOT NULL,
    tema VARCHAR(100),
    sub_tema VARCHAR(100),
    FOREIGN KEY (evento_id) REFERENCES eventos(id),
    FOREIGN KEY (aluno_autor_id) REFERENCES usuarios(id)
);

-- 4. TABELA DOS MATERIAIS DE UM PROJETO
CREATE TABLE projeto_materiais (
    id INT AUTO_INCREMENT PRIMARY KEY,
    projeto_id INT NOT NULL,
    tipo ENUM('pdf', 'link') NOT NULL,
    status ENUM('em_analise', 'aprovado', 'recusado') DEFAULT 'em_analise',
    conteudo TEXT NOT NULL, -- caminho do pdf ou do link do video
    opiniao TEXT NOT NULL,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (projeto_id) REFERENCES projetos(id) ON DELETE CASCADE
);

-- 5. TABELA DO ORIENTADORES DE UM PROJETO
CREATE TABLE projeto_orientador (
    id INT AUTO_INCREMENT PRIMARY KEY,
    projeto_id INT NOT NULL,
    orientador_id INT NOT NULL,
    status ENUM('pendente', 'aceito', 'recusado') DEFAULT 'pendente',
    respondido_em DATETIME,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (projeto_id) REFERENCES projetos(id) ON DELETE CASCADE,
    FOREIGN KEY (orientador_id) REFERENCES usuarios(id)
);

-- 6. TABELA DO ALUNOS DE UM PROJETO (Co-autores/Equipe)
CREATE TABLE projeto_alunos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    projeto_id INT NOT NULL,
    aluno_id INT NOT NULL,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (projeto_id) REFERENCES projetos(id) ON DELETE CASCADE,
    FOREIGN KEY (aluno_id) REFERENCES usuarios(id)
);

-- 7. TABELA PARA LOGS DE AUDITORIA
CREATE TABLE logs_auditoria (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    projeto_id INT NOT NULL,
    acao VARCHAR(100) NOT NULL,
    detalhe TEXT,
    feito_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
    FOREIGN KEY (projeto_id) REFERENCES projetos(id) ON DELETE SET NULL
);