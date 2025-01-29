import { MonthlyTaskItem } from "./MonthlyTaskItem";

interface Task {
  id: string;
  name: string;
  completed: boolean;
}

interface TaskListProps {
  tasks: Task[];
  onTaskUpdate: (taskId: string, completed: boolean) => void;
}

export const TaskList = ({ tasks, onTaskUpdate }: TaskListProps) => {
  return (
    <div className="space-y-2">
      {tasks.map((task) => (
        <MonthlyTaskItem
          key={task.id}
          id={task.id}
          name={task.name}
          completed={task.completed}
          onCompletedChange={(checked) => onTaskUpdate(task.id, checked)}
        />
      ))}
    </div>
  );
};