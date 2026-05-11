import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

/**
 * Cria a tabela auxiliar de integridade de PDFs do SECTEC.
 *
 * Relações com o banco existente (MySQL / InnoDB):
 *   material_id  →  projeto_materiais.id  (registro tipo='pdf')
 *   projeto_id   →  projetos.id
 *   uploaded_by  →  usuarios.id
 *
 * Padrão de IDs: int(11) AUTO_INCREMENT — igual ao restante do banco.
 * Padrão de datas: criado_em / atualizado_em — igual ao restante do banco.
 */
export class CreateProjectFiles1700000000000 implements MigrationInterface {
  name = 'CreateProjectFiles1700000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {

    // ── 1. CRIAR TABELA ───────────────────────────────────────────────────────
    await queryRunner.createTable(
      new Table({
        name: 'project_files',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment', // AUTO_INCREMENT — padrão MySQL do projeto
          },
          {
            // FK → projeto_materiais.id (registro com tipo='pdf')
            // O vínculo oficial do material ao projeto fica em projeto_materiais;
            // esta tabela complementa com metadados de integridade.
            name: 'material_id',
            type: 'int',
            isNullable: false,
          },
          {
            // FK → projetos.id
            // Redundante com material_id mas facilita queries diretas por projeto.
            name: 'projeto_id',
            type: 'int',
            isNullable: false,
          },
          {
            // FK → usuarios.id (aluno que fez o upload, role_cargo = 'aluno')
            name: 'uploaded_by',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'original_name',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            // Nome gerado em disco (uuid + .pdf) para evitar colisões
            name: 'stored_name',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'file_path',
            type: 'varchar',
            length: '500',
            isNullable: false,
          },
          {
            // SHA-256 em hexadecimal — sempre 64 caracteres (char fixo)
            name: 'checksum_sha256',
            type: 'char',
            length: '64',
            isNullable: false,
            comment: 'Hash SHA-256 gerado no upload para verificação de integridade',
          },
          {
            name: 'file_size_bytes',
            type: 'bigint',
            isNullable: false,
          },
          {
            // Preenchido após parse do PDF; null enquanto PENDING
            name: 'page_count',
            type: 'int',
            isNullable: true,
            default: null,
          },
          {
            // PENDING → recém salvo | VALID → íntegro | CORRUPTED → adulterado/ausente
            name: 'status',
            type: 'enum',
            enum: ['PENDING', 'VALID', 'CORRUPTED'],
            default: "'PENDING'",
          },
          {
            // Incrementado a cada resubmissão do PDF pelo aluno
            name: 'version',
            type: 'int',
            default: '1',
          },
          {
            // Padrão do banco: criado_em com timestamp automático
            name: 'criado_em',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
          {
            // Padrão do banco: atualizado_em com ON UPDATE
            name: 'atualizado_em',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
        ],
        // Engine InnoDB obrigatório para suportar FK (padrão do banco)
        engine: 'InnoDB',
      }),
      true, // ifNotExists
    );

    // ── 2. ÍNDICES ────────────────────────────────────────────────────────────

    // Busca rápida por projeto (ex: "qual PDF pertence ao projeto X?")
    await queryRunner.createIndex(
      'project_files',
      new TableIndex({
        name: 'IDX_pf_projeto_id',
        columnNames: ['projeto_id'],
      }),
    );

    // Busca rápida por material (ex: "este material tem registro de integridade?")
    await queryRunner.createIndex(
      'project_files',
      new TableIndex({
        name: 'IDX_pf_material_id',
        columnNames: ['material_id'],
      }),
    );

    // Busca por status no cron job de verificação em lote
    await queryRunner.createIndex(
      'project_files',
      new TableIndex({
        name: 'IDX_pf_status',
        columnNames: ['status'],
      }),
    );

    // ── 3. FOREIGN KEYS ───────────────────────────────────────────────────────

    // material_id → projeto_materiais.id
    await queryRunner.createForeignKey(
      'project_files',
      new TableForeignKey({
        name: 'FK_pf_material',
        columnNames: ['material_id'],
        referencedTableName: 'projeto_materiais',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',  // se o material for deletado, remove o registro de integridade
        onUpdate: 'CASCADE',
      }),
    );

    // projeto_id → projetos.id
    await queryRunner.createForeignKey(
      'project_files',
      new TableForeignKey({
        name: 'FK_pf_projeto',
        columnNames: ['projeto_id'],
        referencedTableName: 'projetos',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      }),
    );

    // uploaded_by → usuarios.id
    await queryRunner.createForeignKey(
      'project_files',
      new TableForeignKey({
        name: 'FK_pf_uploaded_by',
        columnNames: ['uploaded_by'],
        referencedTableName: 'usuarios',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT', // não permite deletar usuário com arquivos vinculados
        onUpdate: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove FKs antes da tabela (obrigatório no MySQL InnoDB)
    const table = await queryRunner.getTable('project_files');
    if (table) {
      const fkNames = ['FK_pf_material', 'FK_pf_projeto', 'FK_pf_uploaded_by'];
      for (const fkName of fkNames) {
        const fk = table.foreignKeys.find((f) => f.name === fkName);
        if (fk) await queryRunner.dropForeignKey('project_files', fk);
      }
    }
    await queryRunner.dropTable('project_files', true);
  }
}
