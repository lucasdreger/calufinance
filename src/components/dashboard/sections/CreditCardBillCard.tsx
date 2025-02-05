
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency, parseCurrencyInput } from "@/utils/formatters";
import { MonthlyTaskItem } from "@/components/dashboard/sections/tasks/MonthlyTaskItem";
import { CreditCardData } from "@/types/supabase";

interface CreditCardBillProps {
  selectedYear: number;
  selectedMonth: number;
}

export const CreditCardBillCard = ({ selectedYear, selectedMonth }: CreditCardBillProps) => {
  const [amount, setAmount] = useState(0);
  const [editAmount, setEditAmount] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [isTransferCompleted, setIsTransferCompleted] = useState(false);
  const [transferAmount, setTransferAmount] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, [selectedYear, selectedMonth]);

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .rpc('get_credit_card_data', {
        p_user_id: user.id,
        p_year: selectedYear,
        p_month: selectedMonth
      }) as { data: CreditCardData[] | null, error: Error | null };

    if (error) {
      toast({
        title: "Error fetching data",
        description: error.message,
        variant: "destructive"
      });
      return;
    }

    if (data && data[0]) {
      setAmount(data[0].credit_card_amount);
      setTransferAmount(data[0].transfer_amount);
      setIsTransferCompleted(data[0].is_transfer_completed);
    }
  };

  const handleSave = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const newAmount = parseCurrencyInput(editAmount);
    if (isNaN(newAmount)) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid number",
        variant: "destructive"
      });
      return;
    }

    // Get Credit Card category
    const { data: category } = await supabase
      .from('expenses_categories')
      .select('id')
      .eq('user_id', user.id)
      .eq('name', 'Credit Card')
      .single();

    if (!category) {
      toast({
        title: "Error",
        description: "Credit Card category not found",
        variant: "destructive"
      });
      return;
    }

    // Set the date to the first day of next month
    const billDate = new Date(selectedYear, selectedMonth + 1, 1);
    const { error } = await supabase
      .from('expenses')
      .upsert({
        user_id: user.id,
        category_id: category.id,
        amount: newAmount,
        date: billDate.toISOString().split('T')[0],
        description: `Credit Card Bill for ${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}`
      }, {
        onConflict: 'user_id,category_id,date'
      });

    if (error) {
      toast({
        title: "Error saving bill",
        description: error.message,
        variant: "destructive"
      });
      return;
    }

    setAmount(newAmount);
    setIsEditing(false);
    setEditAmount("");
    fetchData(); // Refresh data to update transfer amount
    toast({
      title: "Success",
      description: "Credit card bill saved successfully"
    });
  };

  const handleTransferStatusChange = async (completed: boolean) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('monthly_tasks')
      .upsert({
        user_id: user.id,
        year: selectedYear,
        month: selectedMonth,
        task_id: 'credit-card-transfer',
        is_completed: completed
      });

    if (error) {
      toast({
        title: "Error updating status",
        description: error.message,
        variant: "destructive"
      });
      return;
    }

    setIsTransferCompleted(completed);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Credit Card Bill</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span>Total:</span>
          {isEditing ? (
            <div className="flex gap-2">
              <Input
                type="text"
                value={editAmount}
                onChange={(e) => setEditAmount(e.target.value)}
                className="w-32"
                placeholder="Enter amount"
              />
              <Button size="sm" onClick={handleSave}>Save</Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setIsEditing(false);
                  setEditAmount("");
                }}
              >
                Cancel
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="font-semibold">{formatCurrency(amount)}</span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setIsEditing(true);
                  setEditAmount(amount.toString());
                }}
              >
                Edit
              </Button>
            </div>
          )}
        </div>

        {transferAmount > 0 && (
          <div className="space-y-4">
            <Alert variant="warning" className="bg-yellow-50 border-yellow-200">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800">
                Camila needs to transfer {formatCurrency(transferAmount)} to Lucas
              </AlertDescription>
            </Alert>
            <MonthlyTaskItem
              id="credit-card-transfer"
              name={`Transfer ${formatCurrency(transferAmount)} to Lucas`}
              completed={isTransferCompleted}
              onCompletedChange={handleTransferStatusChange}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
};
