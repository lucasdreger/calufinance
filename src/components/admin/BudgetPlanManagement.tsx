import { useState, useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { BudgetPlanForm } from "./BudgetPlanForm";
import { BudgetPlanTable } from "./BudgetPlanTable";
import { InfoCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export const BudgetPlanManagement = () => {
  const [categories, setCategories] = useState<any[]>([]);
  const [budgetPlans, setBudgetPlans] = useState<any[]>([]);
  const [editingPlan, setEditingPlan] = useState<any>(null);
  const { toast } = useToast();
  const formRef = useRef<HTMLDivElement>(null);

  const fetchCategories = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('expenses_categories')
      .select('*')
      .eq('user_id', user.id)
      .order('name');
    
    if (error) {
      toast({
        title: "Error fetching categories",
        description: error.message,
        variant: "destructive",
      });
      return;
    }
    
    // Remove duplicates based on category name
    const uniqueCategories = data?.filter((category, index, self) =>
      index === self.findIndex((c) => c.name === category.name)
    ) || [];
    
    setCategories(uniqueCategories);
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

    if (editingPlan) {
      const { error } = await supabase
        .from('budget_plans')
        .update({
          description: newPlan.description,
          category_id: newPlan.category_id,
          estimated_amount: parseFloat(newPlan.estimated_amount),
          requires_status: newPlan.requires_status,
          is_fixed: newPlan.is_fixed,
        })
        .eq('id', editingPlan.id);

      if (error) {
        toast({
          title: "Error updating budget plan",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      setEditingPlan(null);
      toast({
        title: "Budget Plan Updated",
        description: "Your budget plan has been updated.",
      });
    } else {
      const { error } = await supabase
        .from('budget_plans')
        .insert({
          description: newPlan.description,
          category_id: newPlan.category_id,
          estimated_amount: parseFloat(newPlan.estimated_amount),
          requires_status: newPlan.requires_status,
          user_id: user.id,
          is_fixed: newPlan.is_fixed,
        });

      if (error) {
        toast({
          title: "Error saving budget plan",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Budget Plan Added",
        description: "Your budget plan has been saved.",
      });
    }
    
    fetchBudgetPlans();
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

  const handleEditBudgetPlan = (plan: any) => {
    setEditingPlan(plan);
    // Smooth scroll to form
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="space-y-6">
      <div ref={formRef}>
        <h3 className="text-lg font-medium mb-4">
          {editingPlan ? 'Edit Budget Plan' : 'Add Budget Plan'}
        </h3>
        <BudgetPlanForm 
          categories={categories}
          onSubmit={handleAddPlan}
          initialValues={editingPlan}
          mode={editingPlan ? 'edit' : 'create'}
          onCancel={editingPlan ? () => setEditingPlan(null) : undefined}
        />
      </div>
      <div>
        <h3 className="text-lg font-medium mb-4">Budget Plans</h3>
        <BudgetPlanTable 
          budgetPlans={budgetPlans}
          onDelete={handleDeleteBudgetPlan}
          onEdit={handleEditBudgetPlan}
        />
      </div>
    </div>
  );
};
