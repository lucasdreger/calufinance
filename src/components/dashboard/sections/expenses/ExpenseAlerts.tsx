import { useState, useEffect } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { formatCurrency } from "@/utils/formatters";
import { MonthlyTaskItem } from "../tasks/MonthlyTaskItem";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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
  const [lucasIncome, setLucasIncome] = useState<number | null>(null);

  useEffect(() => {
    fetchLucasIncome();
  }, [selectedYear, selectedMonth]);

  const fetchLucasIncome = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const startDate = getStartOfMonth(selectedYear, selectedMonth);
    const endDate = getEndOfMonth(selectedYear, selectedMonth);

    const { data: incomes } = await supabase
      .from('income')
      .select('amount')
      .eq('source', 'Primary Job')
      .eq('user_id', user.id)
      .gte('date', formatDateForSupabase(startDate))
      .lte('date', formatDateForSupabase(endDate));

    const totalIncome = incomes?.reduce((sum, income) => sum + (income.amount || 0), 0) || 0;
    setLucasIncome(totalIncome);
  };

  if (lucasIncome === null) return null;

  const lucasFixedExpensesTotal = fixedExpenses
    .filter(expense => expense.owner === "Lucas")
    .reduce((sum, expense) => sum + expense.amount, 0);

  const remainingAmount = lucasIncome - creditCardBill - lucasFixedExpensesTotal;
  const transferNeeded = remainingAmount < 400 ? 400 - remainingAmount : 0;

  return (
    <div className="space-y-4">
      {/* Other alerts can go here */}
    </div>
  );
};
