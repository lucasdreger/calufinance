import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "./formatters";

export const calculateCreditCardTransfer = async (selectedYear: number, selectedMonth: number) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const startDate = getStartOfMonth(selectedYear, selectedMonth);
  const endDate = getEndOfMonth(selectedYear, selectedMonth);

  // Get Credit Card bill
  const { data: creditCardCategory } = await supabase
    .from('expenses_categories')
    .select('id')
    .eq('user_id', user.id)
    .eq('name', 'Credit Card')
    .maybeSingle();

  if (!creditCardCategory) return null;

  const { data: creditCardExpense } = await supabase
    .from('expenses')
    .select('amount')
    .eq('category_id', creditCardCategory.id)
    .eq('user_id', user.id)
    .gte('date', formatDateForSupabase(startDate))
    .lte('date', formatDateForSupabase(endDate))
    .maybeSingle();

  // Get Lucas's fixed expenses
  const { data: lucasFixedExpenses } = await supabase
    .from('budget_plans')
    .select('estimated_amount')
    .eq('user_id', user.id)
    .eq('owner', 'Lucas')
    .eq('is_fixed', true);

  // Get Lucas's income - modified to handle multiple records
  const { data: lucasIncomes } = await supabase
    .from('income')
    .select('amount')
    .eq('user_id', user.id)
    .eq('source', 'Primary Job')
    .gte('date', formatDateForSupabase(startDate))
    .lte('date', formatDateForSupabase(endDate));

  const creditCardTotal = creditCardExpense?.amount || 0;
  const lucasTotal = lucasIncomes?.reduce((sum, income) => sum + (income.amount || 0), 0) || 0;
  const fixedExpensesTotal = (lucasFixedExpenses || []).reduce((sum, expense) => sum + expense.estimated_amount, 0);
  
  const remainingAmount = lucasTotal - creditCardTotal - fixedExpensesTotal;
  const transferAmount = remainingAmount < 500 ? Math.max(0, 500 - remainingAmount) : 0;

  return {
    creditCardTotal,
    lucasTotal,
    remainingAmount,
    transferAmount,
    fixedExpensesTotal
  };
};