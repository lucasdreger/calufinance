import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/utils/formatters";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { X } from "lucide-react";

export const BudgetAdministration = () => {
  const [categories, setCategories] = useState<any[]>([]);
  const [budgetPlans, setBudgetPlans] = useState<any[]>([]);
  const [newCategory, setNewCategory] = useState('');
  const [newPlan, setNewPlan] = useState({
    description: '',
    category_id: '',
    estimated_amount: '',
    is_fixed: false
  });
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

  const handleAddCategory = async () => {
    if (!newCategory.trim()) {
      toast({
        title: "Missing Category Name",
        description: "Please enter a category name.",
        variant: "destructive",
      });
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to add categories",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase
      .from('expenses_categories')
      .insert({
        name: newCategory.trim(),
        user_id: user.id,
      });

    if (error) {
      toast({
        title: "Error saving category",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    setNewCategory('');
    fetchCategories();
    
    toast({
      title: "Category Added",
      description: "Your category has been saved.",
    });
  };

  const handleDeleteCategory = async (id: string) => {
    const { error } = await supabase
      .from('expenses_categories')
      .delete()
      .eq('id', id);

    if (error) {
      toast({
        title: "Error deleting category",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    fetchCategories();
    toast({
      title: "Category Deleted",
      description: "Category has been removed.",
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

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddCategory();
    }
  };

  const handleAddPlan = async () => {
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

    setNewPlan({
      description: '',
      category_id: '',
      estimated_amount: '',
      is_fixed: false
    });
    
    fetchBudgetPlans();
    
    toast({
      title: "Budget Plan Added",
      description: "Your budget plan has been saved.",
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Budget Administration</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Category Management Section */}
          <div className="space-y-2">
            <h3 className="text-lg font-medium">Categories</h3>
            <div className="flex gap-2">
              <Input
                placeholder="New Category Name"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                onKeyPress={handleKeyPress}
              />
              <Button onClick={handleAddCategory}>Add Category</Button>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category Name</TableHead>
                  <TableHead className="w-[50px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell>{category.name}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteCategory(category.id)}
                        className="h-8 w-8 p-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Budget Plans Section */}
          <div className="space-y-2">
            <h3 className="text-lg font-medium">Budget Plans</h3>
            <div className="grid gap-4 md:grid-cols-4">
              <Input
                placeholder="Description"
                value={newPlan.description}
                onChange={(e) => setNewPlan(prev => ({ ...prev, description: e.target.value }))}
              />
              <Select
                value={newPlan.category_id}
                onValueChange={(value) => setNewPlan(prev => ({ ...prev, category_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="number"
                placeholder="Estimated Amount"
                value={newPlan.estimated_amount}
                onChange={(e) => setNewPlan(prev => ({ ...prev, estimated_amount: e.target.value }))}
              />
              <Button onClick={handleAddPlan}>Add Budget Plan</Button>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Description</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Estimated Amount</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="w-[50px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {budgetPlans.map((plan) => (
                  <TableRow key={plan.id}>
                    <TableCell>{plan.description}</TableCell>
                    <TableCell>{plan.expenses_categories.name}</TableCell>
                    <TableCell>{formatCurrency(plan.estimated_amount)}</TableCell>
                    <TableCell>{plan.is_fixed ? 'Fixed' : 'Variable'}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteBudgetPlan(plan.id)}
                        className="h-8 w-8 p-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};