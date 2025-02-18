// ...existing code...

export const budgetPlans = pgTable('budget_plans', {
  id: serial('id').primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  startDate: date('start_date').notNull(),
  endDate: date('end_date').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export type BudgetPlan = typeof budgetPlans.$inferSelect;
export type NewBudgetPlan = typeof budgetPlans.$inferInsert;

// ...existing code...
