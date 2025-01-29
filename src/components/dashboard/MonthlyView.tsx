import { ReactNode } from "react";
import { IncomeSection } from "./sections/IncomeSection";
import { TasksSection } from "./sections/TasksSection";

interface MonthlyViewProps {
  children: ReactNode;
}

export const MonthlyView = ({ children }: MonthlyViewProps) => {
  return (
    <div className="space-y-6">
      <IncomeSection />
      {children}
      <TasksSection />
    </div>
  );
};