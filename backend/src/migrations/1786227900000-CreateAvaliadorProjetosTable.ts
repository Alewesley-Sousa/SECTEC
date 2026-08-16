import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateAvaliadorProjetosTable1786227900000 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE \`avaliador_projetos\` (
                \`id\` int NOT NULL AUTO_INCREMENT,
                \`avaliadorId\` int NULL,
                \`projetoId\` int NULL,
                \`status\` ENUM('pendente','avaliado') NOT NULL DEFAULT 'pendente',
                PRIMARY KEY (\`id\`)
            ) ENGINE=InnoDB
        `);
        await queryRunner.query(`ALTER TABLE \`avaliador_projetos\` ADD CONSTRAINT \`FK_avprojetos_avaliador\` FOREIGN KEY (\`avaliadorId\`) REFERENCES \`usuarios\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`avaliador_projetos\` ADD CONSTRAINT \`FK_avprojetos_projeto\` FOREIGN KEY (\`projetoId\`) REFERENCES \`projetos\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE \`avaliador_projetos\``);
    }

}
