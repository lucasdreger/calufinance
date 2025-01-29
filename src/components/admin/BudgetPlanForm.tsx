import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrencyInput, parseCurrencyInput } from "@/utils/formatters";

interface BudgetPlanFormProps {
  categories: any[];
  onSubmit: (plan: {
    description: string;
    category_id: string;
    estimated_amount: string;
    is_fixed: boolean;
    requires_status: boolean;
  }) => void;
  initialValues?: {
    id?: string;
    description: string;
    category_id: string;
    estimated_amount: number;
    is_fixed: boolean;
    requires_status: boolean;
  };
  onCancel?: () => void;
}

export const BudgetPlanForm = ({ categories, onSubmit, initialValues, onCancel }: BudgetPlanFormProps) => {
  const [newPlan, setNewPlan] = useState({
    description: '',
    category_id: '',
    estimated_amount: '',
    is_fixed: true, // Always set to true since all budget plans are fixed
    requires_status: true
  });

  useEffect(() => {
    if (initialValues) {
      setNewPlan({
        description: initialValues.description,
        category_id: initialValues.category_id,
        estimated_amount: formatCurrencyInput(initialValues.estimated_amount),
        is_fixed: true, // Always set to true
        requires_status: initialValues.requires_status
      });
    }
  }, [initialValues]);

  const handleAmountBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const numericValue = parseCurrencyInput(e.target.value);
    setNewPlan(prev => ({
      ...prev,
      estimated_amount: formatCurrencyInput(numericValue)
    }));
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Allow only numbers and decimal point while typing
    const value = e.target.value.replace(/[^\d.]/g, '');
    setNewPlan(prev => ({ ...prev, estimated_amount: value }));
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }
    onSubmit(newPlan);
    if (!initialValues) {
      setNewPlan({
        description: '',
        category_id: '',
        estimated_amount: '',
        is_fixed: true,
        requires_status: true
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-4">
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
        placeholder="Estimated Amount"
        value={newPlan.estimated_amount}
        onChange={handleAmountChange}
        onBlur={handleAmountBlur}
      />
      <div className="flex items-center space-x-2">
        <Checkbox
          id="requires_status"
          checked={newPlan.requires_status}
          onCheckedChange={(checked) => 
            setNewPlan(prev => ({ ...prev, requires_status: checked as boolean }))
          }
        />
        <label htmlFor="requires_status" className="text-sm">Requires Status</label>
      </div>
      <div className="md:col-span-4 flex justify-end gap-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit">
          {initialValues ? 'Update' : 'Add'} Budget Plan
        </Button>
      </div>
    </form>
  );
};