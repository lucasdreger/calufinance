import { useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { formatCurrency } from "@/utils/formatters";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

export const FixedExpensesTable = () => {
  const [budgetPlans, setBudgetPlans] = useState<any[]>([]);
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
        .eq('is_fixed', true);

      if (error) {
        toast({
          title: "Error fetching budget plans",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      setBudgetPlans(data || []);
    };

    fetchBudgetPlans();
  }, [toast]);

  const handleStatusChange = async (id: string, checked: boolean) => {
    // Here you would update the status in your database
    // This is a placeholder for future implementation
    console.log(`Status changed for ${id}: ${checked}`);
  };

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
        {budgetPlans.map((plan) => (
          <TableRow key={plan.id}>
            <TableCell>{plan.description}</TableCell>
            <TableCell>{plan.expenses_categories.name}</TableCell>
            <TableCell>{formatCurrency(plan.estimated_amount)}</TableCell>
            <TableCell>
              {plan.requires_status && (
                <Checkbox
                  onCheckedChange={(checked) => handleStatusChange(plan.id, checked as boolean)}
                />
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};