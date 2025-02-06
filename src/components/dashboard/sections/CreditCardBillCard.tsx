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
import { useRealtimeSubscription } from "@/hooks/useRealtimeSubscription";

interface CreditCardBillProps {
  selectedYear: number;
  selectedMonth: number;
}

export const CreditCardBillCard = ({ selectedYear, selectedMonth }: CreditCardBillProps) => {
  const [amount, setAmount] = useState<number>(0);
  const [isTransferCompleted, setIsTransferCompleted] = useState(false);
  const [transferAmount, setTransferAmount] = useState(0);
  const { toast } = useToast();

  useRealtimeSubscription(
    ['expenses', 'monthly_tasks', 'monthly_income', 'budget_plans'],
    fetchData
  );

  useEffect(() => {
    fetchData();
  }, [selectedYear, selectedMonth]);

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .rpc('get_credit_card_data', {
          p_user_id: user.id,
          p_year: selectedYear,
          p_month: selectedMonth
        });

      if (error) throw error;

      if (data && data.length > 0) {
        setAmount(data[0].credit_card_amount || 0);
        setTransferAmount(data[0].transfer_amount || 0);
        setIsTransferCompleted(data[0].is_transfer_completed || false);
      }
    } catch (error: any) {
      console.error('Error in fetchData:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleSave = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

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
        description: "Credit card bill saved successfully"
      });
      
      await fetchData();
    } catch (error: any) {
      console.error('Error in handleSave:', error);
      toast({
        title: "Error saving bill",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleTransferStatusChange = async (completed: boolean) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // First check if the task exists
      const { data: existingTask } = await supabase
        .from('monthly_tasks')
        .select('id')
        .eq('user_id', user.id)
        .eq('year', selectedYear)
        .eq('month', selectedMonth)
        .eq('task_id', 'credit-card-transfer')
        .maybeSingle();

      if (existingTask) {
        // Update existing task
        const { error } = await supabase
          .from('monthly_tasks')
          .update({ is_completed: completed })
          .eq('id', existingTask.id);

        if (error) throw error;
      } else {
        // Insert new task
        const { error } = await supabase
          .from('monthly_tasks')
          .insert({
            user_id: user.id,
            year: selectedYear,
            month: selectedMonth,
            task_id: 'credit-card-transfer',
            is_completed: completed
          });

        if (error) throw error;
      }

      setIsTransferCompleted(completed);
    } catch (error: any) {
      toast({
        title: "Error updating status",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Credit Card Bill</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-4">
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