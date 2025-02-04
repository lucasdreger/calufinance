import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { formatCurrency } from "@/utils/formatters";

interface ExpenseAlertsProps {
  expenses: any[];
  transferAmount: number;
}

export const ExpenseAlerts = ({ expenses, transferAmount }: ExpenseAlertsProps) => {
  return (
    <>
      {transferAmount > 0 && !expenses.some(expense => 
        expense.description?.toLowerCase().includes('transfer to camila') &&
        Math.abs(expense.amount - transferAmount) < 0.01
      ) && (
        <Alert variant="warning" className="bg-yellow-50 border-yellow-200">
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            Remember to transfer {formatCurrency(transferAmount)} to Camila (30% of Lucas's salary).
          </AlertDescription>
        </Alert>
      )}
    </>
  );
};