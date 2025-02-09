
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { CurrencyInput } from "@/components/shared/CurrencyInput";
import { CheckCircle2, XCircle } from "lucide-react";
import { useCreditCardData } from "@/hooks/useCreditCardData";
import { TransferStatus } from "./credit-card/TransferStatus";

interface CreditCardBillCardProps {
  selectedYear: number;
  selectedMonth: number;
}

export function CreditCardBillCard({ selectedYear, selectedMonth }: CreditCardBillCardProps) {
  const { toast } = useToast();
  const {
    amount,
    setAmount,
    transferAmount,
    isTransferCompleted,
    setIsTransferCompleted,
    fetchData
  } = useCreditCardData(selectedYear, selectedMonth);

  const handleSave = async () => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        toast({
          title: "Authentication Error",
          description: "Please try logging in again",
          variant: "destructive",
        });
        return;
      }

      if (!user) {
        toast({
          title: "Error",
          description: "User not authenticated",
          variant: "destructive",
        });
        return;
      }

      // Get Credit Card category
      const { data: category, error: categoryError } = await supabase
        .from('expenses_categories')
        .select('id')
        .eq('user_id', user.id)
        .eq('name', 'Credit Card')
        .maybeSingle();

      if (categoryError) {
        console.error('Error getting category:', categoryError);
        throw categoryError;
      }

      const formattedDate = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-01`;
      
      // First, delete any existing expense for this month
      const { error: deleteError } = await supabase
        .from('expenses')
        .delete()
        .eq('user_id', user.id)
        .eq('category_id', category.id)
        .eq('date', formattedDate);

      if (deleteError) {
        console.error('Error deleting existing expense:', deleteError);
        throw deleteError;
      }

      // Then insert the new expense
      const { error: insertError } = await supabase
        .from('expenses')
        .insert({
          user_id: user.id,
          category_id: category.id,
          amount: amount,
          date: formattedDate,
          description: `Credit Card Bill for ${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}`
        });

      if (insertError) {
        console.error('Error inserting new expense:', insertError);
        throw insertError;
      }

      toast({
        title: "Success",
        description: "Credit card bill amount saved successfully",
      });

      await fetchData();

    } catch (error: any) {
      console.error('Error in handleSave:', error);
      toast({
        title: "Error saving data",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Credit Card Bill</CardTitle>
        {isTransferCompleted ? (
          <CheckCircle2 className="h-4 w-4 text-green-500" />
        ) : (
          <XCircle className="h-4 w-4 text-red-500" />
        )}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold mb-4">
          <CurrencyInput
            value={amount}
            onChange={(value) => setAmount(value)}
          />
        </div>
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <Button onClick={handleSave} variant="outline" size="sm">
              Save
            </Button>
          </div>
          
          <TransferStatus
            transferAmount={transferAmount}
            isTransferCompleted={isTransferCompleted}
            selectedYear={selectedYear}
            selectedMonth={selectedMonth}
            onStatusChange={setIsTransferCompleted}
          />
        </div>
      </CardContent>
    </Card>
  );
}
