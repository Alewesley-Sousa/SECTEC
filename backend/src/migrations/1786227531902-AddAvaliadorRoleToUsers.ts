import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAvaliadorRoleToUsers1786227531902 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`usuarios\` ADD COLUMN \`role_cargo\` ENUM('aluno','orientador','coordenador','comissao','avaliador') NOT NULL DEFAULT 'aluno'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`usuarios\` DROP COLUMN \`role_cargo\``);
    }

}
