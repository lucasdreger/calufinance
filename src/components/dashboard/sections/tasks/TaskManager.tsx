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

    // Fetch Credit Card expenses for the current month only
    const { data: creditCardExpenses } = await supabase
      .from('expenses')
      .select('amount')
      .eq('category_id', categories.id)
      .gte('date', startOfMonth)
      .lte('date', endOfMonth)
      .maybeSingle();

    // Only proceed with credit card task if there's an actual bill amount
    const creditCardTotal = creditCardExpenses?.amount || 0;
    
    if (creditCardTotal === 0) {
      // Remove transfer task if credit card bill is not set
      setTasks(currentTasks => 
        currentTasks.filter(task => task.id !== 'credit-card-transfer')
      );
      return;
    }

    // Fetch Lucas's income for the current month - get the latest record
    const { data: lucasIncome } = await supabase
      .from('income')
      .select('amount')
      .eq('source', 'Primary Job')
      .gte('date', startOfMonth)
      .lte('date', endOfMonth)
      .order('date', { ascending: false })
      .limit(1)
      .maybeSingle();

    const lucasTotal = lucasIncome?.amount || 0;
    const remainingAmount = lucasTotal - creditCardTotal;
    const transferAmount = remainingAmount < 1000 ? Math.max(0, 1000 - remainingAmount) : 0;

    console.log('Debug values:', {
      lucasTotal,
      creditCardTotal,
      remainingAmount,
      shouldShowTransfer: remainingAmount < 1000,
      transferAmount,
      date: currentDate.toISOString(),
      startOfMonth,
      endOfMonth,
      incomeRecord: lucasIncome
    });

    if (remainingAmount < 1000) {
      const newTask = {
        id: 'credit-card-transfer',
        name: `Transfer ${formatCurrency(transferAmount)} to Credit Card bill`,
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
        description: `Need to transfer ${formatCurrency(transferAmount)} for this month's Credit Card bill`,
        variant: "default",
        className: "bg-yellow-50 border-yellow-200 text-yellow-800",
      });
    } else {
      // Remove transfer task if remaining amount is 1000 or more
      setTasks(currentTasks => 
        currentTasks.filter(task => task.id !== 'credit-card-transfer')
      );
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