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
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData?.session?.user;
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
        .select("source, amount")
        .eq("user_id", user.id)
        .eq("is_default", true);

      if (error) throw error;
      setDefaultIncome(data || []);

      setIncome({
        lucas: data.find((item: any) => item.source === "Primary Job")?.amount || 0,
        camila: data.find((item: any) => item.source === "Wife Job 1")?.amount || 0,
        other: data.find((item: any) => item.source === "Other")?.amount || 0,
      });
    } catch (error: any) {
      console.error('Error fetching default income:', error);
      toast({
        title: "Error fetching income",
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
        <Button onClick={fetchDefaultIncome} className="w-full">
          Refresh Income Data
        </Button>
      </CardContent>
    </Card>
  );
};