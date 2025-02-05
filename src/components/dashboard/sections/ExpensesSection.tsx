import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { FixedExpensesTable } from "./FixedExpensesTable";
import { ExpenseForm } from "./ExpenseForm";
import { ExpensesTable } from "./ExpensesTable";
import { getStartOfMonth, getEndOfMonth, formatDateForSupabase } from "@/utils/dateHelpers";

interface ExpensesSectionProps {
  selectedYear: number;
  selectedMonth: number;
}

export const ExpensesSection = ({ selectedYear, selectedMonth }: ExpensesSectionProps) => {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const { toast } = useToast();
  const [fixedExpenses, setFixedExpenses] = useState<any[]>([]);

  useEffect(() => {
    fetchExpenses();
    fetchFixedExpenses();
  }, [selectedYear, selectedMonth]);

  const fetchExpenses = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

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
      .eq('user_id', user.id)
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
  };

  const fetchCategories = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('expenses_categories')
      .select('*')
      .eq('user_id', user.id)
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
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('fixed_expenses_status')
      .select('*')
      .eq('user_id', user.id)
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

  useEffect(() => {
    fetchCategories();
    fetchExpenses();
    fetchFixedExpenses();

    // Subscribe to changes in expenses
    const expensesChannel = supabase
      .channel('expenses_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'expenses' },
        () => {
          fetchExpenses();
        }
      )
      .subscribe();

    // Subscribe to changes in categories
    const categoriesChannel = supabase
      .channel('expenses_categories_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'expenses_categories' },
        () => {
          fetchCategories();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(expensesChannel);
      supabase.removeChannel(categoriesChannel);
    };
  }, [selectedYear, selectedMonth]);

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
              onExpenseAdded={fetchExpenses}
            />
            <ExpensesTable 
              expenses={expenses} 
              onExpenseUpdated={fetchExpenses}
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
