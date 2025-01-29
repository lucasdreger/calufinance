import { useState } from "react";
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

  const handleAmountBlur = () => {
    const numericValue = parseCurrencyInput(editValue);
    setEditValue(formatCurrency(numericValue).replace(/[^0-9.]/g, ''));
  };

  return (
    <div className="space-y-4">
      {expenses.some(expense => 
        expense.amount === 0 && 
        expense.expenses_categories?.name === "American Express bill"
      ) && (
        <Alert variant="warning" className="bg-yellow-50 border-yellow-200">
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            The American Express bill amount is set to 0. Please update it if you have received the bill.
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
                    value={editValue}
                    onChange={handleAmountChange}
                    onBlur={handleAmountBlur}
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