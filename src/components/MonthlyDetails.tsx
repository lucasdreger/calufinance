
import React, { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";

interface Task {
  id: string;
  name: string;
  completed: boolean;
}

export const MonthlyDetails = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [fixedExpenses, setFixedExpenses] = useState<any[]>([]);

  const fetchTasks = async () => {
    const { data, error } = await supabase
      .from('monthly_tasks')
      .select('*');
    
    if (!error && data) {
      setTasks(data);
    }
  };

  const handleCheckboxChange = async (taskId: string, completed: boolean) => {
    const { error } = await supabase
      .from('monthly_tasks')
      .update({ completed })
      .eq('id', taskId);

    if (!error) {
      setTasks(tasks.map(task => 
        task.id === taskId ? { ...task, completed } : task
      ));
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const completedTasks = tasks.filter(task => task.completed).length;
  const totalTasks = tasks.length;

  return (
    <div className="space-y-4">
      <div className="text-sm text-gray-500">
        {completedTasks} out of {totalTasks} tasks completed
      </div>
      <div className="space-y-2">
        {tasks.map((task) => (
          <div key={task.id} className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={task.completed}
              onChange={(e) => handleCheckboxChange(task.id, e.target.checked)}
              className="form-checkbox h-4 w-4"
            />
            <span>{task.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
