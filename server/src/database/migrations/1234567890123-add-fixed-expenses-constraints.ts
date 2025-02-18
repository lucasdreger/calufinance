import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddFixedExpensesConstraints1234567890123 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add foreign key constraint
    await queryRunner.query(`
      ALTER TABLE fixed_expenses_status 
      ADD CONSTRAINT fk_fixed_expense_plan 
      FOREIGN KEY (fixed_expense_plan_id) 
      REFERENCES fixed_expense_plans(id) 
      ON DELETE CASCADE
    `);

    // Add indexes for common queries
    await queryRunner.query(`
      CREATE INDEX idx_fixed_expenses_user_id ON fixed_expense_plans(user_id);
      CREATE INDEX idx_fixed_expenses_status_plan_id ON fixed_expenses_status(fixed_expense_plan_id);
      CREATE INDEX idx_fixed_expenses_status_user_id ON fixed_expenses_status(user_id);
      CREATE INDEX idx_fixed_expenses_status_date ON fixed_expenses_status(date);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove indexes
    await queryRunner.query(`
      DROP INDEX IF EXISTS idx_fixed_expenses_status_date;
      DROP INDEX IF EXISTS idx_fixed_expenses_status_user_id;
      DROP INDEX IF EXISTS idx_fixed_expenses_status_plan_id;
      DROP INDEX IF EXISTS idx_fixed_expenses_user_id;
    `);

    // Remove foreign key constraint
    await queryRunner.query(`
      ALTER TABLE fixed_expenses_status 
      DROP CONSTRAINT IF EXISTS fk_fixed_expense_plan
    `);
  }
}
