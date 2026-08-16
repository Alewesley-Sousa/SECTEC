import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateAvaliacaoCriteriosTable1786228000000 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE \`avaliacao_criterios\` (
                \`id\` int NOT NULL AUTO_INCREMENT,
                \`avaliacaoId\` int NULL,
                \`criterio\` ENUM('apresentacao','metodologia','conteudo','resultado') NOT NULL,
                \`nota\` decimal(3,1) NOT NULL,
                PRIMARY KEY (\`id\`)
            ) ENGINE=InnoDB
        `);
        await queryRunner.query(`ALTER TABLE \`avaliacao_criterios\` ADD CONSTRAINT \`FK_avcriterios_avaliacao\` FOREIGN KEY (\`avaliacaoId\`) REFERENCES \`avaliacoes\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE \`avaliacao_criterios\``);
    }

}
