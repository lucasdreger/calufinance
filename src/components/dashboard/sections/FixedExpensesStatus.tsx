
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
import { getStartOfMonth, getEndOfMonth, formatDateForSupabase } from "@/utils/dateHelpers";

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

  const fetchStatus = async () => {
    console.log("🔄 Fetching status from Supabase...");
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const startDate = getStartOfMonth(selectedYear, selectedMonth);
    const endDate = getEndOfMonth(selectedYear, selectedMonth);

    console.log("Date range:", {
      startDate: formatDateForSupabase(startDate),
      endDate: formatDateForSupabase(endDate)
    });

    const { data: fixedExpenses, error: expensesError } = await supabase
      .from('budget_plans')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_fixed', true);

    if (expensesError) {
      console.error('Error fetching fixed expenses:', expensesError);
      return;
    }

    const { data: statusData, error: statusError } = await supabase
      .from('fixed_expenses_status')
      .select('budget_plan_id, is_paid')
      .eq('user_id', user.id)
      .gte('date', formatDateForSupabase(startDate))
      .lt('date', formatDateForSupabase(endDate));

    if (statusError) {
      console.error('Error fetching status:', statusError);
      return;
    }

    console.log("📊 Status data:", statusData);

    const statusLookup = new Map(statusData?.map(status => [status.budget_plan_id, status.is_paid]) || []);
    const newStatusMap = Object.fromEntries(statusLookup);

    console.log("✅ Processed status data:", newStatusMap);

    setStatusMap(newStatusMap);
    setTotalTasks(fixedExpenses?.length || 0);
    setCompletedTasks(statusData?.filter(status => status.is_paid)?.length || 0);
    setAllTasksCompleted(
      fixedExpenses?.length > 0 && 
      statusData?.filter(status => status.is_paid)?.length === fixedExpenses?.length
    );
  };

  useEffect(() => {
    fetchStatus();

    const statusChannel = supabase
      .channel("fixed_expenses_status_changes")
      .on("postgres_changes", 
        { event: "*", schema: "public", table: "fixed_expenses_status" },
        (payload) => {
          console.log("🔔 Status change detected:", payload);
          fetchStatus();
        }
      )
      .subscribe();

    const plansChannel = supabase
      .channel("budget_plans_changes")
      .on("postgres_changes", 
        { event: "*", schema: "public", table: "budget_plans" },
        (payload) => {
          console.log("🔔 Budget plans change detected:", payload);
          fetchStatus();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(statusChannel);
      supabase.removeChannel(plansChannel);
    };
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
