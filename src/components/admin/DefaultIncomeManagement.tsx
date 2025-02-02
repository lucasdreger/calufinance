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
  const [defaultIncome, setDefaultIncome] = useState<any[]>([]);
  const { toast } = useToast();
  const [income, setIncome] = useState<IncomeState>({
    lucas: 0,
    camila: 0,
    other: 0,
  });

  const fetchDefaultIncome = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Error",
          description: "Please login to continue",
          variant: "destructive",
        });
        return;
      }

      const { data, error } = await supabase
        .from("income")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_default", true);

      if (error) throw error;
      setDefaultIncome(data || []);

      const newIncome = { lucas: 0, camila: 0, other: 0 };
      data?.forEach((item: any) => {
        if (item.source === "Primary Job") newIncome.lucas = item.amount;
        if (item.source === "Wife Job 1") newIncome.camila = item.amount;
        if (item.source === "Other") newIncome.other = item.amount;
      });
      setIncome(newIncome);
    } catch (error: any) {
      toast({
        title: "Error fetching income",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleIncomeChange = (field: keyof IncomeState, value: number) => {
    setIncome((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Error",
          description: "Please login to continue",
          variant: "destructive",
        });
        return;
      }

      const updates = Object.entries(income).map(([key, value]) => ({
        amount: value,
        source: key === "lucas" ? "Primary Job" : key === "camila" ? "Wife Job 1" : "Other",
        user_id: user.id,
        is_default: true,
        date: new Date().toISOString().split('T')[0],
      }));

      for (const update of updates) {
        const { error } = await supabase
          .from("income")
          .upsert([update], { onConflict: ["user_id", "source", "is_default"] });
        if (error) throw error;
      }

      toast({ title: "Success", description: "Income saved successfully" });
      await fetchDefaultIncome();
    } catch (error: any) {
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
        <IncomeInputGroup income={income} onIncomeChange={handleIncomeChange} />
        <Button onClick={handleSave} className="w-full">
          Save Default Income
        </Button>
      </CardContent>
    </Card>
  );
};
