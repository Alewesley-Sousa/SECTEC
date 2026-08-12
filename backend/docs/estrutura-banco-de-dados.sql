-- =============================================================================
-- 1. TIPOS ENUM (precisam existir antes das tabelas que os utilizam)
-- =============================================================================

-- Usuários
CREATE TYPE user_role AS ENUM ('aluno', 'orientador', 'coordenador', 'comissao');
CREATE TYPE user_turma AS ENUM ('informatica', 'enfermagem', 'contabilidade');

-- Eventos
CREATE TYPE evento_status AS ENUM ('ativo', 'inativo');

-- Materiais de projeto
CREATE TYPE tipo_material AS ENUM ('pdf', 'link', 'pdf_relatorio');
CREATE TYPE status_material AS ENUM ('em_analise', 'aprovado', 'recusado');

-- Orientação
CREATE TYPE status_orientacao AS ENUM ('pendente', 'aceito', 'recusado');

-- Relatórios
CREATE TYPE status_relatorio AS ENUM ('pendente', 'distribuido', 'enviado', 'finalizado', 'devolvido');
CREATE TYPE tipo_relatorio_material AS ENUM ('pdf', 'link');
CREATE TYPE status_relatorio_material AS ENUM ('enviado', 'devolvido');

-- Arquivos (project_files)
CREATE TYPE file_status AS ENUM ('PENDING', 'VALID', 'CORRUPTED');


-- =============================================================================
-- 2. TABELAS PRINCIPAIS (sem dependências de outras tabelas do sistema)
-- =============================================================================

-- Usuários (base para quase todas as outras tabelas)
CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    email_institucional VARCHAR(255) NOT NULL UNIQUE,
    role_cargo user_role NOT NULL,
    senha VARCHAR(255) NOT NULL,
    ativo BOOLEAN DEFAULT true,
    ano INTEGER DEFAULT 1,
    ano_progressao_processado INTEGER,
    turma user_turma,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_usuarios_email ON usuarios(email_institucional);
CREATE INDEX idx_usuarios_role ON usuarios(role_cargo);
CREATE INDEX idx_usuarios_turma ON usuarios(turma);
CREATE INDEX idx_usuarios_ativo ON usuarios(ativo);


-- =============================================================================
-- 3. EVENTOS E TEMAS
-- =============================================================================

