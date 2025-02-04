import { useState, useEffect } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { formatCurrency } from "@/utils/formatters";
import { MonthlyTaskItem } from "../tasks/MonthlyTaskItem";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Edit2, Save } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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

        const { data: lucasIncome } = await supabase
          .from('income')
          .select('amount')
          .eq('source', 'lucas')
          .eq('user_id', user.id)
          .gte('date', startOfMonth)
          .lte('date', endOfMonth)
          .order('date', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error && error.code !== 'PGRST116') {
          throw error;
        }

        setLucasIncome(lucasIncome?.amount ?? 0);
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
  }, [selectedYear, selectedMonth, toast]);

  if (lucasIncome === null) return null;

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

interface InvestmentCardProps {
  investment: {
    id: string;           // Unique identifier
    type: string;         // Investment type/category
    current_value: number; // Current investment value
    last_updated: string;  // Last update timestamp
  };
  isEditing: boolean;     // Edit mode flag
  editValue: string;      // Current edit value
  onEdit: () => void;     // Edit mode handler
  onSave: () => void;     // Save handler
  onEditValueChange: (value: string) => void; // Value change handler
}

export const InvestmentCard = ({
  investment,
  isEditing,
  editValue,
  onEdit,
  onSave,
  onEditValueChange,
}: InvestmentCardProps) => {
  return (
    <div className="bg-white rounded-lg p-4 shadow">
      {/* Investment type header */}
      <div className="text-sm font-medium text-gray-700 mb-2">
        {investment.type}
      </div>
      
      {/* Value display/edit section */}
      <div className="flex items-center justify-between gap-2">
        {isEditing ? (
          // Edit mode UI
          <>
            <Input
              type="number"
              value={editValue}
              onChange={(e) => onEditValueChange(e.target.value)}
              className="w-24 text-right"
            />
            <Button size="sm" onClick={onSave}>
              <Save className="h-4 w-4" />
            </Button>
          </>
        ) : (
          // Display mode UI
          <>
            <span className="text-lg font-semibold">
              {formatCurrency(investment.current_value)}
            </span>
            <Button size="sm" variant="ghost" onClick={onEdit}>
              <Edit2 className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>
      
      {/* Last updated timestamp */}
      <div className="text-xs text-gray-500 mt-2">
        Last updated: {new Date(investment.last_updated).toLocaleDateString()}
      </div>
    </div>
  );
};
