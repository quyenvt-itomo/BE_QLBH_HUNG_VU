import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateProductOptionsCascade1737880000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Drop old constraint without CASCADE
    await queryRunner.query(
      `ALTER TABLE "product_variants_options_product_options" 
       DROP CONSTRAINT IF EXISTS "FK_13b9122b12d2777efe50ee31202"`,
    );

    // Add new constraint with CASCADE
    await queryRunner.query(
      `ALTER TABLE "product_variants_options_product_options" 
       ADD CONSTRAINT "FK_13b9122b12d2777efe50ee31202" 
       FOREIGN KEY ("productOptionsId") 
       REFERENCES "product_options"("id") 
       ON DELETE CASCADE 
       ON UPDATE CASCADE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revert back to constraint without CASCADE
    await queryRunner.query(
      `ALTER TABLE "product_variants_options_product_options" 
       DROP CONSTRAINT IF EXISTS "FK_13b9122b12d2777efe50ee31202"`,
    );

    await queryRunner.query(
      `ALTER TABLE "product_variants_options_product_options" 
       ADD CONSTRAINT "FK_13b9122b12d2777efe50ee31202" 
       FOREIGN KEY ("productOptionsId") 
       REFERENCES "product_options"("id")`,
    );
  }
}
