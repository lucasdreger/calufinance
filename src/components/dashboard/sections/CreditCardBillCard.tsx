import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/utils/formatters";
import { MonthlyTaskItem } from "../tasks/MonthlyTaskItem";

interface CreditCardBillProps {
  selectedYear: number;
  selectedMonth: number;
}

export const CreditCardBillCard = ({ selectedYear, selectedMonth }: CreditCardBillProps) => {
  const [amount, setAmount] = useState<number>(0);
  const [isTransferCompleted, setIsTransferCompleted] = useState(false);
  const [transferAmount, setTransferAmount] = useState<number>(0);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, [selectedYear, selectedMonth]);

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Get Credit Card bill
    const { data: creditCardCategory } = await supabase
      .from('expenses_categories')
      .select('id')
      .eq('user_id', user.id)
      .eq('name', 'Credit Card')
      .maybeSingle();

    if (!creditCardCategory) return;

    const { data: creditCardExpense } = await supabase
      .from('expenses')
      .select('amount')
      .eq('category_id', creditCardCategory.id)
      .eq('user_id', user.id)
      .eq('date', `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-01`)
      .maybeSingle();

    const creditCardTotal = creditCardExpense?.amount || 0;
    setAmount(creditCardTotal);

    // Get Lucas's income
    const { data: lucasIncome } = await supabase
      .from('monthly_income')
      .select('amount')
      .eq('user_id', user.id)
      .eq('source', 'LUCAS')
      .eq('year', selectedYear)
      .eq('month', selectedMonth)
      .maybeSingle();

    // Get Lucas's fixed expenses
    const { data: lucasFixedExpenses } = await supabase
      .from('budget_plans')
      .select('estimated_amount')
      .eq('user_id', user.id)
      .eq('owner', 'Lucas')
      .eq('is_fixed', true);

    const lucasTotal = lucasIncome?.amount || 0;
    const fixedExpensesTotal = (lucasFixedExpenses || []).reduce((sum, expense) => sum + expense.estimated_amount, 0);
    
    const remainingAmount = lucasTotal - creditCardTotal - fixedExpensesTotal;
    const transfer = remainingAmount < 500 ? Math.max(0, 500 - remainingAmount) : 0;
    setTransferAmount(transfer);

    // Get task status
    const { data: taskStatus } = await supabase
      .from('monthly_tasks')
      .select('is_completed')
      .eq('user_id', user.id)
      .eq('year', selectedYear)
      .eq('month', selectedMonth)
      .eq('task_id', 'credit-card-transfer')
      .maybeSingle();

    setIsTransferCompleted(taskStatus?.is_completed || false);
  };

  const handleTransferStatusChange = async (completed: boolean) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('monthly_tasks')
      .upsert(
        {
          user_id: user.id,
          year: selectedYear,
          month: selectedMonth,
          task_id: 'credit-card-transfer',
          is_completed: completed
        },
        {
          onConflict: 'user_id,year,month,task_id'
        }
      );

    if (error) {
      toast({
        title: 'Error updating task',
        description: error.message,
        variant: 'destructive'
      });
    } else {
      setIsTransferCompleted(completed);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Credit Card Bill</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span>Total:</span>
          <span className="font-semibold">{formatCurrency(amount)}</span>
        </div>

        {transferAmount > 0 && !isTransferCompleted && (
          <div className="space-y-4">
            <Alert variant="warning" className="bg-yellow-50 border-yellow-200">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800">
                Camila needs to transfer {formatCurrency(transferAmount)} to Lucas
              </AlertDescription>
            </Alert>
            <MonthlyTaskItem
              id="credit-card-transfer"
              name={`Transfer ${formatCurrency(transferAmount)} to Lucas`}
              completed={isTransferCompleted}
              onCompletedChange={handleTransferStatusChange}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
};