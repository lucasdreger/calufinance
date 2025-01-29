import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/utils/formatters";

interface MonthlyTask {
  id: string;
  name: string;
  completed: boolean;
}

const defaultTasks: MonthlyTask[] = [
  { id: '1', name: 'Pay Rent', completed: false },
  { id: '2', name: 'Transfer to Crypto', completed: false },
  { id: '3', name: 'Transfer to Emergency Fund', completed: false },
  { id: '4', name: 'Transfer to Travel Fund', completed: false },
];

export const TasksSection = () => {
  const [tasks, setTasks] = useState<MonthlyTask[]>(defaultTasks);
  const { toast } = useToast();

  const calculateTransferAmount = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const currentDate = new Date();
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString();
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).toISOString();

    // First, get the Credit Card category ID
    const { data: categories, error: categoryError } = await supabase
      .from('expenses_categories')
      .select('id')
      .eq('user_id', user.id)
      .eq('name', 'Credit Card')
      .single();

    if (categoryError) {
      console.error('Error fetching Credit Card category:', categoryError);
      return;
    }

    // Then fetch Credit Card expenses using the category ID
    const { data: creditCardExpenses, error: creditCardError } = await supabase
      .from('expenses')
      .select('amount')
      .eq('user_id', user.id)
      .eq('category_id', categories.id)
      .gte('date', startOfMonth)
      .lte('date', endOfMonth)
      .single();

    if (creditCardError && creditCardError.code !== 'PGRST116') {
      console.error('Error fetching Credit Card expenses:', creditCardError);
      return;
    }

    // Fetch Lucas's income
    const { data: lucasIncome, error: incomeError } = await supabase
      .from('income')
      .select('amount')
      .eq('user_id', user.id)
      .eq('source', 'Primary Job')
      .gte('date', startOfMonth)
      .lte('date', endOfMonth)
      .single();

    if (incomeError && incomeError.code !== 'PGRST116') {
      console.error('Error fetching income:', incomeError);
      return;
    }

    const creditCardTotal = creditCardExpenses?.amount || 0;
    const lucasTotal = lucasIncome?.amount || 0;
    const remainingAmount = lucasTotal - creditCardTotal;

    console.log('Credit Card Total:', creditCardTotal);
    console.log('Lucas Total:', lucasTotal);
    console.log('Remaining Amount:', remainingAmount);

    if (creditCardTotal === 0) {
      toast({
        title: "Credit Card Bill Not Set",
        description: "Please update the Credit Card bill amount for this month.",
        variant: "default",
        className: "bg-yellow-50 border-yellow-200 text-yellow-800",
      });
    } else if (remainingAmount < 1000) {
      const transferAmount = 1000 - remainingAmount;
      const newTask = {
        id: 'credit-card-transfer',
        name: `Camila to transfer ${formatCurrency(transferAmount)} for Credit Card bill`,
        completed: false,
      };

      setTasks(currentTasks => {
        const existingTaskIndex = currentTasks.findIndex(task => task.id === 'credit-card-transfer');
        if (existingTaskIndex >= 0) {
          const updatedTasks = [...currentTasks];
          updatedTasks[existingTaskIndex] = newTask;
          return updatedTasks;
        }
        return [...currentTasks, newTask];
      });

      toast({
        title: "Credit Card Transfer Required",
        description: `Camila needs to transfer ${formatCurrency(transferAmount)} to cover the Credit Card bill`,
        variant: "default",
        className: "bg-yellow-50 border-yellow-200 text-yellow-800",
      });
    }
  };

  useEffect(() => {
    calculateTransferAmount();

    // Subscribe to changes in expenses table
    const expensesChannel = supabase
      .channel('expenses_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'expenses' },
        () => {
          calculateTransferAmount();
        }
      )
      .subscribe();

    // Subscribe to changes in income table
    const incomeChannel = supabase
      .channel('income_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'income' },
        () => {
          calculateTransferAmount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(expensesChannel);
      supabase.removeChannel(incomeChannel);
    };
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Monthly Tasks</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {tasks.map((task) => (
            <div key={task.id} className="flex items-center space-x-2">
              <Checkbox
                checked={task.completed}
                onCheckedChange={(checked) => {
                  setTasks(tasks.map(t => 
                    t.id === task.id ? { ...t, completed: checked as boolean } : t
                  ));
                }}
              />
              <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                {task.name}
              </label>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};