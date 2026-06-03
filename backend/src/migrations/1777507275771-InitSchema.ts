import { MigrationInterface, QueryRunner } from "typeorm";

export class InitSchema1777507275771 implements MigrationInterface {
    name = 'InitSchema1777507275771'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`eventos\` (\`id\` int NOT NULL AUTO_INCREMENT, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`usuarios\` (\`id\` int NOT NULL AUTO_INCREMENT, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`projetos\` (\`id\` int NOT NULL AUTO_INCREMENT, \`titulo\` varchar(255) NOT NULL, \`tema\` varchar(100) NULL, \`subTema\` varchar(100) NULL, \`evento_id\` int NULL, \`aluno_autor_id\` int NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`projetos\` ADD CONSTRAINT \`FK_d366a51950d32ea4e739267a3c8\` FOREIGN KEY (\`evento_id\`) REFERENCES \`eventos\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`projetos\` ADD CONSTRAINT \`FK_2de7e277df38264086b58748f49\` FOREIGN KEY (\`aluno_autor_id\`) REFERENCES \`usuarios\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`projetos\` DROP FOREIGN KEY \`FK_2de7e277df38264086b58748f49\``);
        await queryRunner.query(`ALTER TABLE \`projetos\` DROP FOREIGN KEY \`FK_d366a51950d32ea4e739267a3c8\``);
        await queryRunner.query(`DROP TABLE \`projetos\``);
        await queryRunner.query(`DROP TABLE \`usuarios\``);
        await queryRunner.query(`DROP TABLE \`eventos\``);
    }

}
