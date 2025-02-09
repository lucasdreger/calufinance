
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { FixedExpensesTable } from "./FixedExpensesTable";
import { ExpenseForm } from "./ExpenseForm";
import { ExpensesTable } from "./ExpensesTable";
import { getStartOfMonth, getEndOfMonth, formatDateForSupabase } from "@/utils/dateHelpers";
import { useRealtimeSubscription } from "@/hooks/useRealtimeSubscription";

interface ExpensesSectionProps {
  selectedYear: number;
  selectedMonth: number;
}

export const ExpensesSection = ({ selectedYear, selectedMonth }: ExpensesSectionProps) => {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [lucasIncome, setLucasIncome] = useState<number>(0);
  const [creditCardBill, setCreditCardBill] = useState<number>(0);
  const { toast } = useToast();
  const [fixedExpenses, setFixedExpenses] = useState<any[]>([]);

  useRealtimeSubscription(
    ['expenses', 'expenses_categories', 'monthly_income', 'budget_plans'],
    () => {
      fetchData();
      fetchCategories();
      fetchFixedExpenses();
    }
  );

  useEffect(() => {
    fetchData();
    fetchCategories();
    fetchFixedExpenses();
  }, [selectedYear, selectedMonth]);

  const fetchData = async () => {
    const startDate = getStartOfMonth(selectedYear, selectedMonth);
    const endDate = getEndOfMonth(selectedYear, selectedMonth);

    const { data, error } = await supabase
      .from('expenses')
      .select(`
        *,
        expenses_categories (
          name
        )
      `)
      .gte('date', formatDateForSupabase(startDate))
      .lte('date', formatDateForSupabase(endDate))
      .order('date', { ascending: false });
    
    if (error) {
      toast({
        title: "Error fetching expenses",
        description: error.message,
        variant: "destructive",
      });
      return;
    }
    
    const formattedExpenses = data?.map(expense => ({
      ...expense,
      category: expense.expenses_categories?.name
    })) || [];
    
    setExpenses(formattedExpenses);

    // Fetch Lucas's income
    const { data: lucasIncomeData } = await supabase
      .from('monthly_income')
      .select('amount')
      .eq('source', 'LUCAS')
      .eq('year', selectedYear)
      .eq('month', selectedMonth)
      .maybeSingle();

    setLucasIncome(lucasIncomeData?.amount || 0);

    // Fetch credit card bill
    const { data: creditCardCategory } = await supabase
      .from('expenses_categories')
      .select('id')
      .eq('name', 'Credit Card')
      .single();

    if (creditCardCategory) {
      const { data: creditCardExpense } = await supabase
        .from('expenses')
        .select('amount')
        .eq('category_id', creditCardCategory.id)
        .eq('date', `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-01`)
        .maybeSingle();

      setCreditCardBill(creditCardExpense?.amount || 0);
    }
  };

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from('expenses_categories')
      .select('*')
      .order('name');
    
    if (error) {
      toast({
        title: "Error fetching categories",
        description: error.message,
        variant: "destructive",
      });
      return;
    }
    
    // Remove duplicates based on name
    const uniqueCategories = data?.filter((category, index, self) =>
      index === self.findIndex((c) => c.name === category.name)
    ) || [];
    
    setCategories(uniqueCategories);
  };

  const fetchFixedExpenses = async () => {
    const { data, error } = await supabase
      .from('fixed_expenses_status')
      .select('*')
      .gte('date', new Date(selectedYear, selectedMonth, 1).toISOString())
      .lt('date', new Date(selectedYear, selectedMonth + 1, 1).toISOString());

    if (error) {
      toast({
        title: "Error fetching fixed expenses",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    setFixedExpenses(data || []);
  };

  const handleLoadDefaults = () => {
    toast({
      title: "Defaults Loaded",
      description: "Your default monthly expenses have been loaded.",
    });
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Fixed Expenses</CardTitle>
          <Button onClick={handleLoadDefaults}>Load Defaults</Button>
        </CardHeader>
        <CardContent>
          <FixedExpensesTable />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Variable Expenses</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <ExpenseForm 
              categories={categories}
              onExpenseAdded={fetchData}
            />
            <ExpensesTable 
              expenses={expenses} 
              onExpenseUpdated={fetchData}
              lucasIncome={lucasIncome}
              creditCardBill={creditCardBill}
              fixedExpenses={fixedExpenses}
              selectedYear={selectedYear}
              selectedMonth={selectedMonth}
            />
          </div>
        </CardContent>
      </Card>
    </>
  );
};
