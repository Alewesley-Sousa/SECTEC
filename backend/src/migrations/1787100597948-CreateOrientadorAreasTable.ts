import { MigrationInterface, QueryRunner, Table, TableForeignKey } from "typeorm";

export class CreateOrientadorAreasTable1787100597948 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: "orientador_areas",
                columns: [
                    {
                        name: "id",
                        type: "int",
                        isPrimary: true,
                        isGenerated: true,
                        generationStrategy: "increment",
                    },
                    {
                        name: "userId",
                        type: "int",
                        isNullable: false,
                    },
                    {
                        name: "area",
                        type: "varchar",
                        length: "100",
                        isNullable: false,
                    },
                ],
            }),
            true
        );

        await queryRunner.createForeignKey(
            "orientador_areas",
            new TableForeignKey({
                name: "FK_orientador_user",
                columnNames: ["userId"],
                referencedColumnNames: ["id"],
                referencedTableName: "usuarios",
                onDelete: "CASCADE",
            })
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const table = await queryRunner.getTable("orientador_areas");
        const foreignKey = table?.foreignKeys.find(fk => fk.name === "FK_orientador_user");
        if (foreignKey) {
            await queryRunner.dropForeignKey("orientador_areas", foreignKey);
        }
        await queryRunner.dropTable("orientador_areas");
    }
}