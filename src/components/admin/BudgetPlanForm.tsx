import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
  }) => void;
}

export const BudgetPlanForm = ({ categories, onSubmit }: BudgetPlanFormProps) => {
  const [newPlan, setNewPlan] = useState({
    description: '',
    category_id: '',
    estimated_amount: '',
    is_fixed: false
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
      is_fixed: false
    });
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
        type="number"
        placeholder="Estimated Amount"
        value={newPlan.estimated_amount}
        onChange={(e) => setNewPlan(prev => ({ ...prev, estimated_amount: e.target.value }))}
      />
      <Button type="submit">Add Budget Plan</Button>
    </form>
  );
};