import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";

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