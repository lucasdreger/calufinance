import { Button } from "@/components/ui/button";
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

interface BudgetPlanTableProps {
  budgetPlans: any[];
  onDelete: (id: string) => void;
}

export const BudgetPlanTable = ({ budgetPlans, onDelete }: BudgetPlanTableProps) => {
  return (
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
                onClick={() => onDelete(plan.id)}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};