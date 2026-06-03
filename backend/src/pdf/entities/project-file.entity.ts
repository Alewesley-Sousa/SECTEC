import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,   // <-- ADICIONE ISSO
  JoinColumn,  // <-- ADICIONE ISSO
} from 'typeorm';
import { Projeto } from '../../projetos/entities/projeto.entity'; // ajuste o caminho aqui

export enum FileStatus {
  PENDING   = 'PENDING',
  VALID     = 'VALID',
  CORRUPTED = 'CORRUPTED',
}

@Entity('project_files')
export class ProjectFile {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'material_id' })
  materialId: number;

  @Column({ name: 'projeto_id' })
  projetoId: number;
  
    @ManyToOne(() => Projeto, (projeto) => projeto.arquivos, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'projeto_id' })
  projeto: Projeto;
  
  

  @Column({ name: 'uploaded_by' })
  uploadedBy: number;

  @Column({ name: 'original_name', length: 255 })
  originalName: string;

  @Column({ name: 'drive_file_id', length: 255, nullable: true })
  driveFileId: string;

  @Column({ name: 'drive_folder_id', length: 255 })
  driveFolderId: string;

  @Column({ name: 'drive_web_view_link', length: 1000, nullable: true })
  driveWebViewLink: string;

  @Column({ name: 'checksum_sha256', type: 'char', length: 64 })
  checksumSha256: string;

  @Column({ name: 'file_size_bytes', type: 'bigint' })
  fileSizeBytes: number;

  @Column({ name: 'page_count', type: 'int', nullable: true, default: null })
  pageCount: number | null;

  @Column({
    type: 'enum',
    enum: FileStatus,
    default: FileStatus.PENDING,
  })
  status: FileStatus;

  @Column({ default: 1 })
  version: number;

  @CreateDateColumn({ name: 'criado_em' })
  criadoEm: Date;

  @UpdateDateColumn({ name: 'atualizado_em' })
  atualizadoEm: Date;
}
