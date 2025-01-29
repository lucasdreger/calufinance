import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

interface BudgetPlanFormProps {
  onSubmit: (data: any) => void;
  initialData?: any;
  mode?: 'create' | 'edit';
}

export const BudgetPlanForm = ({ onSubmit, initialData, mode = 'create' }: BudgetPlanFormProps) => {
  const [categories, setCategories] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    category_id: initialData?.category_id || '',
    description: initialData?.description || '',
    estimated_amount: initialData?.estimated_amount || '',
    is_fixed: initialData?.is_fixed || false,
    requires_status: initialData?.requires_status || false,
  });
  const { toast } = useToast();

  useEffect(() => {
    const fetchCategories = async () => {
      const { data: categoriesData, error } = await supabase
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

      // Sort categories alphabetically by name
      const sortedCategories = categoriesData.sort((a, b) => 
        a.name.toLowerCase().localeCompare(b.name.toLowerCase())
      );
      
      setCategories(sortedCategories);
    };

    fetchCategories();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <Select
            value={formData.category_id}
            onValueChange={(value) => handleInputChange('category_id', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Input
            id="description"
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            placeholder="Enter description"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="estimated_amount">Estimated Amount</Label>
          <Input
            id="estimated_amount"
            type="number"
            value={formData.estimated_amount}
            onChange={(e) => handleInputChange('estimated_amount', e.target.value)}
            placeholder="Enter amount"
          />
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="is_fixed"
            checked={formData.is_fixed}
            onCheckedChange={(checked) => handleInputChange('is_fixed', checked)}
          />
          <Label htmlFor="is_fixed">Fixed Expense</Label>
        </div>

        {formData.is_fixed && (
          <div className="flex items-center space-x-2">
            <Switch
              id="requires_status"
              checked={formData.requires_status}
              onCheckedChange={(checked) => handleInputChange('requires_status', checked)}
            />
            <Label htmlFor="requires_status">Requires Status Tracking</Label>
          </div>
        )}
      </div>

      <Button type="submit" className="w-full">
        {mode === 'create' ? 'Create Budget Plan' : 'Update Budget Plan'}
      </Button>
    </form>
  );
};