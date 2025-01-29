import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { calculateCreditCardTransfer } from "@/utils/creditCardCalculations";
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
    const result = await calculateCreditCardTransfer();
    
    if (!result) return;

    const { creditCardTotal, transferAmount } = result;

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
    } else if (transferAmount > 0) {
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
    } else {
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