CREATE TABLE eventos (
    id SERIAL PRIMARY KEY,
    titulo VARCHAR(255) NOT NULL,
    descricao TEXT,
    -- Períodos (Value Object)
    inscricao_inicio TIMESTAMP,
    inscricao_fim TIMESTAMP,
    submissao_inicio TIMESTAMP,
    submissao_fim TIMESTAMP,
    avaliacao_inicio TIMESTAMP,
    avaliacao_fim TIMESTAMP,
    -- Coordenador
    coordenador_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
    -- Prazos gerais
    prazo_inicial TIMESTAMP,
    prazo_final TIMESTAMP,
    -- Status e auditoria
    status evento_status DEFAULT 'ativo',
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_eventos_status ON eventos(status);
CREATE INDEX idx_eventos_coordenador ON eventos(coordenador_id);
CREATE INDEX idx_eventos_prazo_inicial ON eventos(prazo_inicial);


CREATE TABLE tema_eventos (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    evento_id INTEGER NOT NULL REFERENCES eventos(id) ON DELETE CASCADE
);

CREATE INDEX idx_tema_eventos_evento_id ON tema_eventos(evento_id);


-- Tabela pivot: orientadores vinculados a temas
CREATE TABLE tema_orientadores (
    tema_id INTEGER NOT NULL REFERENCES tema_eventos(id) ON DELETE CASCADE,
    orientador_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    PRIMARY KEY (tema_id, orientador_id)
);

CREATE INDEX idx_to_orientador_id ON tema_orientadores(orientador_id);


-- Comissão de alunos por evento
CREATE TABLE comissao_eventos (
    id SERIAL PRIMARY KEY,
    evento_id INTEGER NOT NULL REFERENCES eventos(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_comissao_evento_user UNIQUE (evento_id, user_id)
);

CREATE INDEX idx_ce_evento_id ON comissao_eventos(evento_id);
CREATE INDEX idx_ce_user_id ON comissao_eventos(user_id);


-- =============================================================================
-- 4. PROJETOS (tabela base para submissões)
--    ⚠️  A definição exata depende da entidade Projeto.
--    Aqui uma estrutura mínima para satisfazer as FK das tabelas seguintes.
--    Ajuste conforme sua entity real.
-- =============================================================================
CREATE TABLE projetos (
    id SERIAL PRIMARY KEY,
    titulo VARCHAR(255) NOT NULL,
    descricao TEXT,
    tema_id INTEGER REFERENCES tema_eventos(id) ON DELETE SET NULL,
    evento_id INTEGER NOT NULL REFERENCES eventos(id) ON DELETE CASCADE,
    aluno_autor_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    -- acrescente os demais campos (ex.: qrcode_gerado, etc.)
);

CREATE INDEX idx_projetos_evento ON projetos(evento_id);
CREATE INDEX idx_projetos_autor ON projetos(aluno_autor_id);


-- =============================================================================
-- 5. MATERIAIS E ORIENTAÇÃO DOS PROJETOS
-- =============================================================================

CREATE TABLE projeto_materiais (
    id SERIAL PRIMARY KEY,
    projeto_id INTEGER NOT NULL REFERENCES projetos(id) ON DELETE CASCADE,
    tipo tipo_material NOT NULL,
    status status_material DEFAULT 'em_analise',
    conteudo TEXT NOT NULL,
    opiniao TEXT NOT NULL,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_pm_projeto_id ON projeto_materiais(projeto_id);
CREATE INDEX idx_pm_tipo ON projeto_materiais(tipo);
CREATE INDEX idx_pm_status ON projeto_materiais(status);


CREATE TABLE projeto_orientador (
    id SERIAL PRIMARY KEY,
    projeto_id INTEGER NOT NULL REFERENCES projetos(id) ON DELETE CASCADE,
    orientador_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    status status_orientacao DEFAULT 'pendente',
    respondido_em TIMESTAMP,
    motivo_recusa TEXT,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_projeto_orientador UNIQUE (projeto_id, orientador_id)
);

CREATE INDEX idx_po_projeto_id ON projeto_orientador(projeto_id);
CREATE INDEX idx_po_orientador_id ON projeto_orientador(orientador_id);
CREATE INDEX idx_po_status ON projeto_orientador(status);


-- Arquivos (Google Drive)
CREATE TABLE project_files (
    id SERIAL PRIMARY KEY,
    material_id INTEGER NOT NULL,
    projeto_id INTEGER NOT NULL REFERENCES projetos(id) ON DELETE CASCADE,
    uploaded_by INTEGER NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    drive_file_id VARCHAR(255),
    drive_folder_id VARCHAR(255) NOT NULL,
    drive_web_view_link VARCHAR(1000),
    checksum_sha256 CHAR(64) NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    page_count INTEGER DEFAULT NULL,
    status file_status DEFAULT 'PENDING',
    version INTEGER DEFAULT 1,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_project_files_projeto_id ON project_files(projeto_id);
CREATE INDEX idx_project_files_material_id ON project_files(material_id);
CREATE INDEX idx_project_files_uploaded_by ON project_files(uploaded_by);
CREATE INDEX idx_project_files_status ON project_files(status);
CREATE INDEX idx_project_files_drive_file_id ON project_files(drive_file_id);


-- =============================================================================
-- 6. RELATÓRIOS (modalidade específica de submissão)
-- =============================================================================

CREATE TABLE relatorio_aluno (
    id SERIAL PRIMARY KEY,
    aluno_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    evento_id INTEGER NOT NULL REFERENCES eventos(id) ON DELETE CASCADE,
    quantidade_projetos INTEGER DEFAULT 0,
    status status_relatorio DEFAULT 'pendente',
    data_ativacao TIMESTAMP,
    data_envio TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_relatorio_aluno_evento UNIQUE (aluno_id, evento_id)
);

CREATE INDEX idx_relatorio_aluno_aluno_id ON relatorio_aluno(aluno_id);
CREATE INDEX idx_relatorio_aluno_evento_id ON relatorio_aluno(evento_id);
CREATE INDEX idx_relatorio_aluno_status ON relatorio_aluno(status);


-- Projetos atribuídos a um aluno no contexto de relatório
CREATE TABLE aluno_relatorio_projetos (
    id SERIAL PRIMARY KEY,
    aluno_relatorio_id INTEGER NOT NULL REFERENCES relatorio_aluno(id) ON DELETE CASCADE,
    projeto_id INTEGER NOT NULL REFERENCES projetos(id) ON DELETE CASCADE,
    visualizado BOOLEAN DEFAULT false,
    data_atribuicao TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_relatorio_projeto UNIQUE (aluno_relatorio_id, projeto_id)
);

CREATE INDEX idx_arp_aluno_relatorio_id ON aluno_relatorio_projetos(aluno_relatorio_id);
CREATE INDEX idx_arp_projeto_id ON aluno_relatorio_projetos(projeto_id);


-- Materiais enviados no relatório (PDF ou link)
CREATE TABLE relatorio_materiais (
    id SERIAL PRIMARY KEY,
    aluno_relatorio_id INTEGER NOT NULL REFERENCES relatorio_aluno(id) ON DELETE CASCADE,
    tipo tipo_relatorio_material NOT NULL,
    status status_relatorio_material DEFAULT 'enviado',
    conteudo TEXT NOT NULL,
    opiniao TEXT,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_relatorio_material_tipo UNIQUE (aluno_relatorio_id, tipo)
);

CREATE INDEX idx_rm_aluno_relatorio_id ON relatorio_materiais(aluno_relatorio_id);


-- =============================================================================
-- 7. AUTENTICAÇÃO / RECUPERAÇÃO DE SENHA
-- =============================================================================

CREATE TABLE password_reset_tokens (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    token VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used SMALLINT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_prt_usuario_id ON password_reset_tokens(usuario_id);
CREATE INDEX idx_prt_token ON password_reset_tokens(token);
CREATE INDEX idx_prt_expires_at ON password_reset_tokens(expires_at);