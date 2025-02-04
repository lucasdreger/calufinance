import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { formatCurrency } from "@/utils/formatters";
import { MonthlyTaskItem } from "../tasks/MonthlyTaskItem";
import { useState } from "react";

interface ExpenseAlertsProps {
  expenses: any[];
  transferAmount: number;
  lucasIncome: number;
  creditCardBill: number;
  fixedExpenses: {
    amount: number;
    owner: string;
  }[];
}

export const ExpenseAlerts = ({ 
  expenses, 
  lucasIncome,
  creditCardBill,
  fixedExpenses 
}: ExpenseAlertsProps) => {
  const [isTransferCompleted, setIsTransferCompleted] = useState(false);

  // Calculate Lucas's fixed expenses total
  const lucasFixedExpensesTotal = fixedExpenses
    .filter(expense => expense.owner === 'Lucas')
    .reduce((sum, expense) => sum + expense.amount, 0);

  // Calculate remaining amount after bills
  const remainingAmount = lucasIncome - creditCardBill - lucasFixedExpensesTotal;
  
  // Calculate transfer needed if remaining is less than 400
  const transferNeeded = remainingAmount < 400 ? 400 - remainingAmount : 0;

  return (
    <>
      {transferNeeded > 0 && (
        <div className="space-y-4">
          <Alert variant="warning" className="bg-yellow-50 border-yellow-200">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              Camila to transfer {formatCurrency(transferNeeded)} to Lucas
            </AlertDescription>
          </Alert>
          <MonthlyTaskItem
            id="transfer-task"
            name={`Transfer ${formatCurrency(transferNeeded)} to Lucas`}
            completed={isTransferCompleted}
            onCompletedChange={setIsTransferCompleted}
          />
        </div>
      )}
    </>
  );
};