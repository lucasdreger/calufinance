import { useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { formatCurrency } from "@/utils/formatters";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { formatDateForSupabase } from "@/utils/dateHelpers";
import { getStartOfMonth, getEndOfMonth } from "@/utils/dateHelpers";

interface BudgetPlan {
  id: string;
  description: string;
  estimated_amount: number;
  requires_status: boolean;
  expenses_categories: {
    name: string;
  };
}

export const FixedExpensesTable = () => {
  const [budgetPlans, setBudgetPlans] = useState<BudgetPlan[]>([]);
  const [statusMap, setStatusMap] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

  useEffect(() => {
    const fetchBudgetPlans = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const currentDate = new Date();
      const startDate = getStartOfMonth(currentDate.getFullYear(), currentDate.getMonth() + 1);
      const endDate = getEndOfMonth(currentDate.getFullYear(), currentDate.getMonth() + 1);

      // Get only budget plans that require status tracking
      const { data, error } = await supabase
        .from('budget_plans')
        .select(`
          *,
          expenses_categories (
            name
          )
        `)
        .eq('requires_status', true)
        .order('expenses_categories(name)', { ascending: true })
        .order('description', { ascending: true });

      if (error) {
        toast({
          title: "Error fetching budget plans",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      setBudgetPlans(data || []);

      // Get status for these plans
      const { data: statusData, error: statusError } = await supabase
        .from('fixed_expenses_status')
        .select('*')
        .in('budget_plan_id', data?.map(plan => plan.id) || [])
        .gte('date', formatDateForSupabase(startDate))
        .lt('date', formatDateForSupabase(endDate));

      if (statusError) {
        toast({
          title: "Error fetching status",
          description: statusError.message,
          variant: "destructive",
        });
        return;
      }

      setStatusMap(statusData?.reduce((acc, status) => ({
        ...acc,
        [status.budget_plan_id]: status.is_paid
      }), {} as Record<string, boolean>));
    };

    fetchBudgetPlans();
  }, [toast]);

  const handleStatusChange = async (planId: string, checked: boolean) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const currentDate = new Date();
    const startDate = getStartOfMonth(currentDate.getFullYear(), currentDate.getMonth() + 1);

    const { data: existingStatus, error: checkError } = await supabase
      .from('fixed_expenses_status')
      .select('*')
      .eq('budget_plan_id', planId)
      .eq('user_id', user.id)
      .gte('date', formatDateForSupabase(startDate))
      .lt('date', formatDateForSupabase(getEndOfMonth(currentDate.getFullYear(), currentDate.getMonth() + 1)))
      .maybeSingle();

    if (checkError) {
      toast({
        title: "Error checking status",
        description: checkError.message,
        variant: "destructive",
      });
      return;
    }

    const now = new Date();
    const timestamp = formatDateForSupabase(now);

    if (existingStatus) {
      await supabase
        .from('fixed_expenses_status')
        .update({
          is_paid: checked,
          completed_at: checked ? timestamp : null
        })
        .eq('id', existingStatus.id);
    } else {
      await supabase
        .from('fixed_expenses_status')
        .insert({
          budget_plan_id: planId,
          user_id: user.id,
          date: formatDateForSupabase(startDate),
          is_paid: checked,
          completed_at: checked ? timestamp : null
        });
    }

    setStatusMap(prev => ({
      ...prev,
      [planId]: checked
    }));

    toast({
      title: checked ? "Marked as paid" : "Marked as unpaid",
      description: `Successfully updated payment status`,
    });
  };

  // Group plans by category
  const groupedPlans = budgetPlans.reduce((acc, plan) => {
    const category = plan.expenses_categories.name;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(plan);
    return acc;
  }, {} as Record<string, BudgetPlan[]>);

  return (
    <div className="space-y-6">
      {Object.entries(groupedPlans).map(([category, plans]) => (
        <div key={category} className="bg-white rounded-lg shadow-sm border">
          <div className="bg-gray-50 p-4 border-b">
            <h3 className="font-semibold text-gray-700">{category}</h3>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Description</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {plans.map((plan, index) => (
                <TableRow 
                  key={plan.id}
                  className={`
                    ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}
                    hover:bg-gray-100 transition-colors
                  `}
                >
                  <TableCell>{plan.description}</TableCell>
                  <TableCell>{formatCurrency(plan.estimated_amount)}</TableCell>
                  <TableCell>
                    {plan.requires_status && (
                      <Checkbox
                        checked={statusMap[plan.id] || false}
                        onCheckedChange={(checked) => handleStatusChange(plan.id, checked as boolean)}
                      />
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ))}
    </div>
  );
};