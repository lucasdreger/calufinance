import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://gqulqtialfsoabpqrkqs.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdxdWxxdGlhbGZzb2FicHFya3FzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzgwOTY3MjIsImV4cCI6MjA1MzY3MjcyMn0.kdD-Y72BxIJYG9K_FFjfUPwrg_tUKdWCwCXID-2pD1A';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    storage: window.localStorage
  }
});

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
        onConflict: ['user_id', 'year', 'month', 'task_id']
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

const fetchData = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { data, error } = await supabase
    .rpc('get_credit_card_data', {
      p_user_id: user.id,
      p_year: selectedYear,
      p_month: selectedMonth
    })
    .single();

  if (error) {
    toast({
      title: "Error fetching data",
      description: error.message,
      variant: "destructive"
    });
    return;
  }

  setAmount(data.credit_card_amount);
  setTransferAmount(data.transfer_amount);
  setIsTransferCompleted(data.is_transfer_completed);
};

export const calculateCreditCardTransfer = async (selectedYear: number, selectedMonth: number) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .rpc('get_credit_card_data', {
      p_user_id: user.id,
      p_year: selectedYear,
      p_month: selectedMonth
    })
    .single();

  if (error) return null;

  return {
    creditCardTotal: data.credit_card_amount,
    lucasTotal: data.lucas_income,
    remainingAmount: data.remaining_amount,
    transferAmount: data.transfer_amount,
    fixedExpensesTotal: data.fixed_expenses_total
  };
};