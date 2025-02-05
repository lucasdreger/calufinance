import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
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

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: savedTasks } = await supabase
      .from('monthly_tasks')
      .select('*')
      .eq('user_id', user.id);

    if (savedTasks?.length) {
      setTasks(savedTasks.map(task => ({
        id: task.task_id,
        name: task.name,
        completed: task.is_completed
      })));
    }
  };

  const handleTaskUpdate = (taskId: string, completed: boolean) => {
    setTasks(tasks.map(t => 
      t.id === taskId ? { ...t, completed } : t
    ));
  };

  return <TaskList tasks={tasks} onTaskUpdate={handleTaskUpdate} />;
};
