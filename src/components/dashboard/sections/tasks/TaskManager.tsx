import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/utils/formatters";
import { TaskList } from "./TaskList";

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

export const TaskManager = () => {
  const [tasks, setTasks] = useState<MonthlyTask[]>(defaultTasks);
  const { toast } = useToast();

  const updateTasks = async () => {
    const currentDate = new Date();
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString();
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).toISOString();

    // Get Credit Card category
    const { data: categories } = await supabase
      .from('expenses_categories')
      .select('id')
      .eq('name', 'Credit Card')
      .maybeSingle();

    if (!categories) {
      console.error('Credit Card category not found');
      return;
    }

    // Fetch Credit Card expenses for the current month
    const { data: creditCardExpenses } = await supabase
      .from('expenses')
      .select('amount')
      .eq('category_id', categories.id)
      .gte('date', startOfMonth)
      .lte('date', endOfMonth)
      .maybeSingle();

    const creditCardTotal = creditCardExpenses?.amount || 0;

    // Fetch Lucas's income for the current month
    const { data: lucasIncome } = await supabase
      .from('income')
      .select('amount')
      .eq('source', 'Primary Job')
      .gte('date', startOfMonth)
      .lte('date', endOfMonth)
      .maybeSingle();

    const lucasTotal = lucasIncome?.amount || 0;

    if (creditCardTotal === 0) {
      toast({
        title: "Credit Card Bill Not Set",
        description: "Please update the Credit Card bill amount for this month.",
        variant: "default",
        className: "bg-yellow-50 border-yellow-200 text-yellow-800",
      });
      
      setTasks(currentTasks => 
        currentTasks.filter(task => task.id !== 'credit-card-transfer')
      );
    } else {
      // Calculate transfer amount based on Lucas's income if credit card bill is less than 1000
      let transferAmount = creditCardTotal * 0.3; // Default 30% of credit card bill
      
      if (creditCardTotal < 1000 && lucasTotal > 0) {
        const remainingAmount = lucasTotal - creditCardTotal;
        transferAmount = remainingAmount < 1000 ? 1000 - remainingAmount : 0;
      }

      if (transferAmount > 0) {
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
          description: `Camila needs to transfer ${formatCurrency(transferAmount)} for this month's Credit Card bill`,
          variant: "default",
          className: "bg-yellow-50 border-yellow-200 text-yellow-800",
        });
      }
    }
  };

  useEffect(() => {
    updateTasks();

    const expensesChannel = supabase
      .channel('expenses_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'expenses' },
        () => {
          updateTasks();
        }
      )
      .subscribe();

    const incomeChannel = supabase
      .channel('income_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'income' },
        () => {
          updateTasks();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(expensesChannel);
      supabase.removeChannel(incomeChannel);
    };
  }, []);

  const handleTaskUpdate = (taskId: string, completed: boolean) => {
    setTasks(tasks.map(t => 
      t.id === taskId ? { ...t, completed } : t
    ));
  };

  return <TaskList tasks={tasks} onTaskUpdate={handleTaskUpdate} />;
};