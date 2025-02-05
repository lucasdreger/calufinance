import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { IncomeInputGroup } from "@/components/shared/IncomeInputGroup";
import { useToast } from "@/components/ui/use-toast";
import { IncomeSource, IncomeState } from "@/types/income";
import { CurrencyInput } from "@/components/ui/currency-input";

interface MonthlyIncomeDataProps {
  selectedYear: number;
  selectedMonth: number;
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
        lucas: data?.find((item) => item.source === IncomeSource.LUCAS)?.amount ?? 0,
        camila: data?.find((item) => item.source === IncomeSource.CAMILA)?.amount ?? 0,
        other: data?.find((item) => item.source === IncomeSource.OTHER)?.amount ?? 0,
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

  const loadDefaults = async () => {
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

      const { data: defaultIncome, error } = await supabase
        .from("income")
        .select("source, amount")
        .eq("user_id", user.id)
        .eq("is_default", true);

      if (error) throw error;

      // First, delete existing monthly income entries for this month
      const { error: deleteError } = await supabase
        .from("monthly_income")
        .delete()
        .eq("user_id", user.id)
        .eq("year", selectedYear)
        .eq("month", selectedMonth);

      if (deleteError) throw deleteError;

      // Ensure defaultIncome is an array and map values
      const updates = (defaultIncome || []).map((item) => ({
        year: selectedYear,
        month: selectedMonth,
        source: item.source as IncomeSource,
        amount: parseFloat(item.amount) || 0,
        user_id: user.id,
      }));

      if (updates.length > 0) {
        const { error: insertError } = await supabase
          .from("monthly_income")
          .insert(updates);
        
        if (insertError) throw insertError;
      }

      await fetchMonthlyIncome();
      toast({ title: "Success", description: "Default values loaded successfully" });
    } catch (error: any) {
      console.error("Error loading defaults:", error);
      toast({
        title: "Error loading defaults",
        description: error.message || "Unknown error",
        variant: "destructive",
      });
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

      // Insert new entries
      const updates = [
        { amount: income.lucas, source: IncomeSource.LUCAS, user_id: user.id, year: selectedYear, month: selectedMonth },
        { amount: income.camila, source: IncomeSource.CAMILA, user_id: user.id, year: selectedYear, month: selectedMonth },
        { amount: income.other, source: IncomeSource.OTHER, user_id: user.id, year: selectedYear, month: selectedMonth },
      ];

      const { error: insertError } = await supabase
        .from("monthly_income")
        .insert(updates);

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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label htmlFor="lucas-income" className="font-medium">
                  Lucas's Income
                </label>
                <CurrencyInput
                  value={income.lucas}
                  onChange={(value) => setIncome(prev => ({ ...prev, lucas: value }))}
                  className="w-full"
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="camila-income" className="font-medium">
                  Camila's Income
                </label>
                <CurrencyInput
                  value={income.camila}
                  onChange={(value) => setIncome(prev => ({ ...prev, camila: value }))}
                  className="w-full"
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="other-income" className="font-medium">
                  Other Income
                </label>
                <CurrencyInput
                  value={income.other}
                  onChange={(value) => setIncome(prev => ({ ...prev, other: value }))}
                  className="w-full"
                  placeholder="0.00"
                />
              </div>
            </div>
            <div className="flex gap-4">
              <Button onClick={loadDefaults} variant="outline" className="flex-1">
                Load Defaults
              </Button>
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