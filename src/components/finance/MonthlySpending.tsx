import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

export const MonthlySpending = () => {
  const [categories, setCategories] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [newExpense, setNewExpense] = useState<Record<string, string>>({});
  const { toast } = useToast();

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

  const fetchExpenses = async () => {
    const { data, error } = await supabase
      .from('expenses')
      .select('*');
    
    if (error) {
      toast({
        title: "Error fetching expenses",
        description: error.message,
        variant: "destructive",
      });
      return;
    }
    
    setExpenses(data || []);
  };

  useEffect(() => {
    fetchCategories();
    fetchExpenses();

    const categoriesChannel = supabase
      .channel('categories_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'expenses_categories' },
        () => {
          fetchCategories();
        }
      )
      .subscribe();

    const expensesChannel = supabase
      .channel('expenses_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'expenses' },
        () => {
          fetchExpenses();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(categoriesChannel);
      supabase.removeChannel(expensesChannel);
    };
  }, []);

  const handleExpenseSubmit = async (categoryId: string) => {
    if (!newExpense[categoryId]) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to add expenses",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase
      .from('expenses')
      .insert({
        amount: parseFloat(newExpense[categoryId]),
        category_id: categoryId,
        date: new Date().toISOString().split('T')[0],
        is_fixed: categories.find(c => c.id === categoryId)?.is_fixed || false,
        user_id: user.id
      });

    if (error) {
      toast({
        title: "Error saving expense",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    setNewExpense(prev => ({ ...prev, [categoryId]: "" }));
    toast({
      title: "Expense saved",
      description: "Your expense has been successfully recorded.",
    });
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-[#1a365d]">Monthly Spending</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {categories.map((category) => {
            const categoryExpenses = expenses.filter(e => e.category_id === category.id);
            const totalAmount = categoryExpenses.reduce((sum, expense) => sum + parseFloat(expense.amount), 0);

            return (
              <div key={category.id}>
                <label className="text-sm font-medium text-gray-700 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {category.name}
                    <span className={`text-xs px-2 py-1 rounded ${
                      category.is_fixed ? 'bg-[#4a5568] text-white' : 'bg-[#ecc94b]'
                    }`}>
                      {category.is_fixed ? 'Fixed' : 'Variable'}
                    </span>
                  </div>
                  <span className="text-sm font-semibold">
                    Total: ${totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </label>
                <div className="flex gap-2 mt-1">
                  <Input 
                    type="number" 
                    value={newExpense[category.id] || ""}
                    onChange={(e) => setNewExpense(prev => ({ ...prev, [category.id]: e.target.value }))}
                    placeholder={`Enter ${category.name.toLowerCase()} expenses`}
                  />
                  <Button onClick={() => handleExpenseSubmit(category.id)}>
                    Add
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};