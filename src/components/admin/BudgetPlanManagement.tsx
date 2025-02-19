
import { useState, useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { BudgetPlanForm } from "./BudgetPlanForm";
import { BudgetPlanTable } from "./BudgetPlanTable";

export const BudgetPlanManagement = () => {
  const [categories, setCategories] = useState<any[]>([]);
  const [fixedExpensePlans, setFixedExpensePlans] = useState<any[]>([]);
  const [editingPlan, setEditingPlan] = useState<any>(null);
  const { toast } = useToast();
  const formRef = useRef<HTMLDivElement>(null);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('expenses_categories')
        .select('*')
        .order('name');
      
      if (error) {
        toast({
          title: "Error fetching categories",
          description: error.message,
          variant: "destructive",
        });
        return;
      }
      
      const uniqueCategories = data?.filter((category, index, self) =>
        index === self.findIndex((c) => c.name === category.name)
      ) || [];
      
      setCategories(uniqueCategories);
    } catch (error) {
      console.error('Error in fetchCategories:', error);
      toast({
        title: "Error",
        description: "Failed to fetch categories. Please try again.",
        variant: "destructive",
      });
    }
  };

  const fetchFixedExpensePlans = async () => {
    try {
      const { data, error } = await supabase
        .from('fixed_expense_plans')  // Corrected table name
        .select(`
          *,
          expenses_categories (
            name
          )
        `)
        .order('expenses_categories(name)', { ascending: true });
      
      if (error) {
        toast({
          title: "Error fetching fixed expense plans",
          description: error.message,
          variant: "destructive",
        });
        return;
      }
      
      setFixedExpensePlans(data || []);
    } catch (error) {
      console.error('Error in fetchFixedExpensePlans:', error);
      toast({
        title: "Error",
        description: "Failed to fetch fixed expense plans. Please try again.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchCategories();
    fetchFixedExpensePlans();
  }, []);

  const handleAddPlan = async (newPlan: any) => {
    try {
      if (!newPlan.description || !newPlan.category_id || !newPlan.estimated_amount) {
        toast({
          title: "Missing Fields",
          description: "Please fill in all required fields.",
          variant: "destructive",
        });
        return;
      }

      if (editingPlan) {
        const { error } = await supabase
          .from('fixed_expense_plans')  // Corrected table name
          .update({
            description: newPlan.description,
            category_id: newPlan.category_id,
            estimated_amount: parseFloat(newPlan.estimated_amount),
            requires_status: newPlan.requires_status,
            is_fixed: newPlan.is_fixed,
            owner: newPlan.owner,
          })
          .eq('id', editingPlan.id);

        if (error) {
          toast({
            title: "Error updating fixed expense plan",
            description: error.message,
            variant: "destructive",
          });
          return;
        }

        setEditingPlan(null);
        toast({
          title: "Fixed Expense Plan Updated",
          description: "Your fixed expense plan has been updated.",
        });
      } else {
        const { error } = await supabase
          .from('fixed_expense_plans')  // Corrected table name
          .insert({
            description: newPlan.description,
            category_id: newPlan.category_id,
            estimated_amount: parseFloat(newPlan.estimated_amount),
            requires_status: newPlan.requires_status,
            is_fixed: newPlan.is_fixed,
            owner: newPlan.owner,
          });

        if (error) {
          toast({
            title: "Error saving fixed expense plan",
            description: error.message,
            variant: "destructive",
          });
          return;
        }

        toast({
          title: "Fixed Expense Plan Added",
          description: "Your fixed expense plan has been saved.",
        });
      }
      
      fetchFixedExpensePlans();
    } catch (error: any) {
      console.error('Error in handleAddPlan:', error);
      toast({
        title: "Error",
        description: "Failed to save fixed expense plan. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteFixedExpensePlan = async (id: string) => {
    try {
      const { error } = await supabase
        .from('fixed_expense_plans')  // Corrected table name
        .delete()
        .eq('id', id);

      if (error) {
        toast({
          title: "Error deleting fixed expense plan",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      fetchFixedExpensePlans();
      toast({
        title: "Fixed Expense Plan Deleted",
        description: "Fixed expense plan has been removed.",
      });
    } catch (error: any) {
      console.error('Error in handleDeleteFixedExpensePlan:', error);
      toast({
        title: "Error",
        description: "Failed to delete fixed expense plan. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleEditFixedExpensePlan = (plan: any) => {
    setEditingPlan(plan);
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="space-y-6">
      <div ref={formRef}>
        <h3 className="text-lg font-medium mb-4">
          {editingPlan ? 'Edit Fixed Expense Plan' : 'Add Fixed Expense Plan'}
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
        <h3 className="text-lg font-medium mb-4">Fixed Expense Plans</h3>
        <BudgetPlanTable 
          budgetPlans={fixedExpensePlans}
          onDelete={handleDeleteFixedExpensePlan}
          onEdit={handleEditFixedExpensePlan}
        />
      </div>
    </div>
  );
};
