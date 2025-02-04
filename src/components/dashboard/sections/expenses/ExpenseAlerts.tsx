import { useState, useEffect } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { formatCurrency } from "@/utils/formatters";
import { MonthlyTaskItem } from "../tasks/MonthlyTaskItem";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ExpenseAlertsProps {
  expenses: any[];
  creditCardBill: number;
  fixedExpenses: {
    amount: number;
    owner: string;
  }[];
  selectedYear: number;
  selectedMonth: number;
}

export const ExpenseAlerts = ({ 
  expenses, 
  creditCardBill,
  fixedExpenses,
  selectedYear,
  selectedMonth
}: ExpenseAlertsProps) => {
  const [isTransferCompleted, setIsTransferCompleted] = useState(false);
  const [lucasIncome, setLucasIncome] = useState<number | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchLucasIncome = async () => {
      try {
        const { data: userData, error: userError } = await supabase.auth.getUser();
        const user = userData?.user;

        if (userError || !user) {
          toast({ title: "Error", description: "Please login to continue", variant: "destructive" });
          return;
        }

        // ✅ Fetch Lucas's income for the selected month and year
        const { data, error } = await supabase
          .from("monthly_income")
          .select("amount")
          .eq("user_id", user.id)
          .eq("year", selectedYear)
          .eq("month", selectedMonth)
          .eq("source", "lucas");

        if (error) throw error;

        // ✅ Handle missing data gracefully
        setLucasIncome(data?.length > 0 ? data[0].amount : 0);
      } catch (error: any) {
        console.error("Error fetching Lucas's income:", error);
        toast({
          title: "Error fetching income",
          description: error.message || "Unknown error",
          variant: "destructive",
        });
        setLucasIncome(0);
      }
    };

    fetchLucasIncome();
  }, [selectedYear, selectedMonth]);

  if (lucasIncome === null) return null; // Prevents rendering before data loads

  const lucasFixedExpensesTotal = fixedExpenses
    .filter(expense => expense.owner === "Lucas")
    .reduce((sum, expense) => sum + expense.amount, 0);

  const remainingAmount = lucasIncome - creditCardBill - lucasFixedExpensesTotal;

  const transferNeeded = remainingAmount < 400 ? 400 - remainingAmount : 0;

  return (
    <>
      {transferNeeded > 0 && (
        <div className="space-y-4">
          <Alert variant="warning" className="bg-yellow-50 border-yellow-200">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              Camila to transfer {formatCurrency(transferNeeded)} to Lucas
            </AlertDescription>
          </Alert>
          <MonthlyTaskItem
            id="transfer-task"
            name={`Transfer ${formatCurrency(transferNeeded)} to Lucas`}
            completed={isTransferCompleted}
            onCompletedChange={setIsTransferCompleted}
          />
        </div>
      )}
    </>
  );
};
