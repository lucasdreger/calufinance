import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { formatCurrency } from "@/utils/formatters";
import { MonthlyTaskItem } from "../tasks/MonthlyTaskItem";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

interface ExpenseAlertsProps {
  expenses: any[];
  selectedYear: number;
  selectedMonth: number;
  creditCardBill: number;
  fixedExpenses: { amount: number; owner: string }[];
}

export const ExpenseAlerts = ({ 
  expenses, 
  selectedYear,
  selectedMonth,
  creditCardBill,
  fixedExpenses 
}: ExpenseAlertsProps) => {
  const [isTransferCompleted, setIsTransferCompleted] = useState(false);
  const [lucasIncome, setLucasIncome] = useState<number | null>(null);
  const { toast } = useToast();

  // ✅ Fetch Lucas's income for the selected month and year
  useEffect(() => {
    const fetchLucasIncome = async () => {
      try {
        const { data: userData, error: userError } = await supabase.auth.getUser();
        const user = userData?.user;

        if (userError || !user) {
          toast({ title: "Error", description: "Please login to continue", variant: "destructive" });
          return;
        }

        // ✅ Fetch only Lucas's income for the current month & year
        const { data, error } = await supabase
          .from("monthly_income")
          .select("amount")
          .eq("user_id", user.id)
          .eq("year", selectedYear)
          .eq("month", selectedMonth)
          .eq("source", "lucas")
          .single(); // Ensures only one row is returned

        if (error && error.code !== "PGRST116") throw error; // Ignore "no rows found" error

        setLucasIncome(data?.amount ?? 0); // Default to 0 if no row exists
      } catch (error: any) {
        console.error("Error fetching Lucas's income:", error);
        toast({
          title: "Error fetching income",
          description: error.message || "Unknown error",
          variant: "destructive",
        });
        setLucasIncome(0); // Fallback in case of error
      }
    };

    fetchLucasIncome();
  }, [selectedYear, selectedMonth]);

  if (lucasIncome === null) return null; // Avoid rendering alerts until income is loaded

  // ✅ Calculate Lucas's total fixed expenses
  const lucasFixedExpensesTotal = fixedExpenses
    .filter(expense => expense.owner === "Lucas")
    .reduce((sum, expense) => sum + expense.amount, 0);

  // ✅ Calculate remaining amount after bills
  const remainingAmount = lucasIncome - creditCardBill - lucasFixedExpensesTotal;

  // ✅ Calculate transfer needed if remaining is less than 400
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
