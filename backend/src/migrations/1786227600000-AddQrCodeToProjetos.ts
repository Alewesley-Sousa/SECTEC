import { MigrationInterface, QueryRunner } from "typeorm";

export class AddQrCodeToProjetos1786227600000 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`projetos\` ADD COLUMN \`qr_code\` VARCHAR(255) NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`projetos\` DROP COLUMN \`qr_code\``);
    }

}
