import { MigrationInterface, QueryRunner } from "typeorm";

export class AddLimitesToEventoConfig1786227700000 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`eventos\` ADD COLUMN \`min_projetos_por_avaliador\` INT NULL`);
        await queryRunner.query(`ALTER TABLE \`eventos\` ADD COLUMN \`max_projetos_por_avaliador\` INT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`eventos\` DROP COLUMN \`min_projetos_por_avaliador\``);
        await queryRunner.query(`ALTER TABLE \`eventos\` DROP COLUMN \`max_projetos_por_avaliador\``);
    }

}
