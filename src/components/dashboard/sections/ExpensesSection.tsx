import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { FixedExpensesTable } from "./FixedExpensesTable";
import { ExpenseForm } from "./ExpenseForm";
import { ExpensesTable } from "./ExpensesTable";

export const ExpensesSection = () => {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const { toast } = useToast();

  const fetchExpenses = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('expenses')
      .select(`
        *,
        expenses_categories (
          name
        )
      `)
      .eq('user_id', user.id)
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
    const { data, error } = await supabase
      .from('expenses_categories')
      .select('*');
    
    if (error) {
      toast({
        title: "Error fetching categories",
        description: error.message,
        variant: "destructive",
      });
      return;
    }
    
    setCategories(data || []);
  };

  useEffect(() => {
    fetchCategories();
    fetchExpenses();

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
  }, []);

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
            <ExpensesTable expenses={expenses} />
          </div>
        </CardContent>
      </Card>
    </>
  );
};