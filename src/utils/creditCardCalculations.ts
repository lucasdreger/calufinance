
import { supabase } from "@/integrations/supabase/client";
import { CreditCardData } from "@/types/supabase";

export const calculateCreditCardTransfer = async (selectedYear: number, selectedMonth: number) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .rpc<CreditCardData>('get_credit_card_data', {
      p_user_id: user.id,
      p_year: selectedYear,
      p_month: selectedMonth
    });

  if (error || !data || data.length === 0) return null;

  return {
    creditCardTotal: data[0].credit_card_amount,
    lucasTotal: data[0].lucas_income,
    remainingAmount: data[0].remaining_amount,
    transferAmount: data[0].transfer_amount,
    fixedExpensesTotal: data[0].fixed_expenses_total
  };
};
