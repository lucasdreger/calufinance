import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { FinanceLineChart } from "./charts/FinanceLineChart";
import { formatDateForSupabase } from "@/utils/dateHelpers";

export const FinanceOverview = () => {
  const [data, setData] = useState<any[]>([]);
  const { toast } = useToast();

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const endDate = new Date(Date.UTC(new Date().getFullYear(), new Date().getMonth(), new Date().getDate(), 23, 59, 59, 999));
    const startDate = new Date(Date.UTC(endDate.getFullYear(), endDate.getMonth() - 5, 1, 0, 0, 0, 0));

    const { data: expenses, error: expensesError } = await supabase
      .from('expenses')
      .select('amount, date')
      .eq('user_id', user.id)
      .gte('date', formatDateForSupabase(startDate))
      .lte('date', formatDateForSupabase(endDate));

    const { data: incomes, error: incomesError } = await supabase
      .from('income')
      .select('amount, date')
      .eq('user_id', user.id)
      .gte('date', formatDateForSupabase(startDate))
      .lte('date', formatDateForSupabase(endDate));

    if (expensesError || incomesError) {
      toast({
        title: "Error fetching financial data",
        description: expensesError?.message || incomesError?.message,
        variant: "destructive",
      });
      return;
    }

    const monthlyData: Record<string, { income: number; expenses: number }> = {};

    for (let i = 0; i < 6; i++) {
      const date = new Date(Date.UTC(endDate.getFullYear(), endDate.getMonth() - i, 1));
      const monthKey = date.toISOString().substring(0, 7);
      monthlyData[monthKey] = { income: 0, expenses: 0 };
    }

    expenses?.forEach((expense: any) => {
      const monthKey = expense.date.substring(0, 7);
      if (monthlyData[monthKey]) {
        monthlyData[monthKey].expenses += parseFloat(expense.amount);
      }
    });

    incomes?.forEach((income: any) => {
      const monthKey = income.date.substring(0, 7);
      if (monthlyData[monthKey]) {
        monthlyData[monthKey].income += parseFloat(income.amount);
      }
    });

    const chartData = Object.entries(monthlyData)
      .map(([month, values]) => ({
        month: new Date(month + "-01").toLocaleString('default', { month: 'short' }),
        ...values
      }))
      .sort((a, b) => a.month.localeCompare(b.month));

    setData(chartData);
  };

  useEffect(() => {
    fetchData();

    const expensesChannel = supabase
      .channel('expenses_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'expenses' },
        () => {
          fetchData();
        }
      )
      .subscribe();

    const incomeChannel = supabase
      .channel('income_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'income' },
        () => {
          fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(expensesChannel);
      supabase.removeChannel(incomeChannel);
    };
  }, []);

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-[#1a365d]">Financial Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <FinanceLineChart data={data} />
      </CardContent>
    </Card>
  );
};