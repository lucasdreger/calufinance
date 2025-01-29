import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { BudgetPlanForm } from "./BudgetPlanForm";
import { BudgetPlanTable } from "./BudgetPlanTable";

export const BudgetPlanManagement = () => {
  const [categories, setCategories] = useState<any[]>([]);
  const [budgetPlans, setBudgetPlans] = useState<any[]>([]);
  const { toast } = useToast();

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from('expenses_categories')
      .select('*');
    
    if (error) {
      toast({
        title: "Error fetching categories",
        description: error.message,
        variant: "destructive",
      });
      return;
    }
    
    setCategories(data || []);
  };

  const fetchBudgetPlans = async () => {
    const { data, error } = await supabase
      .from('budget_plans')
      .select(`
        *,
        expenses_categories (
          name
        )
      `);
    
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

  useEffect(() => {
    fetchCategories();
    fetchBudgetPlans();
  }, []);

  const handleAddPlan = async (newPlan: any) => {
    if (!newPlan.description || !newPlan.category_id || !newPlan.estimated_amount) {
      toast({
        title: "Missing Fields",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to add budget plans",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase
      .from('budget_plans')
      .insert({
        description: newPlan.description,
        category_id: newPlan.category_id,
        estimated_amount: parseFloat(newPlan.estimated_amount),
        is_fixed: newPlan.is_fixed,
        user_id: user.id,
      });

    if (error) {
      toast({
        title: "Error saving budget plan",
        description: error.message,
        variant: "destructive",
      });
      return;
    }
    
    fetchBudgetPlans();
    
    toast({
      title: "Budget Plan Added",
      description: "Your budget plan has been saved.",
    });
  };

  const handleDeleteBudgetPlan = async (id: string) => {
    const { error } = await supabase
      .from('budget_plans')
      .delete()
      .eq('id', id);

    if (error) {
      toast({
        title: "Error deleting budget plan",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    fetchBudgetPlans();
    toast({
      title: "Budget Plan Deleted",
      description: "Budget plan has been removed.",
    });
  };

  return (
    <div className="space-y-2">
      <h3 className="text-lg font-medium">Budget Plans</h3>
      <BudgetPlanForm 
        categories={categories}
        onSubmit={handleAddPlan}
      />
      <BudgetPlanTable 
        budgetPlans={budgetPlans}
        onDelete={handleDeleteBudgetPlan}
      />
    </div>
  );
};