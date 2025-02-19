
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

    // Get required budget plans that need status tracking
    const { data: requiredPlans, error: plansError } = await supabase
      .from('fixed_expense_plans')  // Corrected table name
      .select('id')
      .eq('requires_status', true);

    if (plansError) {
      console.error('Error fetching plans:', plansError);
      return;
    }

    const planIds = requiredPlans?.map(plan => plan.id) || [];
    
    if (planIds.length === 0) {
      setTotalTasks(0);
      setCompletedTasks(0);
      setAllTasksCompleted(false);
      return;
    }

    // Get status for these plans
    const { data: statusData, error: statusError } = await supabase
      .from('fixed_expenses_status')
      .select('*')
      .in('fixed_expense_plan_id', planIds)
      .eq('date', `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`);

    if (statusError) {
      console.error('Error fetching status:', statusError);
      return;
    }

    const total = planIds.length;
    const completed = statusData?.filter(status => status.is_paid)?.length || 0;

    setTotalTasks(total);
    setCompletedTasks(completed);
    setAllTasksCompleted(total > 0 && completed === total);
  };

  useRealtimeSubscription(['fixed_expense_plans', 'fixed_expenses_status'], fetchStatus);

  useEffect(() => {
    fetchStatus();
  }, [selectedYear, selectedMonth]);

  if (totalTasks === 0) {
    return null;
  }

  return (
    <Alert variant={allTasksCompleted ? "default" : "destructive"}>
      <AlertCircle className="h-4 w-4" />
      <AlertDescription>
        {completedTasks} of {totalTasks} tasks completed
      </AlertDescription>
    </Alert>
  );
};
