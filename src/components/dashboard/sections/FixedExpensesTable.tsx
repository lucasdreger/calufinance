import { useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { formatCurrency } from "@/utils/formatters";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

export const FixedExpensesTable = () => {
  const [budgetPlans, setBudgetPlans] = useState<any[]>([]);
  const [statusMap, setStatusMap] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

  useEffect(() => {
    const fetchBudgetPlans = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('budget_plans')
        .select(`
          *,
          expenses_categories (
            name
          )
        `)
        .eq('user_id', user.id)
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

      // Fetch status for current month
      const currentDate = new Date();
      const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      
      const { data: statusData, error: statusError } = await supabase
        .from('fixed_expenses_status')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', firstDayOfMonth.toISOString())
        .lt('date', new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1).toISOString());

      if (statusError) {
        toast({
          title: "Error fetching status",
          description: statusError.message,
          variant: "destructive",
        });
        return;
      }

      const newStatusMap: Record<string, boolean> = {};
      statusData?.forEach((status) => {
        newStatusMap[status.budget_plan_id] = status.is_paid;
      });
      setStatusMap(newStatusMap);
    };

    fetchBudgetPlans();
  }, [toast]);

  const handleStatusChange = async (planId: string, checked: boolean) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const currentDate = new Date();
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);

    const { error } = await supabase
      .from('fixed_expenses_status')
      .upsert({
        budget_plan_id: planId,
        user_id: user.id,
        date: firstDayOfMonth.toISOString(),
        is_paid: checked
      });

    if (error) {
      toast({
        title: "Error updating status",
        description: error.message,
        variant: "destructive",
      });
      return;
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

  let currentCategory = '';

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Description</TableHead>
          <TableHead>Category</TableHead>
          <TableHead>Amount</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {budgetPlans.map((plan, index) => {
          const isNewCategory = currentCategory !== plan.expenses_categories.name;
          currentCategory = plan.expenses_categories.name;
          
          return (
            <TableRow 
              key={plan.id}
              className={`
                ${isNewCategory ? 'border-t-2 border-gray-200' : ''}
                ${index % 2 === 0 ? 'bg-gray-50/50' : 'bg-white'}
                hover:bg-gray-100 transition-colors
                ${isNewCategory ? 'mt-2' : ''}
              `}
            >
              <TableCell className="pl-4">
                {isNewCategory && (
                  <div className="font-medium text-sm text-gray-500 -mt-2 mb-2">
                    {plan.expenses_categories.name}
                  </div>
                )}
                {plan.description}
              </TableCell>
              <TableCell>{plan.expenses_categories.name}</TableCell>
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
          );
        })}
      </TableBody>
    </Table>
  );
};