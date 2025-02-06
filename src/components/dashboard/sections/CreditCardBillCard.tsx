import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/utils/formatters";
import { CurrencyInput } from "@/components/shared/CurrencyInput";
import { CheckCircle2, XCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
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

  useEffect(() => {
    fetchData();
  }, [selectedYear, selectedMonth]);

  const fetchData = async () => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        console.error('Authentication error:', authError);
        toast({
          title: "Authentication Error",
          description: "Please try logging in again",
          variant: "destructive",
        });
        return;
      }

      if (!user) {
        console.error('No user found');
        return;
      }

      // Get Credit Card category first
      const { data: category } = await supabase
        .from('expenses_categories')
        .select('id')
        .eq('user_id', user.id)
        .eq('name', 'Credit Card')
        .single();

      if (category) {
        // Get existing credit card expense
        const { data: expense, error: expenseError } = await supabase
          .from('expenses')
          .select('amount')
          .eq('user_id', user.id)
          .eq('category_id', category.id)
          .eq('date', `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-01`)
          .maybeSingle();

        if (expenseError) {
          console.error('Error fetching expense:', expenseError);
          return;
        }

        if (expense) {
          setAmount(expense.amount);
        }
      }

      const { data, error } = await supabase.rpc('get_credit_card_data', {
        p_user_id: user.id,
        p_year: selectedYear,
        p_month: selectedMonth
      });

      if (error) throw error;

      if (data && data.length > 0) {
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
  };

  const handleSave = async () => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        toast({
          title: "Authentication Error",
          description: "Please try logging in again",
          variant: "destructive",
        });
        return;
      }

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
        console.error('Error getting category:', categoryError);
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

      if (deleteError) {
        console.error('Error deleting existing expense:', deleteError);
        throw deleteError;
      }

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

      if (insertError) {
        console.error('Error inserting new expense:', insertError);
        throw insertError;
      }

      toast({
        title: "Success",
        description: "Credit card bill amount saved successfully",
      });

      // After successful save, fetch only the transfer data
      const { data: updatedData, error: rpcError } = await supabase.rpc('get_credit_card_data', {
        p_user_id: user.id,
        p_year: selectedYear,
        p_month: selectedMonth
      });

      if (rpcError) {
        console.error('Error fetching updated data:', rpcError);
        return;
      }

      if (updatedData && updatedData.length > 0) {
        setTransferAmount(updatedData[0].transfer_amount || 0);
        setIsTransferCompleted(updatedData[0].is_transfer_completed || false);
      }

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

      const { error } = await supabase
        .from('monthly_tasks')
        .upsert({
          user_id: user.id,
          year: selectedYear,
          month: selectedMonth,
          task_id: 'credit-card-transfer',
          is_completed: checked,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,year,month,task_id'
        });

      if (error) throw error;

      setIsTransferCompleted(checked);
      await fetchData();

    } catch (error: any) {
      console.error('Error updating transfer status:', error);
      toast({
        title: "Error",
        description: "Failed to update transfer status",
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
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <Button onClick={handleSave} variant="outline" size="sm">
              Save
            </Button>
          </div>
          
          {transferAmount > 0 && (
            <div className="space-y-2">
              {isTransferCompleted ? (
                <Alert className="bg-green-50 border-green-200 text-green-800">
                  <AlertDescription className="flex items-center justify-between">
                    <span>Transfer of {formatCurrency(transferAmount)} already done</span>
                    <Checkbox
                      checked={isTransferCompleted}
                      onCheckedChange={handleTransferStatusChange}
                    />
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert variant="warning">
                  <AlertDescription className="flex items-center justify-between">
                    <span>Transfer needed: {formatCurrency(transferAmount)}</span>
                    <Checkbox
                      checked={isTransferCompleted}
                      onCheckedChange={handleTransferStatusChange}
                    />
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}