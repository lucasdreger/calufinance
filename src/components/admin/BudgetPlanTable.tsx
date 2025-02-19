
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/utils/formatters";

export interface FixedExpensePlan {
  id: string;
  description: string;
  estimated_amount: number;
  requires_status: boolean;
  owner: string;
  expenses_categories: {
    name: string;
  };
}

export interface BudgetPlanTableProps {
  budgetPlans: FixedExpensePlan[];
  onDelete: (id: string) => void;
  onEdit: (plan: FixedExpensePlan) => void;
}

export const BudgetPlanTable = ({ budgetPlans, onDelete, onEdit }: BudgetPlanTableProps) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Description</TableHead>
          <TableHead>Category</TableHead>
          <TableHead>Amount</TableHead>
          <TableHead>Status Required</TableHead>
          <TableHead>Owner</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {budgetPlans.map((plan) => (
          <TableRow key={plan.id}>
            <TableCell>{plan.description}</TableCell>
            <TableCell>{plan.expenses_categories.name}</TableCell>
            <TableCell>{formatCurrency(plan.estimated_amount)}</TableCell>
            <TableCell>{plan.requires_status ? 'Yes' : 'No'}</TableCell>
            <TableCell>{plan.owner}</TableCell>
            <TableCell>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => onEdit(plan)}
                >
                  Edit
                </Button>
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={() => onDelete(plan.id)}
                >
                  Delete
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
