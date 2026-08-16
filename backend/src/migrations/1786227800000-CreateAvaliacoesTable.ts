import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateAvaliacoesTable1786227800000 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE \`avaliacoes\` (
                \`id\` int NOT NULL AUTO_INCREMENT,
                \`avaliadorId\` int NULL,
                \`projetoId\` int NULL,
                \`nota_final\` decimal(3,1) NOT NULL,
                PRIMARY KEY (\`id\`)
            ) ENGINE=InnoDB
        `);
        await queryRunner.query(`ALTER TABLE \`avaliacoes\` ADD CONSTRAINT \`FK_avaliacoes_avaliador\` FOREIGN KEY (\`avaliadorId\`) REFERENCES \`usuarios\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`avaliacoes\` ADD CONSTRAINT \`FK_avaliacoes_projeto\` FOREIGN KEY (\`projetoId\`) REFERENCES \`projetos\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE \`avaliacoes\``);
    }

}
