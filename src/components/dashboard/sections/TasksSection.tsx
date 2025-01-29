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

  useEffect(() => {
    const fetchAmexAndIncome = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const currentDate = new Date();
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString();
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).toISOString();

      // Fetch AMEX expenses
      const { data: amexExpenses, error: amexError } = await supabase
        .from('expenses')
        .select('amount, expenses_categories(name)')
        .eq('user_id', user.id)
        .eq('expenses_categories.name', 'American Express bill')
        .gte('date', startOfMonth)
        .lte('date', endOfMonth);

      if (amexError) {
        console.error('Error fetching AMEX expenses:', amexError);
        return;
      }

      // Fetch Lucas's income
      const { data: lucasIncome, error: incomeError } = await supabase
        .from('income')
        .select('amount')
        .eq('user_id', user.id)
        .eq('source', 'Primary Job')
        .gte('date', startOfMonth)
        .lte('date', endOfMonth);

      if (incomeError) {
        console.error('Error fetching income:', incomeError);
        return;
      }

      const amexTotal = amexExpenses?.[0]?.amount || 0;
      const lucasTotal = lucasIncome?.[0]?.amount || 0;
      const remainingAmount = lucasTotal - amexTotal;

      if (amexTotal === 0) {
        toast({
          title: "American Express Bill Not Set",
          description: "Please update the American Express bill amount for this month.",
          variant: "warning",
        });
      } else if (remainingAmount < 1000) {
        const transferAmount = 1000 - remainingAmount;
        const newTask = {
          id: 'amex-transfer',
          name: `Camila to transfer ${formatCurrency(transferAmount)} for AMEX bill`,
          completed: false,
        };

        setTasks(currentTasks => {
          const existingTaskIndex = currentTasks.findIndex(task => task.id === 'amex-transfer');
          if (existingTaskIndex >= 0) {
            const updatedTasks = [...currentTasks];
            updatedTasks[existingTaskIndex] = newTask;
            return updatedTasks;
          }
          return [...currentTasks, newTask];
        });

        toast({
          title: "AMEX Transfer Required",
          description: `Camila needs to transfer ${formatCurrency(transferAmount)} to cover the AMEX bill`,
        });
      }
    };

    fetchAmexAndIncome();
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