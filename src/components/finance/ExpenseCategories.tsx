import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { ExpensePieChart } from "./charts/ExpensePieChart";

export const ExpenseCategories = () => {
  const [data, setData] = useState<any[]>([]);
  const { toast } = useToast();
  const colors = ['#1a365d', '#4a5568', '#ecc94b', '#fc8181', '#68d391'];

  const fetchData = async () => {
    const { data: expenses, error: expensesError } = await supabase
      .from('expenses')
      .select(`
        amount,
        expenses_categories (
          name
        )
      `);
    
    if (expensesError) {
      toast({
        title: "Error fetching expenses",
        description: expensesError.message,
        variant: "destructive",
      });
      return;
    }

    const categoryTotals = expenses?.reduce((acc: Record<string, number>, expense: any) => {
      const categoryName = expense.expenses_categories?.name || 'Uncategorized';
      acc[categoryName] = (acc[categoryName] || 0) + parseFloat(expense.amount);
      return acc;
    }, {});

    const chartData = Object.entries(categoryTotals || {}).map(([name, value]) => ({
      name,
      value,
      color: colors[Math.floor(Math.random() * colors.length)]
    }));

    setData(chartData);
  };

  useEffect(() => {
    fetchData();

    const channel = supabase
      .channel('expenses_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'expenses' },
        () => {
          fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-[#1a365d]">Expense Categories</CardTitle>
      </CardHeader>
      <CardContent>
        <ExpensePieChart data={data} />
      </CardContent>
    </Card>
  );
};