import { ReactNode } from "react";
import { CreditCardBillCard } from "./sections/CreditCardBillCard";
import { FixedExpensesStatus } from "./sections/FixedExpensesStatus";
import { MonthlyIncomeData } from "./sections/MonthlyIncomeData";

interface MonthlyViewProps {
  children: ReactNode;
  selectedYear: number;
  selectedMonth: number;
}

export const MonthlyView = ({ children, selectedYear, selectedMonth }: MonthlyViewProps) => {
  return (
    <div className="space-y-6">
      <FixedExpensesStatus selectedYear={selectedYear} selectedMonth={selectedMonth} />
      <MonthlyIncomeData selectedYear={selectedYear} selectedMonth={selectedMonth} />
      <CreditCardBillCard selectedYear={selectedYear} selectedMonth={selectedMonth} />
      {children}
    </div>
  );
};