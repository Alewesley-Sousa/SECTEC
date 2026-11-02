import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTipoToProjetos1790000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`projetos\` ADD COLUMN \`tipo\` ENUM('projeto', 'oficina') NOT NULL DEFAULT 'projeto'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`projetos\` DROP COLUMN \`tipo\``);
  }
}
