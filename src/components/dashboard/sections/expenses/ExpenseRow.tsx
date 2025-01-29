import { useState, useRef, useEffect } from "react";
import { TableCell, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Pencil, Save, Trash2, X } from "lucide-react";
import { formatCurrency, parseCurrencyInput } from "@/utils/formatters";

interface ExpenseRowProps {
  expense: any;
  onEdit: (expense: any) => void;
  onSave: (expenseId: string) => void;
  onDelete: (expenseId: string) => void;
  onCancel: () => void;
  editingId: string | null;
  editValue: string;
  onEditValueChange: (value: string) => void;
  onAmountBlur: (expenseId: string) => void;
  onKeyPress: (e: React.KeyboardEvent<HTMLInputElement>, expenseId: string) => void;
}

export const ExpenseRow = ({
  expense,
  onEdit,
  onSave,
  onDelete,
  onCancel,
  editingId,
  editValue,
  onEditValueChange,
  onAmountBlur,
  onKeyPress,
}: ExpenseRowProps) => {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingId === expense.id && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingId, expense.id]);

  return (
    <TableRow>
      <TableCell>{expense.description}</TableCell>
      <TableCell>{expense.expenses_categories?.name}</TableCell>
      <TableCell>
        {editingId === expense.id ? (
          <Input
            ref={inputRef}
            value={editValue}
            onChange={(e) => onEditValueChange(e.target.value)}
            onBlur={() => onAmountBlur(expense.id)}
            onKeyDown={(e) => onKeyPress(e, expense.id)}
            className="max-w-[150px]"
          />
        ) : (
          formatCurrency(expense.amount)
        )}
      </TableCell>
      <TableCell>{new Date(expense.date).toLocaleDateString()}</TableCell>
      <TableCell>
        {editingId === expense.id ? (
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onSave(expense.id)}
              className="h-8 w-8 p-0 hover:bg-green-50 hover:text-green-500"
            >
              <Save className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onCancel}
              className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-500"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit(expense)}
              className="h-8 w-8 p-0"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(expense.id)}
              className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-500"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      </TableCell>
    </TableRow>
  );
};