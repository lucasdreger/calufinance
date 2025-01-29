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

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to add expenses",
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
        user_id: user.id,
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

    toast({
      title: "Expense Added",
      description: "Your expense has been recorded.",
    });
    
    onExpenseAdded();
  };

  return (
    <form onSubmit={handleAddExpense} className="grid gap-4 md:grid-cols-3">
      <Input
        placeholder="Description"
        value={newExpense.description}
        onChange={(e) => setNewExpense(prev => ({ ...prev, description: e.target.value }))}
      />
      <Select
        value={newExpense.category}
        onValueChange={(value) => setNewExpense(prev => ({ ...prev, category: value }))}
      >
        <SelectTrigger>
          <SelectValue placeholder="Category" />
        </SelectTrigger>
        <SelectContent>
          {categories.map((category) => (
            <SelectItem key={category.id} value={category.id}>
              {category.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <div className="flex gap-2">
        <Input
          placeholder="Amount"
          value={newExpense.amount}
          onChange={handleAmountChange}
          onBlur={handleAmountBlur}
        />
        <Button type="submit">Add</Button>
      </div>
    </form>
  );
};