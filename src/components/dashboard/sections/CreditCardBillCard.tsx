import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/utils/formatters";
import { MonthlyTaskItem } from "../tasks/MonthlyTaskItem";
import { CreditCardData } from "@/types/supabase";

interface CreditCardBillProps {
  selectedYear: number;
  selectedMonth: number;
}

export const CreditCardBillCard = ({ selectedYear, selectedMonth }: CreditCardBillProps) => {
  const [amount, setAmount] = useState<number>(0);
  const [isTransferCompleted, setIsTransferCompleted] = useState(false);
  const [transferAmount, setTransferAmount] = useState<number>(0);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, [selectedYear, selectedMonth]);

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .rpc<CreditCardData>('get_credit_card_data', {
        p_user_id: user.id,
        p_year: selectedYear,
        p_month: selectedMonth
      })
      .single();

    if (error) {
      toast({
        title: "Error fetching data",
        description: error.message,
        variant: "destructive"
      });
      return;
    }

    setAmount(data.credit_card_amount);
    setTransferAmount(data.transfer_amount);
    setIsTransferCompleted(data.is_transfer_completed);
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
          <span className="font-semibold">{formatCurrency(amount)}</span>
        </div>

        {transferAmount > 0 && !isTransferCompleted && (
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