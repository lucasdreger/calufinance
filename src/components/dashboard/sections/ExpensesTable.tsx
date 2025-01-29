import { useState } from "react";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { parseCurrencyInput } from "@/utils/formatters";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ExpenseRow } from "./expenses/ExpenseRow";

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

  const handleAmountChange = (value: string) => {
    const numericValue = value.replace(/[^\d.]/g, '');
    setEditValue(numericValue);
  };

  const handleAmountBlur = async (expenseId: string) => {
    await handleSave(expenseId);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>, expenseId: string) => {
    if (e.key === 'Enter') {
      handleSave(expenseId);
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  // Calculate Lucas's salary
  const lucasSalary = expenses.find(expense => 
    expense.description?.toLowerCase().includes('lucas') && 
    expense.description?.toLowerCase().includes('salary')
  )?.amount || 0;

  // Calculate transfer amount (30% of Lucas's salary)
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
            <ExpenseRow
              key={expense.id}
              expense={expense}
              editingId={editingId}
              editValue={editValue}
              onEdit={handleEdit}
              onSave={handleSave}
              onDelete={handleDelete}
              onCancel={handleCancel}
              onEditValueChange={handleAmountChange}
              onAmountBlur={handleAmountBlur}
              onKeyPress={handleKeyPress}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
};