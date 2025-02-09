
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, XCircle } from "lucide-react";
import { formatCurrency } from "@/utils/formatters";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useQueryClient } from "@tanstack/react-query";

interface TransferStatusProps {
  transferAmount: number;
  isTransferCompleted: boolean;
  selectedYear: number;
  selectedMonth: number;
  onStatusChange: (completed: boolean) => void;
}

export function TransferStatus({
  transferAmount,
  isTransferCompleted,
  selectedYear,
  selectedMonth,
  onStatusChange
}: TransferStatusProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleTransferStatusChange = async (checked: boolean) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const now = new Date();

      const { data: existingTask } = await supabase
        .from('monthly_tasks')
        .select('id')
        .eq('user_id', user.id)
        .eq('year', selectedYear)
        .eq('month', selectedMonth)
        .eq('task_id', 'credit-card-transfer')
        .maybeSingle();

      if (existingTask) {
        await supabase
          .from('monthly_tasks')
          .update({
            is_completed: checked,
            updated_at: now.toISOString()
          })
          .eq('id', existingTask.id);
      } else {
        await supabase
          .from('monthly_tasks')
          .insert({
            user_id: user.id,
            year: selectedYear,
            month: selectedMonth,
            task_id: 'credit-card-transfer',
            is_completed: checked,
            created_at: now.toISOString(),
            updated_at: now.toISOString()
          });
      }

      onStatusChange(checked);

      // Invalidate queries to update UI
      queryClient.invalidateQueries({ queryKey: ['fixedExpensesStatus'] });
      queryClient.invalidateQueries({ 
        queryKey: ['creditCardData', selectedYear, selectedMonth] 
      });

      toast({
        title: checked ? "Transfer marked as completed" : "Transfer marked as pending",
        description: checked 
          ? "The credit card transfer has been marked as completed" 
          : "The credit card transfer has been marked as pending",
      });

    } catch (error: any) {
      console.error('Error updating transfer status:', error);
      toast({
        title: "Error",
        description: "Failed to update transfer status",
        variant: "destructive",
      });
    }
  };

  if (transferAmount <= 0) return null;

  return isTransferCompleted ? (
    <Alert className="bg-green-50 border-green-200 text-green-800">
      <AlertDescription className="flex items-center justify-between">
        <span>Transfer of {formatCurrency(transferAmount)} already done</span>
        <Checkbox
          checked={isTransferCompleted}
          onCheckedChange={handleTransferStatusChange}
        />
      </AlertDescription>
    </Alert>
  ) : (
    <Alert variant="warning">
      <AlertDescription className="flex items-center justify-between">
        <span>Transfer needed: {formatCurrency(transferAmount)}</span>
        <Checkbox
          checked={isTransferCompleted}
          onCheckedChange={handleTransferStatusChange}
        />
      </AlertDescription>
    </Alert>
  );
}
