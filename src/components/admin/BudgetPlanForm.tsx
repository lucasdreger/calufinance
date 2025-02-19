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
import { useToast } from "@/components/ui/use-toast";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

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
    owner: initialValues?.owner || '',
  });

  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

  useEffect(() => {
    if (initialValues) {
      setFormData({
        category_id: initialValues.category_id || '',
        description: initialValues.description || '',
        estimated_amount: initialValues.estimated_amount || '',
        is_fixed: initialValues.is_fixed || false,
        requires_status: initialValues.requires_status || false,
        owner: initialValues.owner || '',
      });
    }
  }, [initialValues]);

  const validateForm = () => {
    const newErrors: Record<string, boolean> = {};
    
    if (!formData.category_id) newErrors.category_id = true;
    if (!formData.description) newErrors.description = true;
    if (!formData.estimated_amount) newErrors.estimated_amount = true;
    if (!formData.owner) newErrors.owner = true;
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      toast({
        title: "Required Fields Missing",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    onSubmit(formData);
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear error when field is updated
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: false }));
    }
  };

  // Remove duplicates by using Set with category IDs
  const uniqueCategories = Array.from(
    new Map(categories.map(cat => [cat.id, cat])).values()
  ).sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="category" className="flex items-center gap-1">
            Category <span className="text-red-500">*</span>
          </Label>
          <Select
            value={formData.category_id}
            onValueChange={(value) => handleInputChange('category_id', value)}
          >
            <SelectTrigger className={errors.category_id ? 'border-red-500' : ''}>
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent>
              {uniqueCategories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description" className="flex items-center gap-1">
            Description <span className="text-red-500">*</span>
          </Label>
          <Input
            id="description"
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            placeholder="Enter description"
            className={errors.description ? 'border-red-500' : ''}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="estimated_amount" className="flex items-center gap-1">
            Estimated Amount <span className="text-red-500">*</span>
          </Label>
          <Input
            id="estimated_amount"
            type="number"
            value={formData.estimated_amount}
            onChange={(e) => handleInputChange('estimated_amount', e.target.value)}
            placeholder="Enter amount"
            className={errors.estimated_amount ? 'border-red-500' : ''}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="owner" className="flex items-center gap-1">
            Owner <span className="text-red-500">*</span>
          </Label>
          <Select
            value={formData.owner}
            onValueChange={(value) => handleInputChange('owner', value)}
          >
            <SelectTrigger className={errors.owner ? 'border-red-500' : ''}>
              <SelectValue placeholder="Select an owner" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Lucas">Lucas</SelectItem>
              <SelectItem value="Camila">Camila</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="requires_status"
            checked={formData.requires_status}
            onCheckedChange={(checked) => handleInputChange('requires_status', checked)}
          />
          <Label htmlFor="requires_status">Status Required</Label>
        </div>

        {Object.keys(errors).length > 0 && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Please fill in all required fields marked with *
            </AlertDescription>
          </Alert>
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
