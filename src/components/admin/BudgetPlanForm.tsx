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
  initialValues?: any;
  mode?: 'create' | 'edit';
  onCancel?: () => void;
  categories: any[];
}

export const BudgetPlanForm = ({ onSubmit, initialValues, mode = 'create', onCancel, categories }: BudgetPlanFormProps) => {
  const [formData, setFormData] = useState({
    category_id: initialValues?.category_id || '',
    description: initialValues?.description || '',
    estimated_amount: initialValues?.estimated_amount || '',
    is_fixed: initialValues?.is_fixed || false,
    requires_status: initialValues?.requires_status || false,
  });

  useEffect(() => {
    if (initialValues) {
      setFormData({
        category_id: initialValues.category_id || '',
        description: initialValues.description || '',
        estimated_amount: initialValues.estimated_amount || '',
        is_fixed: initialValues.is_fixed || false,
        requires_status: initialValues.requires_status || false,
      });
    }
  }, [initialValues]);

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

  // Sort categories alphabetically
  const sortedCategories = [...categories].sort((a, b) => 
    a.name.toLowerCase().localeCompare(b.name.toLowerCase())
  );

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
              {sortedCategories.map((category) => (
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

      <div className="flex gap-2">
        <Button type="submit" className="flex-1">
          {mode === 'create' ? 'Create Budget Plan' : 'Update Budget Plan'}
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
};