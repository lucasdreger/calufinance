import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { formatCurrency } from "@/utils/formatters";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface MonthlyData {
  month: string;
  planned: number;
  actual: number;
  deviation: number;
  deviationPercentage: number;
}

export const MonthlyDeviation = () => {
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const { toast } = useToast();

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Get start and end dates for the last 12 months
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 11); // Get last 12 months

    // Get all budget plans (planned expenses)
    const { data: budgetPlans, error: budgetError } = await supabase
      .from('budget_plans')
      .select('*')
      .eq('user_id', user.id);

    if (budgetError) {
      toast({
        title: "Error fetching budget plans",
        description: budgetError.message,
        variant: "destructive",
      });
      return;
    }

    // Get all actual expenses
    const { data: expenses, error: expensesError } = await supabase
      .from('expenses')
      .select('*')
      .eq('user_id', user.id)
      .gte('date', startDate.toISOString())
      .lte('date', endDate.toISOString());

    if (expensesError) {
      toast({
        title: "Error fetching expenses",
        description: expensesError.message,
        variant: "destructive",
      });
      return;
    }

    // Initialize monthly totals for the last 12 months
    const monthlyTotals: Record<string, { planned: number; actual: number }> = {};
    for (let i = 0; i < 12; i++) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthKey = date.toISOString().slice(0, 7); // YYYY-MM
      monthlyTotals[monthKey] = { planned: 0, actual: 0 };
    }

    // Sum planned expenses
    budgetPlans?.forEach((plan) => {
      Object.keys(monthlyTotals).forEach((monthKey) => {
        monthlyTotals[monthKey].planned += Number(plan.estimated_amount);
      });
    });

    // Sum actual expenses
    expenses?.forEach((expense) => {
      const monthKey = expense.date.slice(0, 7); // YYYY-MM
      if (monthlyTotals[monthKey]) {
        monthlyTotals[monthKey].actual += Number(expense.amount);
      }
    });

    // Transform data for display
    const formattedData: MonthlyData[] = Object.entries(monthlyTotals)
      .map(([month, data]) => {
        const deviation = data.actual - data.planned;
        const deviationPercentage = data.planned !== 0 
          ? (deviation / data.planned) * 100 
          : 0;

        return {
          month: new Date(month + '-01').toLocaleString('default', { month: 'long', year: 'numeric' }),
          planned: data.planned,
          actual: data.actual,
          deviation,
          deviationPercentage,
        };
      })
      .sort((a, b) => new Date(b.month).getTime() - new Date(a.month).getTime());

    setMonthlyData(formattedData);
  };

  useEffect(() => {
    fetchData();

    const budgetChannel = supabase
      .channel('budget_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'budget_plans' },
        () => fetchData()
      )
      .subscribe();

    const expensesChannel = supabase
      .channel('expenses_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'expenses' },
        () => fetchData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(budgetChannel);
      supabase.removeChannel(expensesChannel);
    };
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Monthly Budget Deviation</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Month</TableHead>
              <TableHead>Planned</TableHead>
              <TableHead>Actual</TableHead>
              <TableHead>Deviation</TableHead>
              <TableHead>Deviation %</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {monthlyData.map((data) => (
              <TableRow key={data.month}>
                <TableCell>{data.month}</TableCell>
                <TableCell>{formatCurrency(data.planned)}</TableCell>
                <TableCell>{formatCurrency(data.actual)}</TableCell>
                <TableCell className={data.deviation > 0 ? 'text-red-500' : 'text-green-500'}>
                  {formatCurrency(Math.abs(data.deviation))}
                  {data.deviation > 0 ? ' over' : ' under'}
                </TableCell>
                <TableCell className={data.deviation > 0 ? 'text-red-500' : 'text-green-500'}>
                  {data.deviationPercentage.toFixed(1)}%
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};