import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { IncomeInputGroup } from "../shared/IncomeInputGroup";
import { useToast } from "@/components/ui/use-toast";

interface IncomeState {
  lucas: number;
  camila: number;
  other: number;
}

export const DefaultIncomeManagement = () => {
  const [income, setIncome] = useState<IncomeState>({
    lucas: 0,
    camila: 0,
    other: 0,
  });
  const { toast } = useToast();

  const fetchDefaultIncome = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        toast({
          title: "Error",
          description: "Please login to continue",
          variant: "destructive",
        });
        return;
      }

      const { data, error } = await supabase
        .from("income")
        .select("source, amount")
        .eq("user_id", user.id)
        .eq("is_default", true);

      if (error) throw error;
      console.log("Fetched income data:", data);

      const updatedIncome: IncomeState = {
        lucas: data.find((item) => item.source === "Primary Job")?.amount || 0,
        camila: data.find((item) => item.source === "Wife Job 1")?.amount || 0,
        other: data.find((item) => item.source === "Other")?.amount || 0,
      };

      setIncome({ ...updatedIncome }); // Força re-renderização
    } catch (error: any) {
      console.error("Error fetching default income:", error);
      toast({
        title: "Error fetching income",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleSave = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        toast({
          title: "Error",
          description: "Please login to continue",
          variant: "destructive",
        });
        return;
      }

      const updates = [
        { amount: income.lucas, source: "Primary Job", user_id: user.id, is_default: true },
        { amount: income.camila, source: "Wife Job 1", user_id: user.id, is_default: true },
        { amount: income.other, source: "Other", user_id: user.id, is_default: true }
      ];

      const { error } = await supabase
        .from("income")
        .upsert(updates, { onConflict: ["user_id", "source", "is_default"] });
      if (error) throw error;

      toast({ title: "Success", description: "Default income saved successfully" });
      setTimeout(fetchDefaultIncome, 500);
    } catch (error: any) {
      console.error("Error saving default income:", error);
      toast({
        title: "Error saving income",
        description: error.message,
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
        <IncomeInputGroup income={income} onIncomeChange={(field, value) => setIncome((prev) => ({ ...prev, [field]: value }))} />
        <Button onClick={handleSave} className="w-full">
          Save Default Income
        </Button>
      </CardContent>
    </Card>
  );
};
