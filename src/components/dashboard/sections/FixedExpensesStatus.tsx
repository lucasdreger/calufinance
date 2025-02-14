<<<<<<< HEAD
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
=======
const fetchStatus = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  // Get user's family
  const { data: familyMember, error: familyError } = await supabase
    .from('family_members')
    .select('family_id')
    .eq('user_id', user.id)
    .maybeSingle(); // Use maybeSingle() instead of single()
>>>>>>> 4d714e7 (Fix: Update fixed expenses status fetching and add family member management functions)

  if (familyError || !familyMember?.family_id) {
    console.error('Error fetching family:', familyError);
    return;
  }

<<<<<<< HEAD
export const FixedExpensesStatus = ({ selectedYear, selectedMonth }: FixedExpensesStatusProps) => {
  const [allTasksCompleted, setAllTasksCompleted] = useState<boolean>(false);
  const [totalTasks, setTotalTasks] = useState<number>(0);
  const [completedTasks, setCompletedTasks] = useState<number>(0);

  const fetchStatus = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Get user's family with maybeSingle() instead of single()
    const { data: familyMember, error: familyError } = await supabase
      .from('family_members')
      .select('family_id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (familyError) {
      console.error('Error fetching family:', familyError);
      return;
    }

    if (!familyMember?.family_id) {
      console.error('No family found for user');
      return;
    }

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
=======
  // Get all fixed expenses tasks for this month
  const { data: fixedExpensesTasks, error: tasksError } = await supabase
    .from('budget_plans')
    .select(`
      id,
      fixed_expenses_status (
        is_paid
      )
    `)
    .eq('requires_status', true)
    .eq('family_id', familyMember.family_id);

  if (tasksError) {
    console.error('Error fetching tasks:', tasksError);
    return;
  }

  const total = fixedExpensesTasks?.length || 0;
  const completed = fixedExpensesTasks?.filter(task => 
    task.fixed_expenses_status?.some(status => status.is_paid)
  )?.length || 0;
>>>>>>> 4d714e7 (Fix: Update fixed expenses status fetching and add family member management functions)

  setTotalTasks(total);
  setCompletedTasks(completed);
  setAllTasksCompleted(total > 0 && completed === total);
};