import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

export const FinanceOverview = () => {
  const [data, setData] = useState<any[]>([]);
  const { toast } = useToast();

  const fetchData = async () => {
    // Get the last 6 months
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 5);

    const { data: expenses, error: expensesError } = await supabase
      .from('expenses')
      .select('amount, date')
      .gte('date', startDate.toISOString())
      .lte('date', endDate.toISOString());

    const { data: incomes, error: incomesError } = await supabase
      .from('income')
      .select('amount, date')
      .gte('date', startDate.toISOString())
      .lte('date', endDate.toISOString());

    if (expensesError || incomesError) {
      toast({
        title: "Error fetching financial data",
        description: expensesError?.message || incomesError?.message,
        variant: "destructive",
      });
      return;
    }

    const monthlyData: Record<string, { income: number; expenses: number }> = {};

    // Initialize the last 6 months
    for (let i = 0; i < 6; i++) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthKey = date.toISOString().substring(0, 7);
      monthlyData[monthKey] = { income: 0, expenses: 0 };
    }

    // Aggregate expenses
    expenses?.forEach((expense: any) => {
      const monthKey = expense.date.substring(0, 7);
      if (monthlyData[monthKey]) {
        monthlyData[monthKey].expenses += parseFloat(expense.amount);
      }
    });

    // Aggregate income
    incomes?.forEach((income: any) => {
      const monthKey = income.date.substring(0, 7);
      if (monthlyData[monthKey]) {
        monthlyData[monthKey].income += parseFloat(income.amount);
      }
    });

    // Convert to array and sort by date
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
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => `$${parseFloat(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} />
              <Line type="monotone" dataKey="income" stroke="#4a5568" strokeWidth={2} />
              <Line type="monotone" dataKey="expenses" stroke="#ecc94b" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};