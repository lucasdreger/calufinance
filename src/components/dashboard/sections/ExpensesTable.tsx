import { useState } from "react";
import { Table, TableBody } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { parseCurrencyInput } from "@/utils/formatters";
import { ExpenseRow } from "./expenses/ExpenseRow";
import { ExpenseAlerts } from "./expenses/ExpenseAlerts";
import { ExpenseTableHeader } from "./expenses/ExpenseTableHeader";

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

  // Calculate Lucas's salary
  const lucasSalary = expenses.find(expense => 
    expense.description?.toLowerCase().includes('lucas') && 
    expense.description?.toLowerCase().includes('salary')
  )?.amount || 0;

  // Calculate transfer amount (30% of Lucas's salary)
  const transferAmount = lucasSalary * 0.3;

  return (
    <div className="space-y-4">
      <ExpenseAlerts expenses={expenses} transferAmount={transferAmount} />
      
      <Table>
        <ExpenseTableHeader />
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
              onEditValueChange={(value) => setEditValue(value)}
              onAmountBlur={(expenseId) => handleSave(expenseId)}
              onKeyPress={(e, expenseId) => {
                if (e.key === 'Enter') {
                  handleSave(expenseId);
                } else if (e.key === 'Escape') {
                  handleCancel();
                }
              }}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
};