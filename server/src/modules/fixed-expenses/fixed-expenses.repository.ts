import { db } from '../../lib/db';
import { FixedExpensePlan, FixedExpenseStatus } from './fixed-expenses.entity';

export function getFixedExpensesRepository() {
  return db.getRepository(FixedExpensePlan);
}

export function getFixedExpensesStatusRepository() {
  return db.getRepository(FixedExpenseStatus);
}
