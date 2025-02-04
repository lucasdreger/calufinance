import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/utils/formatters";

interface CreditCardBillProps {
  selectedYear: number;
  selectedMonth: number;
}

export const CreditCardBillCard = ({ selectedYear, selectedMonth }: CreditCardBillProps) => {
  const [amount, setAmount] = useState<number>(0);
  const [lucasIncome, setLucasIncome] = useState<number>(0);
  const [showTransferAlert, setShowTransferAlert] = useState(false);
  const [transferAmount, setTransferAmount] = useState<number>(0);
  const { toast } = useToast();

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Get Credit Card category
    const { data: categories } = await supabase
      .from('expenses_categories')
      .select('id')
      .eq('name', 'Credit Card')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!categories) return;

    // Get the date range for the selected month
    const startDate = new Date(selectedYear, selectedMonth, 1);
    const endDate = new Date(selectedYear, selectedMonth + 1, 0);

    // Fetch Credit Card bill
    const { data: creditCardExpense } = await supabase
      .from('expenses')
      .select('amount')
      .eq('category_id', categories.id)
      .eq('user_id', user.id)
      .gte('date', startDate.toISOString())
      .lte('date', endDate.toISOString())
      .maybeSingle();

    // Fetch Lucas's income
    const { data: income } = await supabase
      .from('income')
      .select('amount')
      .eq('source', 'Primary Job')
      .eq('user_id', user.id)
      .gte('date', startDate.toISOString())
      .lte('date', endDate.toISOString())
      .maybeSingle();

    if (creditCardExpense) {
      setAmount(creditCardExpense.amount);
    }

    if (income) {
      setLucasIncome(income.amount);
      const remaining = income.amount - (creditCardExpense?.amount || 0);
      const transfer = remaining < 1000 ? Math.max(0, 1000 - remaining) : 0;
      setTransferAmount(transfer);
      setShowTransferAlert(transfer > 0);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedYear, selectedMonth]);

  const handleSave = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: categories } = await supabase
      .from('expenses_categories')
      .select('id')
      .eq('name', 'Credit Card')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!categories) return;

    const date = new Date(selectedYear, selectedMonth, 1).toISOString().split('T')[0];

    const { error } = await supabase
      .from('expenses')
      .upsert({
        amount,
        description: 'Monthly Credit Card Bill',
        date,
        category_id: categories.id,
        user_id: user.id,
        is_fixed: true
      }, {
        onConflict: 'user_id,category_id,date'
      });

    if (error) {
      toast({
        title: "Error saving credit card bill",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Credit card bill saved",
      description: "The credit card bill has been updated successfully.",
    });

    fetchData();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Credit Card Bill
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-4">
          <Input
            type="number"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            placeholder="Enter bill amount"
          />
          <Button onClick={handleSave}>Save</Button>
        </div>

        {amount === 0 && (
          <Alert variant="warning" className="bg-yellow-50 border-yellow-200">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              The Credit Card bill amount is set to 0. Please update it if you have received the bill.
            </AlertDescription>
          </Alert>
        )}

        {showTransferAlert && (
          <Alert variant="warning" className="bg-yellow-50 border-yellow-200">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              Camila needs to transfer {formatCurrency(transferAmount)} for this month's Credit Card bill
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};