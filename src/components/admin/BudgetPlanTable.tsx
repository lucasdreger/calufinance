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
  const [sortField, setSortField] = useState<SortField>('category');
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
        return direction * a.description.toLowerCase().localeCompare(b.description.toLowerCase());
      case 'category':
        const categoryA = a.expenses_categories.name.toLowerCase();
        const categoryB = b.expenses_categories.name.toLowerCase();
        
        // First compare categories
        const categoryComparison = categoryA.localeCompare(categoryB);
        
        // If categories are different, return the category comparison
        if (categoryComparison !== 0) {
          return direction * categoryComparison;
        }
        
        // If categories are the same, compare descriptions
        const descriptionA = a.description.toLowerCase();
        const descriptionB = b.description.toLowerCase();
        return direction * descriptionA.localeCompare(descriptionB);
      case 'amount':
        return direction * (a.estimated_amount - b.estimated_amount);
      case 'status':
        return direction * (Number(a.requires_status) - Number(b.requires_status));
      default:
        return 0;
    }
  });

  let currentCategory = '';

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
        {sortedPlans.map((plan, index) => {
          const isNewCategory = currentCategory !== plan.expenses_categories.name;
          currentCategory = plan.expenses_categories.name;

          return (
            <TableRow 
              key={plan.id}
              className={`
                ${isNewCategory ? 'border-t-2 border-gray-200' : ''}
                ${index % 2 === 0 ? 'bg-gray-50/50' : 'bg-white'}
                hover:bg-gray-100 transition-colors
                ${isNewCategory ? 'mt-2' : ''}
              `}
            >
              <TableCell className="pl-4">
                {isNewCategory && (
                  <div className="font-medium text-sm text-gray-500 -mt-2 mb-2">
                    {plan.expenses_categories.name}
                  </div>
                )}
                {plan.description}
              </TableCell>
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
          );
        })}
      </TableBody>
    </Table>
  );
};