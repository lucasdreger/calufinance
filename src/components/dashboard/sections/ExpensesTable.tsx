import { useState, useEffect, useRef } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency, parseCurrencyInput } from "@/utils/formatters";
import { AlertCircle, Pencil, Save, Trash2, X } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ExpensesTableProps {
  expenses: any[];
  onExpenseUpdated: () => void;
}

export const ExpensesTable = ({ expenses, onExpenseUpdated }: ExpensesTableProps) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus and select input when editing starts
  useEffect(() => {
    if (editingId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingId]);

  const handleEdit = (expense: any) => {
    setEditingId(expense.id);
    setEditValue(expense.amount.toString());
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditValue("");
  };

  const handleDelete = async (expenseId: string) => {
    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', expenseId);

    if (error) {
      toast({
        title: "Error deleting expense",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    onExpenseUpdated();
    toast({
      title: "Expense Deleted",
      description: "The expense has been removed.",
    });
  };

  const handleSave = async (expenseId: string) => {
    const amount = parseCurrencyInput(editValue);
    
    const { error } = await supabase
      .from('expenses')
      .update({ amount })
      .eq('id', expenseId);

    if (error) {
      toast({
        title: "Error updating expense",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    setEditingId(null);
    setEditValue("");
    // Trigger immediate update
    onExpenseUpdated();
    
    toast({
      title: "Expense Updated",
      description: "The expense amount has been updated.",
    });
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^\d.]/g, '');
    setEditValue(value);
  };

  const handleAmountBlur = async (expenseId: string) => {
    const numericValue = parseCurrencyInput(editValue);
    setEditValue(formatCurrency(numericValue).replace(/[^0-9.]/g, ''));
    // Immediately save the value when focus is lost
    await handleSave(expenseId);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>, expenseId: string) => {
    if (e.key === 'Enter') {
      handleSave(expenseId);
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  // Calculate Lucas's salary for the current month
  const lucasSalary = expenses.find(expense => 
    expense.description?.toLowerCase().includes('lucas') && 
    expense.description?.toLowerCase().includes('salary')
  )?.amount || 0;

  // Calculate the transfer amount (30% of Lucas's salary)
  const transferAmount = lucasSalary * 0.3;

  return (
    <div className="space-y-4">
      {expenses.some(expense => 
        expense.amount === 0 && 
        expense.expenses_categories?.name === "Credit Card"
      ) && (
        <Alert variant="warning" className="bg-yellow-50 border-yellow-200">
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            The Credit Card bill amount is set to 0. Please update it if you have received the bill.
          </AlertDescription>
        </Alert>
      )}

      {transferAmount > 0 && !expenses.some(expense => 
        expense.description?.toLowerCase().includes('transfer to camila') &&
        Math.abs(expense.amount - transferAmount) < 0.01
      ) && (
        <Alert variant="warning" className="bg-yellow-50 border-yellow-200">
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            Remember to transfer {formatCurrency(transferAmount)} to Camila (30% of Lucas's salary).
          </AlertDescription>
        </Alert>
      )}
      
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Description</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Date</TableHead>
            <TableHead className="w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {expenses.map((expense) => (
            <TableRow key={expense.id}>
              <TableCell>{expense.description}</TableCell>
              <TableCell>{expense.expenses_categories?.name}</TableCell>
              <TableCell>
                {editingId === expense.id ? (
                  <Input
                    ref={inputRef}
                    value={editValue}
                    onChange={handleAmountChange}
                    onBlur={() => handleAmountBlur(expense.id)}
                    onKeyDown={(e) => handleKeyPress(e, expense.id)}
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
                      onClick={() => handleSave(expense.id)}
                      className="h-8 w-8 p-0 hover:bg-green-50 hover:text-green-500"
                    >
                      <Save className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleCancel}
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
                      onClick={() => handleEdit(expense)}
                      className="h-8 w-8 p-0"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(expense.id)}
                      className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};