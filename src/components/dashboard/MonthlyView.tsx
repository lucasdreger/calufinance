import { ReactNode } from "react";
import { IncomeSection } from "./sections/IncomeSection";
import { CreditCardBillCard } from "./sections/CreditCardBillCard";
import { FixedExpensesStatus } from "./sections/FixedExpensesStatus";

interface MonthlyViewProps {
  children: ReactNode;
  selectedYear: number;
  selectedMonth: number;
}

export const MonthlyView = ({ children, selectedYear, selectedMonth }: MonthlyViewProps) => {
  return (
    <div className="space-y-6">
      <FixedExpensesStatus selectedYear={selectedYear} selectedMonth={selectedMonth} />
      <IncomeSection />
      <CreditCardBillCard selectedYear={selectedYear} selectedMonth={selectedMonth} />
      {children}
    </div>
  );
};