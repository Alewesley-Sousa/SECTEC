import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum FileStatus {
  PENDING   = 'PENDING',
  VALID     = 'VALID',
  CORRUPTED = 'CORRUPTED',
}

/**
 * Tabela auxiliar de integridade dos PDFs do sistema SECTEC.
 *
 * Relação com o banco existente:
 *   project_files.material_id  →  projeto_materiais.id  (tipo='pdf')
 *   project_files.projeto_id   →  projetos.id
 *   project_files.uploaded_by  →  usuarios.id
 *
 * A tabela `projeto_materiais` registra o vínculo oficial do arquivo ao projeto.
 * Esta tabela guarda apenas os metadados técnicos de integridade (checksum, versão, etc).
 */
@Entity('project_files')
export class ProjectFile {
  /** PK int AUTO_INCREMENT — igual ao padrão de todo o banco (usuarios, projetos, etc.) */
  @PrimaryGeneratedColumn()
  id: number;

  /**
   * FK para projeto_materiais.id (registro tipo='pdf').
   * É aqui que o sistema oficial registra o arquivo; esta tabela complementa com integridade.
   */
  @Column({ name: 'material_id' })
  materialId: number;

  /**
   * FK para projetos.id — redundante com material_id mas facilita queries
   * diretas por projeto sem precisar fazer JOIN com projeto_materiais.
   */
  @Column({ name: 'projeto_id' })
  projetoId: number;

  /**
   * FK para usuarios.id — aluno que fez o upload.
   * Corresponde a usuarios.role_cargo = 'aluno'.
   */
  @Column({ name: 'uploaded_by' })
  uploadedBy: number;

  /** Nome original do arquivo enviado pelo aluno */
  @Column({ name: 'original_name', length: 255 })
  originalName: string;

  /** Nome gerado para salvar em disco (uuid + .pdf) — evita colisões */
  @Column({ name: 'stored_name', length: 255 })
  storedName: string;

  /** Caminho absoluto no servidor onde o arquivo está salvo */
  @Column({ name: 'file_path', length: 500 })
  filePath: string;

  /**
   * Hash SHA-256 gerado no momento do upload.
   * Usado para detectar adulteração ou corrupção posterior.
   * char(64) — tamanho fixo do SHA-256 em hex.
   */
  @Column({ name: 'checksum_sha256', type: 'char', length: 64 })
  checksumSha256: string;

  /** Tamanho do arquivo em bytes. bigint para suportar arquivos grandes. */
  @Column({ name: 'file_size_bytes', type: 'bigint' })
  fileSizeBytes: number;

  /** Número de páginas do PDF (preenchido após parse, pode ser null inicialmente) */
  @Column({ name: 'page_count', type: 'int', nullable: true, default: null }) // 👈 Adicionado type: 'int'
  pageCount: number | null;


  /**
   * Status de integridade do arquivo:
   * PENDING   → recém salvo, ainda não verificado
   * VALID     → checksum conferido e arquivo íntegro
   * CORRUPTED → checksum divergiu ou arquivo ausente no disco
   */
  @Column({
    type: 'enum',
    enum: FileStatus,
    default: FileStatus.PENDING,
  })
  status: FileStatus;

  /**
   * Versão do PDF deste projeto (começa em 1, incrementa a cada resubmissão).
   * O aluno pode resubmeter o PDF enquanto o projeto estiver em EM_DESENVOLVIMENTO.
   */
  @Column({ default: 1 })
  version: number;

  @CreateDateColumn({ name: 'criado_em' })
  criadoEm: Date;

  @UpdateDateColumn({ name: 'atualizado_em' })
  atualizadoEm: Date;
}
