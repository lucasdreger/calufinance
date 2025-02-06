import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/utils/formatters";
import { CurrencyInput } from "@/components/shared/CurrencyInput";
import { CheckCircle2, XCircle } from "lucide-react";

interface CreditCardBillCardProps {
  selectedYear: number;
  selectedMonth: number;
}

export function CreditCardBillCard({ selectedYear, selectedMonth }: CreditCardBillCardProps) {
  const [amount, setAmount] = useState<number>(0);
  const [transferAmount, setTransferAmount] = useState<number>(0);
  const [isTransferCompleted, setIsTransferCompleted] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, [selectedYear, selectedMonth]);

  useEffect(() => {
    const expensesChannel = supabase
      .channel("credit_card_expenses_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "expenses" },
        () => fetchData()
      )
      .subscribe();

    const tasksChannel = supabase
      .channel("monthly_tasks_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "monthly_tasks" },
        () => fetchData()
      )
      .subscribe();

    return () => {
      expensesChannel.unsubscribe();
      tasksChannel.unsubscribe();
    };
  }, [selectedYear, selectedMonth]);

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // First get the credit card category
      const { data: categoryData, error: categoryError } = await supabase
        .from('expenses_categories')
        .select('id')
        .eq('user_id', user.id)
        .eq('name', 'Credit Card')
        .single();

      if (categoryError) {
        console.error('Error fetching category:', categoryError);
        return;
      }

      // Then get the expense for this month
      const formattedDate = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-01`;
      
      const { data: expenseData, error: expenseError } = await supabase
        .from('expenses')
        .select('amount')
        .eq('user_id', user.id)
        .eq('category_id', categoryData.id)
        .eq('date', formattedDate)
        .single();

      if (expenseError && expenseError.code !== 'PGRST116') {
        console.error('Error fetching expense:', expenseError);
        return;
      }

      // Get transfer completion status
      const { data: taskData, error: taskError } = await supabase
        .from('monthly_tasks')
        .select('is_completed')
        .eq('user_id', user.id)
        .eq('year', selectedYear)
        .eq('month', selectedMonth)
        .eq('task_id', 'credit-card-transfer')
        .single();

      if (taskError && taskError.code !== 'PGRST116') {
        console.error('Error fetching task status:', taskError);
      }

      setAmount(expenseData?.amount || 0);
      setTransferAmount(expenseData?.amount || 0);
      setIsTransferCompleted(taskData?.is_completed || false);
    } catch (error: any) {
      console.error('Error in fetchData:', error);
      toast({
        title: "Error fetching data",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleSave = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Error",
          description: "User not authenticated",
          variant: "destructive",
        });
        return;
      }

      // Get Credit Card category
      const { data: category, error: categoryError } = await supabase
        .from('expenses_categories')
        .select('id')
        .eq('user_id', user.id)
        .eq('name', 'Credit Card')
        .single();

      if (categoryError) {
        throw categoryError;
      }

      const formattedDate = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-01`;
      
      // First, delete any existing expense for this month
      const { error: deleteError } = await supabase
        .from('expenses')
        .delete()
        .eq('user_id', user.id)
        .eq('category_id', category.id)
        .eq('date', formattedDate);

      if (deleteError) throw deleteError;

      // Then insert the new expense
      const { error: insertError } = await supabase
        .from('expenses')
        .insert({
          user_id: user.id,
          category_id: category.id,
          amount: amount,
          date: formattedDate,
          description: `Credit Card Bill for ${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}`
        });

      if (insertError) throw insertError;

      toast({
        title: "Success",
        description: "Credit card bill amount saved successfully",
      });

      await fetchData();
    } catch (error: any) {
      console.error('Error in handleSave:', error);
      toast({
        title: "Error saving data",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Credit Card Bill</CardTitle>
        {isTransferCompleted ? (
          <CheckCircle2 className="h-4 w-4 text-green-500" />
        ) : (
          <XCircle className="h-4 w-4 text-red-500" />
        )}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold mb-4">
          <CurrencyInput
            value={amount}
            onChange={(value) => setAmount(value)}
          />
        </div>
        <div className="flex justify-between items-center">
          <Button onClick={handleSave} variant="outline" size="sm">
            Save
          </Button>
          {transferAmount > 0 && (
            <div className="text-sm text-muted-foreground">
              Transfer needed: {formatCurrency(transferAmount)}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}