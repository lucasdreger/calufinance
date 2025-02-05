import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "./formatters";
import { CreditCardData } from "@/types/supabase";

export const calculateCreditCardTransfer = async (selectedYear: number, selectedMonth: number) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .rpc<CreditCardData>('get_credit_card_data', {
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
    transferAmount: data
  };
};