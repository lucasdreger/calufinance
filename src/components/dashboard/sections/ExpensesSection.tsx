import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { FixedExpensesTable } from "./FixedExpensesTable";
import { ExpenseForm } from "./ExpenseForm";
import { ExpensesTable } from "./ExpensesTable";

interface ExpensesSectionProps {
  selectedYear: number;
  selectedMonth: number;
}

export const ExpensesSection = ({ selectedYear, selectedMonth }: ExpensesSectionProps) => {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const { toast } = useToast();
  const [lucasIncome, setLucasIncome] = useState<number>(0);
  const [creditCardBill, setCreditCardBill] = useState<number>(0);
  const [fixedExpenses, setFixedExpenses] = useState<any[]>([]);

  const fetchExpenses = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Calculate start and end dates for the selected month
    const startDate = new Date(selectedYear, selectedMonth, 1);
    const endDate = new Date(selectedYear, selectedMonth + 1, 0); // Last day of the month

    // First, ensure we have a credit card expense for this month
    const { data: creditCardCategory } = await supabase
      .from('expenses_categories')
      .select('id')
      .eq('name', 'Credit Card')
      .maybeSingle();

    if (creditCardCategory) {
      // Check if a credit card expense exists for this month
      const { data: existingCreditCardExpense } = await supabase
        .from('expenses')
        .select('*')
        .eq('category_id', creditCardCategory.id)
        .eq('user_id', user.id)
        .gte('date', startDate.toISOString().split('T')[0])
        .lte('date', endDate.toISOString().split('T')[0])
        .maybeSingle();

      // If no credit card expense exists for this month, create one
      if (!existingCreditCardExpense) {
        await supabase
          .from('expenses')
          .insert({
            amount: 0,
            description: 'Monthly Credit Card Bill',
            date: startDate.toISOString().split('T')[0],
            category_id: creditCardCategory.id,
            user_id: user.id,
            is_fixed: false
          });
      }
    }

    // Now fetch all expenses including the credit card expense
    const { data, error } = await supabase
      .from('expenses')
      .select(`
        *,
        expenses_categories (
          name
        )
      `)
      .eq('user_id', user.id)
      .gte('date', startDate.toISOString().split('T')[0])
      .lte('date', endDate.toISOString().split('T')[0])
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

  const fetchLucasIncome = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('income')
      .select('amount')
      .eq('source', 'Primary Job')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      toast({
        title: "Error fetching Lucas's income",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    setLucasIncome(data?.amount || 0);
  };

  const fetchCreditCardBill = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: categories } = await supabase
      .from('expenses_categories')
      .select('id')
      .eq('name', 'Credit Card')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!categories) return;

    const { data: creditCardExpense } = await supabase
      .from('expenses')
      .select('amount')
      .eq('category_id', categories.id)
      .eq('user_id', user.id)
      .gte('date', new Date(selectedYear, selectedMonth, 1).toISOString())
      .lte('date', new Date(selectedYear, selectedMonth + 1, 0).toISOString())
      .maybeSingle();

    setCreditCardBill(creditCardExpense?.amount || 0);
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
    fetchLucasIncome();
    fetchCreditCardBill();
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
              lucasIncome={lucasIncome}
              creditCardBill={creditCardBill}
              fixedExpenses={fixedExpenses}
            />
          </div>
        </CardContent>
      </Card>
    </>
  );
};
