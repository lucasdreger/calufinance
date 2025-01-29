import { IncomeSection } from "./sections/IncomeSection";
import { ExpensesSection } from "./sections/ExpensesSection";
import { TasksSection } from "./sections/TasksSection";

export const MonthlyView = () => {
  return (
    <div className="space-y-6">
      <IncomeSection />
      <ExpensesSection />
      <TasksSection />
    </div>
  );
};