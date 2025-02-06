import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/utils/formatters";
import { CurrencyInput } from "@/components/shared/CurrencyInput";
import { CheckCircle2, XCircle } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

interface CreditCardBillCardProps {
  selectedYear: number;
  selectedMonth: number;
}

export function CreditCardBillCard({ selectedYear, selectedMonth }: CreditCardBillCardProps) {
  const [amount, setAmount] = useState<number>(0);
  const [transferAmount, setTransferAmount] = useState<number>(0);
  const [isTransferCompleted, setIsTransferCompleted] = useState(false);
  const { toast } = useToast();

  const fetchData = useCallback(async () => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) {
        toast({
          title: "Authentication Error",
          description: "Please sign in again to continue",
          variant: "destructive",
        });
        return;
      }
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
        title: "Error fetching data",
        description: error.message,
        variant: "destructive",
      });
    }
  }, [selectedYear, selectedMonth, toast]);

  useEffect(() => {
    fetchData();

    const expensesChannel = supabase
      .channel(`expenses_changes_${selectedYear}_${selectedMonth}`)
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'expenses' },
        () => fetchData()
      )
      .subscribe();

    const tasksChannel = supabase
      .channel(`monthly_tasks_changes_${selectedYear}_${selectedMonth}`)
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'monthly_tasks' },
        () => fetchData()
      )
      .subscribe();

    const incomeChannel = supabase
      .channel(`monthly_income_changes_${selectedYear}_${selectedMonth}`)
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'monthly_income' },
        () => fetchData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(expensesChannel);
      supabase.removeChannel(tasksChannel);
      supabase.removeChannel(incomeChannel);
    };
  }, [selectedYear, selectedMonth, fetchData]);

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

  const handleTransferStatusChange = async (checked: boolean) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: existingTask } = await supabase
        .from('monthly_tasks')
        .select('id')
        .eq('user_id', user.id)
        .eq('year', selectedYear)
        .eq('month', selectedMonth)
        .eq('task_id', 'credit-card-transfer')
        .maybeSingle();

      if (existingTask) {
        const { error } = await supabase
          .from('monthly_tasks')
          .update({ is_completed: checked })
          .eq('id', existingTask.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('monthly_tasks')
          .insert({
            user_id: user.id,
            year: selectedYear,
            month: selectedMonth,
            task_id: 'credit-card-transfer',
            is_completed: checked
          });

        if (error) throw error;
      }

      setIsTransferCompleted(checked);
    } catch (error: any) {
      toast({
        title: "Error updating status",
        description: error.message,
        variant: "destructive"
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
        <div className="space-y-4">
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
          {transferAmount > 0 && (
            <div className="flex items-center space-x-2">
              <Checkbox
                id="transfer-status"
                checked={isTransferCompleted}
                onCheckedChange={handleTransferStatusChange}
              />
              <label htmlFor="transfer-status" className="text-sm">
                I have transferred {formatCurrency(transferAmount)} to Lucas
              </label>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}