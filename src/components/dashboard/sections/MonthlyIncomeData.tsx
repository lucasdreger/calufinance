import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { IncomeInputGroup } from "@/components/shared/IncomeInputGroup";
import { useToast } from "@/components/ui/use-toast";

interface MonthlyIncomeDataProps {
  selectedYear: number;
  selectedMonth: number;
}

interface IncomeState {
  lucas: number;
  camila: number;
  other: number;
}

export const MonthlyIncomeData = ({ selectedYear, selectedMonth }: MonthlyIncomeDataProps) => {
  const [income, setIncome] = useState<IncomeState>({
    lucas: 0,
    camila: 0,
    other: 0,
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchMonthlyIncome = async () => {
    setLoading(true);
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      const user = userData?.user;

      if (userError || !user) {
        toast({
          title: "Error",
          description: "Please login to continue",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("monthly_income")
        .select("source, amount")
        .eq("user_id", user.id)
        .eq("year", selectedYear)
        .eq("month", selectedMonth);

      if (error) throw error;

      const updatedIncome: IncomeState = {
        lucas: data?.find((item) => item.source === "Primary Job")?.amount ?? 0,
        camila: data?.find((item) => item.source === "Wife Job 1")?.amount ?? 0,
        other: data?.find((item) => item.source === "Other")?.amount ?? 0,
      };

      setIncome(updatedIncome);
    } catch (error: any) {
      console.error("Error fetching monthly income:", error);
      toast({
        title: "Error fetching income",
        description: error.message || "Unknown error",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      const user = userData?.user;

      if (userError || !user) {
        toast({
          title: "Error",
          description: "Please login to continue",
          variant: "destructive",
        });
        return;
      }

      // Delete existing entries for this month
      const { error: deleteError } = await supabase
        .from("monthly_income")
        .delete()
        .eq("user_id", user.id)
        .eq("year", selectedYear)
        .eq("month", selectedMonth);

      if (deleteError) throw deleteError;

      // Insert new entries WITHOUT specifying `month`, allowing the database default to handle it
      const updates = [
        { amount: income.lucas, source: "Primary Job", user_id: user.id, year: selectedYear },
        { amount: income.camila, source: "Wife Job 1", user_id: user.id, year: selectedYear },
        { amount: income.other, source: "Other", user_id: user.id, year: selectedYear },
      ];

      const { error: insertError } = await supabase.from("monthly_income").insert(updates);

      if (insertError) throw insertError;

      toast({ title: "Success", description: "Monthly income saved successfully" });
    } catch (error: any) {
      console.error("Error saving monthly income:", error);
      toast({
        title: "Error saving income",
        description: error.message || "Unknown error",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchMonthlyIncome();
  }, [selectedYear, selectedMonth]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Monthly Income</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <p>Loading...</p>
        ) : (
          <>
            <IncomeInputGroup
              income={income}
              onIncomeChange={(field, value) => setIncome((prev) => ({ ...prev, [field]: value }))}
            />
            <div className="flex gap-4">
              <Button onClick={handleSave} className="flex-1">
                Save
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
