import { useEffect, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2, Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getStartOfMonth, getEndOfMonth } from "@/utils/dateHelpers";
import { useRealtimeSubscription } from "@/hooks/useRealtimeSubscription";

interface FixedExpensesStatusProps {
  selectedYear: number;
  selectedMonth: number;
}

export const FixedExpensesStatus = ({ selectedYear, selectedMonth }: FixedExpensesStatusProps) => {
  const [allTasksCompleted, setAllTasksCompleted] = useState<boolean>(false);
  const [totalTasks, setTotalTasks] = useState<number>(0);
  const [completedTasks, setCompletedTasks] = useState<number>(0);

  const fetchStatus = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Get user's family
    const { data: familyMember } = await supabase
      .from('family_members')
      .select('family_id')
      .eq('user_id', user.id)
      .single();

    if (!familyMember?.family_id) return;

    // Get status for monthly tasks for the family
    const { data: tasksData, error: tasksError } = await supabase
      .from('monthly_tasks')
      .select('*')
      .eq('family_id', familyMember.family_id)
      .eq('year', selectedYear)
      .eq('month', selectedMonth);

    if (tasksError) {
      console.error('Error fetching tasks:', tasksError);
      return;
    }

    const total = tasksData?.length || 0;
    const completed = tasksData?.filter(task => task.is_completed)?.length || 0;

    setTotalTasks(total);
    setCompletedTasks(completed);
    setAllTasksCompleted(total > 0 && completed === total);

    // Count all checkboxes on the page
    const checkboxes = document.querySelectorAll('input[type="checkbox"]');
    const totalCheckboxes = checkboxes.length;
    const completedCheckboxes = Array.from(checkboxes).filter(checkbox => checkbox.checked).length;

    setTotalTasks(totalCheckboxes);
    setCompletedTasks(completedCheckboxes);
    setAllTasksCompleted(totalCheckboxes > 0 && completedCheckboxes === totalCheckboxes);
  };

  useRealtimeSubscription(['monthly_tasks'], fetchStatus);

  useEffect(() => {
    fetchStatus();
  }, [selectedYear, selectedMonth]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <h3 className="text-lg font-medium">Fixed Expenses Status</h3>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <Info className="h-4 w-4 text-gray-500" />
            </TooltipTrigger>
            <TooltipContent>
              <p>Track the status of your fixed expenses for this month. Make sure to mark them as completed once paid.</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {!allTasksCompleted ? (
        <Alert variant="warning" className="bg-yellow-50 border-yellow-200">
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            {completedTasks} out of {totalTasks} required transfers have been completed for this month. 
            Please mark them as completed once you've made the transfers.
          </AlertDescription>
        </Alert>
      ) : (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            All required transfers for this month have been completed!
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};
