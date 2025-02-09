
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { IncomeInputGroup } from "../shared/IncomeInputGroup";
import { useToast } from "@/components/ui/use-toast";
import { IncomeSource, IncomeState } from "@/types/income";

export const DefaultIncomeManagement = () => {
  const [income, setIncome] = useState<IncomeState>({
    lucas: 0,
    camila: 0,
    other: 0,
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchDefaultIncome = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("income")
        .select("source, amount")
        .eq("is_default", true);

      if (error) throw error;
      console.log("Fetched default income data:", data);

      if (!Array.isArray(data)) {
        console.error("Invalid data format:", data);
        setLoading(false);
        return;
      }

      const updatedIncome: IncomeState = {
        lucas: data?.find((item) => item.source === IncomeSource.LUCAS)?.amount ?? 0,
        camila: data?.find((item) => item.source === IncomeSource.CAMILA)?.amount ?? 0,
        other: data?.find((item) => item.source === IncomeSource.OTHER)?.amount ?? 0,
      };

      setIncome(updatedIncome);
    } catch (error: any) {
      console.error("Error fetching default income:", error);
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
      // First, delete existing default income entries
      const { error: deleteError } = await supabase
        .from("income")
        .delete()
        .eq("is_default", true);

      if (deleteError) throw deleteError;

      // Get first day of current month for default values
      const currentDate = new Date();
      currentDate.setDate(1);
      const defaultDate = currentDate.toISOString().split('T')[0];

      // Insert new default entries
      const updates = [
        { amount: income.lucas, source: IncomeSource.LUCAS, is_default: true, date: defaultDate },
        { amount: income.camila, source: IncomeSource.CAMILA, is_default: true, date: defaultDate },
        { amount: income.other, source: IncomeSource.OTHER, is_default: true, date: defaultDate },
      ];

      const { error: insertError } = await supabase.from("income").insert(updates);
      if (insertError) throw insertError;

      toast({ title: "Success", description: "Default income saved successfully" });
    } catch (error: any) {
      console.error("Error saving default income:", error);
      toast({
        title: "Error saving income",
        description: error.message || "Unknown error",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchDefaultIncome();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Default Income Management</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <p>Loading...</p>
        ) : (
          <IncomeInputGroup
            income={income}
            onIncomeChange={(field, value) => setIncome((prev) => ({ ...prev, [field]: value }))}
          />
        )}
        <Button onClick={handleSave} className="w-full">
          Save Default Income
        </Button>
      </CardContent>
    </Card>
  );
};
