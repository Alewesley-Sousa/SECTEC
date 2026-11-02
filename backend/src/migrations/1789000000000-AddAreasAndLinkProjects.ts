import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAreasAndLinkProjects1789000000000 implements MigrationInterface {
  name = 'AddAreasAndLinkProjects1789000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE \`areas\` (
      \`id\` int NOT NULL AUTO_INCREMENT,
      \`nome\` varchar(120) NOT NULL,
      \`descricao\` text NULL,
      UNIQUE INDEX \`UQ_areas_nome\` (\`nome\`),
      PRIMARY KEY (\`id\`)
    ) ENGINE=InnoDB`);

    await queryRunner.query(`INSERT INTO \`areas\` (\`nome\`)
      SELECT DISTINCT te.\`nome\` FROM \`projetos\` p
      INNER JOIN \`tema_eventos\` te ON te.\`id\` = p.\`tema_id\`
      WHERE te.\`nome\` IS NOT NULL`);
    await queryRunner.query(`INSERT INTO \`areas\` (\`nome\`)
      SELECT 'Área não definida' WHERE NOT EXISTS (
        SELECT 1 FROM \`areas\` WHERE \`nome\` = 'Área não definida'
      )`);
    await queryRunner.query(`ALTER TABLE \`projetos\` ADD \`area_id\` int NULL`);
    await queryRunner.query(`UPDATE \`projetos\` p
      LEFT JOIN \`tema_eventos\` te ON te.\`id\` = p.\`tema_id\`
      LEFT JOIN \`areas\` a ON a.\`nome\` = te.\`nome\`
      SET p.\`area_id\` = COALESCE(a.\`id\`, (SELECT fallback.\`id\` FROM \`areas\` fallback WHERE fallback.\`nome\` = 'Área não definida' LIMIT 1))`);
    await queryRunner.query(`ALTER TABLE \`projetos\` MODIFY \`area_id\` int NOT NULL`);

    const table = await queryRunner.getTable('projetos');
    const temaForeignKey = table?.foreignKeys.find((foreignKey) => foreignKey.columnNames.includes('tema_id'));
    if (temaForeignKey) await queryRunner.dropForeignKey('projetos', temaForeignKey);

    await queryRunner.query(`ALTER TABLE \`projetos\` ADD CONSTRAINT \`FK_projetos_area\`
      FOREIGN KEY (\`area_id\`) REFERENCES \`areas\`(\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE \`projetos\` DROP COLUMN \`tema_id\``);

    if (await queryRunner.hasTable('orientador_areas')) {
      await queryRunner.dropTable('orientador_areas', true);
    }
    if (await queryRunner.hasColumn('usuarios', 'area')) {
      await queryRunner.dropColumn('usuarios', 'area');
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`projetos\` ADD \`tema_id\` int NULL`);
    const table = await queryRunner.getTable('projetos');
    await queryRunner.query(`UPDATE \`projetos\` p
      INNER JOIN \`areas\` a ON a.\`id\` = p.\`area_id\`
      INNER JOIN \`tema_eventos\` te ON te.\`nome\` = a.\`nome\` AND te.\`evento_id\` = p.\`evento_id\`
      SET p.\`tema_id\` = te.\`id\``);
    const areaForeignKey = table?.foreignKeys.find((foreignKey) => foreignKey.columnNames.includes('area_id'));
    if (areaForeignKey) await queryRunner.dropForeignKey('projetos', areaForeignKey);
    await queryRunner.query(`ALTER TABLE \`projetos\` DROP COLUMN \`area_id\``);
    await queryRunner.query(`DROP TABLE \`areas\``);
    await queryRunner.query(`ALTER TABLE \`projetos\` ADD CONSTRAINT \`FK_projetos_tema\`
      FOREIGN KEY (\`tema_id\`) REFERENCES \`tema_eventos\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE \`usuarios\` ADD \`area\` enum('informatica','enfermagem','contabilidade','humanas','exatas','naturezas','linguagens') NULL DEFAULT NULL`);
    await queryRunner.query(`CREATE TABLE \`orientador_areas\` (
      \`id\` int NOT NULL AUTO_INCREMENT,
      \`userId\` int NOT NULL,
      \`area\` varchar(100) NOT NULL,
      PRIMARY KEY (\`id\`),
      CONSTRAINT \`FK_orientador_user\` FOREIGN KEY (\`userId\`) REFERENCES \`usuarios\`(\`id\`) ON DELETE CASCADE
    ) ENGINE=InnoDB`);
  }
}
