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
import { X, CheckCircle2, CircleSlash, Pencil } from "lucide-react";

interface BudgetPlanTableProps {
  budgetPlans: any[];
  onDelete: (id: string) => void;
  onEdit: (plan: any) => void;
}

export const BudgetPlanTable = ({ budgetPlans, onDelete, onEdit }: BudgetPlanTableProps) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Description</TableHead>
          <TableHead>Category</TableHead>
          <TableHead>Estimated Amount</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Status Required</TableHead>
          <TableHead className="w-[100px]">Actions</TableHead>
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
              {plan.requires_status ? (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              ) : (
                <CircleSlash className="h-4 w-4 text-gray-400" />
              )}
            </TableCell>
            <TableCell className="space-x-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onEdit(plan)}
                className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-500"
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDelete(plan.id)}
                className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-500"
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