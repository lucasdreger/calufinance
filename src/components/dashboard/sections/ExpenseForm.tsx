
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrencyInput, parseCurrencyInput } from "@/utils/formatters";

interface ExpenseFormProps {
  categories: any[];
  onExpenseAdded: () => void;
}

export const ExpenseForm = ({ categories, onExpenseAdded }: ExpenseFormProps) => {
  const [newExpense, setNewExpense] = useState({
    description: '',
    category: '',
    amount: '',
  });
  const { toast } = useToast();

  const handleAmountBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const numericValue = parseCurrencyInput(e.target.value);
    setNewExpense(prev => ({
      ...prev,
      amount: formatCurrencyInput(numericValue)
    }));
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Allow only numbers and decimal point while typing
    const value = e.target.value.replace(/[^\d.]/g, '');
    setNewExpense(prev => ({ ...prev, amount: value }));
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newExpense.description || !newExpense.category || !newExpense.amount) {
      toast({
        title: "Missing Fields",
        description: "Please fill in all expense fields.",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase
      .from('expenses')
      .insert({
        amount: parseCurrencyInput(newExpense.amount),
        description: newExpense.description,
        category_id: newExpense.category,
        date: new Date().toISOString().split('T')[0],
      });

    if (error) {
      toast({
        title: "Error saving expense",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    setNewExpense({
      description: '',
      category: '',
      amount: '',
    });

    onExpenseAdded();

    toast({
      title: "Success",
      description: "Expense added successfully",
    });
  };

  return (
    <form onSubmit={handleAddExpense} className="space-y-4">
      <div className="space-y-2">
        <Input
          type="text"
          placeholder="Description"
          value={newExpense.description}
          onChange={(e) => setNewExpense(prev => ({ ...prev, description: e.target.value }))}
        />
      </div>

      <div className="space-y-2">
        <Select value={newExpense.category} onValueChange={(value) => setNewExpense(prev => ({ ...prev, category: value }))}>
          <SelectTrigger>
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Input
          type="text"
          placeholder="Amount"
          value={newExpense.amount}
          onChange={handleAmountChange}
          onBlur={handleAmountBlur}
        />
      </div>

      <Button type="submit" className="w-full">
        Add Expense
      </Button>
    </form>
  );
};
