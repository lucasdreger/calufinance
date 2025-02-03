import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/utils/formatters";
import { IncomeForm } from "./income/IncomeForm";
import { useToast } from "@/components/ui/use-toast";

export const IncomeSection = () => {
  const [incomes, setIncomes] = useState<any[]>([]);
  const { toast } = useToast();

  const fetchIncomes = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      const currentDate = new Date();
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString();
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).toISOString();

      const { data, error } = await supabase
        .from('income')
        .select('*')
        .eq('user_id', userData.user.id)
        .gte('date', startOfMonth)
        .lte('date', endOfMonth)
        .order('date', { ascending: false });

      if (error) throw error;
      setIncomes(data || []);
    } catch (error: any) {
      console.error('Error fetching incomes:', error);
      toast({
        title: "Error fetching income",
        description: error.message,
        variant: "destructive",
      });
    }
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