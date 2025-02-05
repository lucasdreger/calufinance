import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/utils/formatters";
import { MonthlyTaskItem } from "@/components/dashboard/sections/tasks/MonthlyTaskItem";
import { CurrencyInput } from "@/components/shared/CurrencyInput";
import { CreditCardData } from "@/types/supabase";

interface CreditCardBillProps {
  selectedYear: number;
  selectedMonth: number;
}

export const CreditCardBillCard = ({ selectedYear, selectedMonth }: CreditCardBillProps) => {
  const [amount, setAmount] = useState<number>(0);
  const [isTransferCompleted, setIsTransferCompleted] = useState(false);
  const [transferAmount, setTransferAmount] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, [selectedYear, selectedMonth]);

  useEffect(() => {
    const expensesChannel = supabase
      .channel("credit_card_expenses_changes")
      .on("postgres_changes", 
        { event: "*", schema: "public", table: "expenses" },
        () => fetchData()
      )
      .subscribe();

    const tasksChannel = supabase
      .channel("monthly_tasks_changes")
      .on("postgres_changes", 
        { event: "*", schema: "public", table: "monthly_tasks" },
        () => fetchData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(expensesChannel);
      supabase.removeChannel(tasksChannel);
    };
  }, [selectedYear, selectedMonth]);

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .rpc('get_credit_card_data', {
        p_user_id: user.id,
        p_year: selectedYear,
        p_month: selectedMonth
      });

    if (error) {
      toast({
        title: "Error fetching data",
        description: error.message,
        variant: "destructive"
      });
      return;
    }

    if (data && Array.isArray(data) && data[0]) {
      const creditCardData = data[0];
      setAmount(creditCardData.credit_card_amount || 0);
      setTransferAmount(creditCardData.transfer_amount || 0);
      setIsTransferCompleted(creditCardData.is_transfer_completed || false);
    }
  };

  const handleSave = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get Credit Card category
      const { data: category } = await supabase
        .from('expenses_categories')
        .select('id')
        .eq('user_id', user.id)
        .eq('name', 'Credit Card')
        .single();

      if (!category) {
        toast({
          title: "Error",
          description: "Credit Card category not found",
          variant: "destructive"
        });
        return;
      }

      // Set the date to the first day of next month
      const billDate = new Date(selectedYear, selectedMonth + 1, 1);
      
      const { error: upsertError } = await supabase
        .from('expenses')
        .upsert({
          user_id: user.id,
          category_id: category.id,
          amount: amount,
          date: billDate.toISOString().split('T')[0],
          description: `Credit Card Bill for ${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}`
        }, {
          onConflict: 'user_id,category_id,date'
        });

      if (upsertError) throw upsertError;

      toast({
        title: "Success",
        description: "Credit card bill saved successfully"
      });
      
      fetchData();
    } catch (error: any) {
      toast({
        title: "Error saving bill",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleTransferStatusChange = async (completed: boolean) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('monthly_tasks')
      .upsert({
        user_id: user.id,
        year: selectedYear,
        month: selectedMonth,
        task_id: 'credit-card-transfer',
        is_completed: completed
      });

    if (error) {
      toast({
        title: "Error updating status",
        description: error.message,
        variant: "destructive"
      });
      return;
    }

    setIsTransferCompleted(completed);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Credit Card Bill</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span>Total:</span>
            <span className="font-semibold">{formatCurrency(amount)}</span>
          </div>
          <CurrencyInput
            value={amount}
            onChange={setAmount}
            placeholder="Enter credit card bill amount"
          />
          <Button className="w-full" onClick={handleSave}>Save</Button>
        </div>

        {transferAmount > 0 && (
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
