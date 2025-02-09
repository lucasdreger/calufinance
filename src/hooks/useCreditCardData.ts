
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

export const useCreditCardData = (selectedYear: number, selectedMonth: number) => {
  const [amount, setAmount] = useState<number>(0);
  const [transferAmount, setTransferAmount] = useState<number>(0);
  const [isTransferCompleted, setIsTransferCompleted] = useState(false);
  const { toast } = useToast();

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
        .eq('name', 'Credit Card')
        .maybeSingle();

      if (category) {
        // Get existing credit card expense
        const { data: expense, error: expenseError } = await supabase
          .from('expenses')
          .select('amount')
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

  useEffect(() => {
    fetchData();
  }, [selectedYear, selectedMonth]);

  return {
    amount,
    setAmount,
    transferAmount,
    isTransferCompleted,
    setIsTransferCompleted,
    fetchData
  };
};
