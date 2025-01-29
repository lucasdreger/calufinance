import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "./formatters";

export const calculateCreditCardTransfer = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const currentDate = new Date();
  const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString();
  const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).toISOString();

  // Get Credit Card category
  const { data: categories } = await supabase
    .from('expenses_categories')
    .select('id')
    .eq('user_id', user.id)
    .eq('name', 'Credit Card')
    .maybeSingle();

  if (!categories) {
    console.error('Credit Card category not found');
    return null;
  }

  // Fetch Credit Card expenses
  const { data: creditCardExpenses } = await supabase
    .from('expenses')
    .select('amount')
    .eq('user_id', user.id)
    .eq('category_id', categories.id)
    .gte('date', startOfMonth)
    .lte('date', endOfMonth)
    .maybeSingle();

  // Fetch Lucas's income
  const { data: lucasIncome } = await supabase
    .from('income')
    .select('amount')
    .eq('user_id', user.id)
    .eq('source', 'Primary Job')
    .gte('date', startOfMonth)
    .lte('date', endOfMonth)
    .maybeSingle();

  const creditCardTotal = creditCardExpenses?.amount || 0;
  const lucasTotal = lucasIncome?.amount || 0;
  const remainingAmount = lucasTotal - creditCardTotal;

  return {
    creditCardTotal,
    lucasTotal,
    remainingAmount,
    transferAmount: remainingAmount < 1000 ? 1000 - remainingAmount : 0
  };
};