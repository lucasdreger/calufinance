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

  const fetchData = async () => {
    try {
      // Fetch categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('expenses_categories')
        .select('*');

      if (categoriesError) throw categoriesError;

      // Get current year's start and end dates
      const currentYear = new Date().getFullYear();
      const startDate = `${currentYear}-01-01`;
      const endDate = `${currentYear}-12-31`;

      // Fetch expenses
      const { data: expensesData, error: expensesError } = await supabase
        .from('expenses')
        .select('*')
        .gte('date', startDate)
        .lte('date', endDate);

      if (expensesError) throw expensesError;

      // Process data
      const processedData: MonthlyData = {};

      // Initialize data structure
      categoriesData?.forEach(category => {
        processedData[category.name] = {
          total: 0,
          average: 0,
          ...months.reduce((acc, month) => ({ ...acc, [month]: 0 }), {})
        };
      });

      // Fill in expense data
      expensesData?.forEach(expense => {
        const category = categoriesData?.find(c => c.id === expense.category_id);
        if (category) {
          const month = new Date(expense.date).toLocaleString('default', { month: 'short' });
          processedData[category.name][month] += parseFloat(expense.amount);
          processedData[category.name].total += parseFloat(expense.amount);
        }
      });

      // Calculate averages
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
              {months.map(month => (
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
                {months.map(month => (
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