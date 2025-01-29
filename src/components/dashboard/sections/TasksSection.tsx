import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TaskManager } from "./tasks/TaskManager";

export const TasksSection = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Monthly Tasks</CardTitle>
      </CardHeader>
      <CardContent>
        <TaskManager />
      </CardContent>
    </Card>
  );
};