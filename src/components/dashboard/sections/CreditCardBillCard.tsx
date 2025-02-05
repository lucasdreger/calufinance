import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/utils/formatters";
import { calculateCreditCardTransfer } from "@/utils/creditCardCalculations";
import { MonthlyTaskItem } from "@/components/MonthlyTaskItem";

interface CreditCardBillProps {
  selectedYear: number;
  selectedMonth: number;
}

export const CreditCardBillCard = ({ selectedYear, selectedMonth }: CreditCardBillProps) => {
  const [amount, setAmount] = useState<number>(0);
  const [isTransferCompleted, setIsTransferCompleted] = useState(false);
  const [transferData, setTransferData] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, [selectedYear, selectedMonth]);

  const fetchData = async () => {
    const data = await calculateCreditCardTransfer(selectedYear, selectedMonth);
    setTransferData(data);
    setAmount(data?.creditCardTotal || 0);
  };

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
        <CardTitle>Credit Card Bill</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span>Total:</span>
          <span className="font-semibold">{formatCurrency(amount)}</span>
        </div>

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

        {transferData?.transferAmount > 0 && (
          <>
            <Alert variant="warning" className="bg-yellow-50 border-yellow-200">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800">
                Camila to transfer {formatCurrency(transferData.transferAmount)} to Lucas
              </AlertDescription>
            </Alert>
            <MonthlyTaskItem
              id="credit-card-transfer"
              name={`Transfer ${formatCurrency(transferData.transferAmount)} to Lucas`}
              completed={isTransferCompleted}
              onCompletedChange={setIsTransferCompleted}
            />
          </>
        )}
      </CardContent>
    </Card>
  );
};