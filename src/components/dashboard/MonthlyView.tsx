import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { formatCurrency } from "@/utils/formatters";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface MonthlyTask {
  id: string;
  name: string;
  completed: boolean;
}

const defaultTasks: MonthlyTask[] = [
  { id: '1', name: 'Pay Rent', completed: false },
  { id: '2', name: 'Transfer to Crypto', completed: false },
  { id: '3', name: 'Transfer to Emergency Fund', completed: false },
  { id: '4', name: 'Transfer to Travel Fund', completed: false },
];

const defaultIncome = {
  lucas: 3867,
  camila: 2511,
  other: 220,
};

export const MonthlyView = () => {
  const [income, setIncome] = useState({ lucas: 0, camila: 0, other: 0 });
  const [tasks, setTasks] = useState<MonthlyTask[]>(defaultTasks);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [newExpense, setNewExpense] = useState({
    description: '',
    category: '',
    amount: '',
  });
  const { toast } = useToast();

  const totalIncome = income.lucas + income.camila + income.other;

  const handleLoadDefaults = () => {
    // This would load your predefined monthly expenses
    toast({
      title: "Defaults Loaded",
      description: "Your default monthly expenses have been loaded.",
    });
  };

  const handleLoadIncomeDefaults = () => {
    setIncome(defaultIncome);
    toast({
      title: "Income Defaults Loaded",
      description: "Your default monthly income has been loaded.",
    });
  };

  const handleAddExpense = async () => {
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
        amount: parseFloat(newExpense.amount),
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
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Monthly Income</CardTitle>
          <Button onClick={handleLoadIncomeDefaults}>Load Defaults</Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="text-sm font-medium">Lucas's Income</label>
              <Input
                type="number"
                value={income.lucas || ''}
                onChange={(e) => setIncome(prev => ({ ...prev, lucas: parseFloat(e.target.value) || 0 }))}
                placeholder="Enter income"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Camila's Income</label>
              <Input
                type="number"
                value={income.camila || ''}
                onChange={(e) => setIncome(prev => ({ ...prev, camila: parseFloat(e.target.value) || 0 }))}
                placeholder="Enter income"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Other Income</label>
              <Input
                type="number"
                value={income.other || ''}
                onChange={(e) => setIncome(prev => ({ ...prev, other: parseFloat(e.target.value) || 0 }))}
                placeholder="Enter other income"
              />
            </div>
          </div>
          <div className="text-right">
            <span className="text-lg font-bold">
              Total Income: {formatCurrency(totalIncome)}
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Fixed Expenses</CardTitle>
          <Button onClick={handleLoadDefaults}>Load Defaults</Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Description</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* This would be populated with your fixed expenses */}
              <TableRow>
                <TableCell>Gym</TableCell>
                <TableCell>{formatCurrency(100)}</TableCell>
                <TableCell>
                  <Checkbox />
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Variable Expenses</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
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
                  <SelectItem value="groceries">Groceries</SelectItem>
                  <SelectItem value="entertainment">Entertainment</SelectItem>
                  <SelectItem value="transportation">Transportation</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Amount"
                  value={newExpense.amount}
                  onChange={(e) => setNewExpense(prev => ({ ...prev, amount: e.target.value }))}
                />
                <Button onClick={handleAddExpense}>Add</Button>
              </div>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Description</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses.map((expense, index) => (
                  <TableRow key={index}>
                    <TableCell>{expense.description}</TableCell>
                    <TableCell>{expense.category}</TableCell>
                    <TableCell>{formatCurrency(expense.amount)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Monthly Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {tasks.map((task) => (
              <div key={task.id} className="flex items-center space-x-2">
                <Checkbox
                  checked={task.completed}
                  onCheckedChange={(checked) => {
                    setTasks(tasks.map(t => 
                      t.id === task.id ? { ...t, completed: checked as boolean } : t
                    ));
                  }}
                />
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  {task.name}
                </label>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};