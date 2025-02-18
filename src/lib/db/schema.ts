// ...existing code...

export const fixed_expense_plan = pgTable('fixed_expense_plans', {
  id: serial('id').primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  startDate: date('start_date').notNull(),
  endDate: date('end_date').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export type BudgetPlan = typeof fixed_expense_plan.$inferSelect;
export type NewBudgetPlan = typeof fixed_expense_plan.$inferInsert;

// ...existing code...
