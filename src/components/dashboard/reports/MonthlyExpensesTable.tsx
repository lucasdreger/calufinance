import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { formatCurrency } from "@/utils/formatters";
import { formatDateForSupabase } from "@/utils/dateHelpers";

interface MonthlyData {
  [key: string]: {
    [month: string]: number;
    total: number;
    average: number;
  };
}

export const MonthlyExpensesTable = () => {
  const [monthlyData, setMonthlyData] = useState<MonthlyData>({});
  const [categories, setCategories] = useState<any[]>([]);
  const { toast } = useToast();

  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ];

  const monthHasExpenses = (month: string) => {
    return Object.values(monthlyData).some(categoryData => categoryData[month] > 0);
  };

  const activeMonths = months.filter(month => monthHasExpenses(month));

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: categoriesData, error: categoriesError } = await supabase
        .from('expenses_categories')
        .select('*')
        .eq('user_id', user.id);

      if (categoriesError) throw categoriesError;

      const currentYear = new Date().getFullYear();
      const startDate = new Date(Date.UTC(currentYear, 0, 1));
      const endDate = new Date(Date.UTC(currentYear, 11, 31, 23, 59, 59, 999));

      const { data: expensesData, error: expensesError } = await supabase
        .from('expenses')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', formatDateForSupabase(startDate))
        .lte('date', formatDateForSupabase(endDate));

      if (expensesError) throw expensesError;

      const processedData: MonthlyData = {};
      categoriesData?.forEach(category => {
        processedData[category.name] = {
          total: 0,
          average: 0,
          ...months.reduce((acc, month) => ({ ...acc, [month]: 0 }), {})
        };
      });

      expensesData?.forEach(expense => {
        const category = categoriesData?.find(c => c.id === expense.category_id);
        if (category) {
          const date = new Date(expense.date);
          const month = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
            .toLocaleString('default', { month: 'short' });
          processedData[category.name][month] += parseFloat(expense.amount);
          processedData[category.name].total += parseFloat(expense.amount);
        }
      });

      Object.keys(processedData).forEach(category => {
        const monthsWithExpenses = months.filter(month => processedData[category][month] > 0).length;
        processedData[category].average = monthsWithExpenses > 0
          ? processedData[category].total / monthsWithExpenses
          : 0;
      });

      setCategories(categoriesData || []);
      setMonthlyData(processedData);
    } catch (error: any) {
      toast({
        title: "Error fetching data",
        description: error.message,
        variant: "destructive",
      });
    }
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

    return () => {
      supabase.removeChannel(expensesChannel);
    };
  }, []);

  return (
    <Card className="shadow-lg">
      <CardHeader className="border-b bg-muted/30">
        <CardTitle className="text-xl font-semibold text-primary">Monthly Expenses by Category</CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto p-0">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="font-bold text-primary w-[200px] sticky left-0 bg-background">Category</TableHead>
              {activeMonths.map(month => (
                <TableHead key={month} className="text-right font-medium text-muted-foreground">
                  {month}
                </TableHead>
              ))}
              <TableHead className="text-right font-bold text-primary">Total</TableHead>
              <TableHead className="text-right font-bold text-primary">Average</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Object.entries(monthlyData).map(([category, data], index) => (
              <TableRow 
                key={category}
                className={`
                  ${index % 2 === 0 ? 'bg-background' : 'bg-muted/30'}
                  hover:bg-muted/50 transition-colors
                `}
              >
                <TableCell className="font-medium sticky left-0 bg-inherit border-r">
                  {category}
                </TableCell>
                {activeMonths.map(month => (
                  <TableCell 
                    key={month} 
                    className="text-right tabular-nums"
                  >
                    {data[month] > 0 ? formatCurrency(data[month]) : '—'}
                  </TableCell>
                ))}
                <TableCell className="text-right font-semibold tabular-nums">
                  {formatCurrency(data.total)}
                </TableCell>
                <TableCell className="text-right font-semibold tabular-nums">
                  {formatCurrency(data.average)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
