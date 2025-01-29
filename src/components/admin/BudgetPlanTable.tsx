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
import { X, CheckCircle2, CircleSlash, Pencil, ArrowUpDown } from "lucide-react";
import { useState } from "react";

interface BudgetPlanTableProps {
  budgetPlans: any[];
  onDelete: (id: string) => void;
  onEdit: (plan: any) => void;
}

type SortField = 'description' | 'category' | 'amount' | 'status';
type SortDirection = 'asc' | 'desc';

export const BudgetPlanTable = ({ budgetPlans, onDelete, onEdit }: BudgetPlanTableProps) => {
  const [sortField, setSortField] = useState<SortField>('description');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedPlans = [...budgetPlans].sort((a, b) => {
    const direction = sortDirection === 'asc' ? 1 : -1;
    
    switch (sortField) {
      case 'description':
        return direction * a.description.localeCompare(b.description);
      case 'category':
        return direction * a.expenses_categories.name.localeCompare(b.expenses_categories.name);
      case 'amount':
        return direction * (a.estimated_amount - b.estimated_amount);
      case 'status':
        return direction * (Number(a.requires_status) - Number(b.requires_status));
      default:
        return 0;
    }
  });

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>
            <Button
              variant="ghost"
              onClick={() => handleSort('description')}
              className="h-8 px-2 hover:bg-transparent"
            >
              Description
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          </TableHead>
          <TableHead>
            <Button
              variant="ghost"
              onClick={() => handleSort('category')}
              className="h-8 px-2 hover:bg-transparent"
            >
              Category
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          </TableHead>
          <TableHead>
            <Button
              variant="ghost"
              onClick={() => handleSort('amount')}
              className="h-8 px-2 hover:bg-transparent"
            >
              Estimated Amount
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          </TableHead>
          <TableHead>
            <Button
              variant="ghost"
              onClick={() => handleSort('status')}
              className="h-8 px-2 hover:bg-transparent"
            >
              Status Required
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          </TableHead>
          <TableHead className="w-[100px]">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sortedPlans.map((plan) => (
          <TableRow key={plan.id}>
            <TableCell>{plan.description}</TableCell>
            <TableCell>{plan.expenses_categories.name}</TableCell>
            <TableCell>{formatCurrency(plan.estimated_amount)}</TableCell>
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