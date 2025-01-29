import { useState } from "react";
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

interface BudgetPlanFormProps {
  categories: any[];
  onSubmit: (plan: {
    description: string;
    category_id: string;
    estimated_amount: string;
    is_fixed: boolean;
    requires_status: boolean;
  }) => void;
}

export const BudgetPlanForm = ({ categories, onSubmit }: BudgetPlanFormProps) => {
  const [newPlan, setNewPlan] = useState({
    description: '',
    category_id: '',
    estimated_amount: '',
    is_fixed: false,
    requires_status: true
  });

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }
    onSubmit(newPlan);
    setNewPlan({
      description: '',
      category_id: '',
      estimated_amount: '',
      is_fixed: false,
      requires_status: true
    });
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-5">
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
      <div className="flex items-center space-x-2">
        <Checkbox
          id="is_fixed"
          checked={newPlan.is_fixed}
          onCheckedChange={(checked) => 
            setNewPlan(prev => ({ ...prev, is_fixed: checked as boolean }))
          }
        />
        <label htmlFor="is_fixed" className="text-sm">Fixed Expense</label>
      </div>
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
      <Button type="submit" className="md:col-span-5">Add Budget Plan</Button>
    </form>
  );
};