import { Checkbox } from "@/components/ui/checkbox";

interface MonthlyTaskItemProps {
  id: string;
  name: string;
  completed: boolean;
  onCompletedChange: (checked: boolean) => void;
}

export const MonthlyTaskItem = ({ id, name, completed, onCompletedChange }: MonthlyTaskItemProps) => {
  return (
    <div className="flex items-center space-x-2">
      <Checkbox
        id={id}
        checked={completed}
        onCheckedChange={onCompletedChange}
      />
      <label
        htmlFor={id}
        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
      >
        {name}
      </label>
    </div>
  );
}; 