import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/utils/formatters";
import { IncomeForm } from "./income/IncomeForm";

export const IncomeSection = () => {
  const [incomes, setIncomes] = useState<any[]>([]);

  const fetchIncomes = async () => {
    const { data } = await supabase
      .from('income')
      .select('*')
      .order('date', { ascending: false });
    
    setIncomes(data || []);
  };

  useEffect(() => {
    fetchIncomes();

    const channel = supabase
      .channel('income_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'income' },
        () => {
          fetchIncomes();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const totalIncome = incomes.reduce((sum, income) => sum + parseFloat(income.amount), 0);

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-[#1a365d]">Monthly Income</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <IncomeForm source="Primary Job" onIncomeSaved={fetchIncomes} />
        <IncomeForm source="Wife Job 1" onIncomeSaved={fetchIncomes} />
        <IncomeForm source="Wife Job 2" onIncomeSaved={fetchIncomes} />
        
        <div className="pt-4 border-t">
          <div className="flex justify-between items-center">
            <span className="font-medium">Total Monthly Income:</span>
            <span className="text-xl font-bold text-[#4a5568]">
              {formatCurrency(totalIncome)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};