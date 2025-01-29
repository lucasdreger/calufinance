import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, TooltipProps } from 'recharts';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

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

  const formatTooltipValue = (value: number) => {
    return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-[#1a365d]">Expense Categories</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                label
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={formatTooltipValue} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};