import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface ExpenseAlertsProps {
  expenses: any[];
  creditCardBill: number;
  fixedExpenses: {
    amount: number;
    owner: string;
  }[];
  selectedYear: number;
  selectedMonth: number;
}

export const ExpenseAlerts = ({ 
  expenses, 
  creditCardBill,
  fixedExpenses,
  selectedYear,
  selectedMonth
}: ExpenseAlertsProps) => {
  return (
    <div className="space-y-4">
      {/* Other alerts can go here */}
    </div>
  );
};
