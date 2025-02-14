import React from 'react';

interface Task {
  statusRequired: boolean;
  completed: boolean;
}

const TaskCounter: React.FC<{ tasks: Task[] }> = ({ tasks }) => {
  // Only count tasks that are required (statusRequired true)
  const requiredTasks = tasks.filter(task => task.statusRequired);
  const completedTasks = requiredTasks.filter(task => task.completed);
  return (
    <div>
      {completedTasks.length} of {requiredTasks.length} tasks completed
    </div>
  );
};

export default TaskCounter;
