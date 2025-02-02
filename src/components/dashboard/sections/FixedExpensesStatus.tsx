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
import { useToast } from "@/hooks/use-toast";

interface FixedExpensesStatusProps {
  selectedYear: number;
  selectedMonth: number;
}

interface StatusMap {
  [key: string]: boolean;
}

export const FixedExpensesStatus = ({ selectedYear, selectedMonth }: FixedExpensesStatusProps) => {
  const [allTasksCompleted, setAllTasksCompleted] = useState<boolean>(false);
  const [totalTasks, setTotalTasks] = useState<number>(0);
  const [completedTasks, setCompletedTasks] = useState<number>(0);
  const [statusMap, setStatusMap] = useState<StatusMap>({});
  const [stateVersion, setStateVersion] = useState(0);
  const { toast } = useToast();

  const fetchStatus = async () => {
    console.log("🔄 Fetching status from Supabase...");
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const startDate = new Date(selectedYear, selectedMonth, 1).toISOString();
    const endDate = new Date(selectedYear, selectedMonth + 1, 0).toISOString();

    const { data: fixedExpenses, error: fixedError } = await supabase
      .from("budget_plans")
      .select("id")
      .eq("user_id", user.id)
      .eq("requires_status", true)
      .eq("is_fixed", true);

    if (fixedError || !fixedExpenses) return;

    const { data: completedStatuses, error: statusError } = await supabase
      .from("fixed_expenses_status")
      .select("budget_plan_id, is_paid")
      .eq("user_id", user.id)
      .gte("date", startDate)
      .lte("date", endDate);

    if (statusError) return;

    const statusLookup = new Map(completedStatuses?.map(status => [status.budget_plan_id, status.is_paid]));

    console.log("✅ Received status data:", Object.fromEntries(statusLookup));

    setStatusMap(Object.fromEntries(statusLookup));
    setTotalTasks(fixedExpenses.length);
    const completed = fixedExpenses.filter(expense => statusLookup.get(expense.id) === true).length;
    setCompletedTasks(completed);
    setAllTasksCompleted(completed === fixedExpenses.length);
    setStateVersion(prev => prev + 1);
  };

  const handleCheckboxChange = async (budgetPlanId: string, isChecked: boolean) => {
    // Validate UUID before making the request
    if (!budgetPlanId || typeof budgetPlanId !== 'string' || budgetPlanId === 'NaN') {
      console.error('Invalid budget plan ID:', budgetPlanId);
      toast({
        title: "Error",
        description: "Invalid budget plan ID",
        variant: "destructive",
      });
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const date = new Date(selectedYear, selectedMonth, 1);

    try {
      // First check if a status already exists
      const { data: existingStatus } = await supabase
        .from("fixed_expenses_status")
        .select("id")
        .eq("budget_plan_id", budgetPlanId)
        .eq("user_id", user.id)
        .eq("date", date.toISOString())
        .maybeSingle();

      let error;
      
      if (existingStatus) {
        // Update existing status
        const { error: updateError } = await supabase
          .from("fixed_expenses_status")
          .update({ 
            is_paid: isChecked,
            completed_at: isChecked ? new Date().toISOString() : null
          })
          .eq("id", existingStatus.id);
        
        error = updateError;
      } else {
        // Insert new status
        const { error: insertError } = await supabase
          .from("fixed_expenses_status")
          .insert({
            budget_plan_id: budgetPlanId,
            user_id: user.id,
            date: date.toISOString(),
            is_paid: isChecked,
            completed_at: isChecked ? new Date().toISOString() : null
          });
        
        error = insertError;
      }

      if (error) {
        console.error("❌ Error updating status:", error);
        toast({
          title: "Error updating status",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      console.log(`✅ Updated budgetPlanId ${budgetPlanId}: is_paid = ${isChecked}`);
      fetchStatus();
      
    } catch (err) {
      console.error("❌ Unexpected error in handleCheckboxChange:", err);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchStatus();

    const channel = supabase
      .channel("fixed_expenses_status_changes")
      .on("postgres_changes", 
        { event: "*", schema: "public", table: "fixed_expenses_status" },
        (payload) => {
          console.log("🔔 Supabase event received:", payload);
          fetchStatus();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedYear, selectedMonth]);

  return (
    <div key={stateVersion} className="space-y-4">
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

      <div className="space-y-2">
        {Object.entries(statusMap).map(([id, isPaid]) => (
          <div key={id} className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={isPaid || false}
              onChange={(e) => handleCheckboxChange(id, e.target.checked)}
            />
            <label>Expense {id}</label>
          </div>
        ))}
      </div>
    </div>
  );
};