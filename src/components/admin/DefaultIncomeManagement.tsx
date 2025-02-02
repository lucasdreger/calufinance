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
  // State to store income values
  const [income, setIncome] = useState<IncomeState>({
    lucas: 0,
    camila: 0,
    other: 0,
  });
  const { toast } = useToast();

  // Fetch existing default income values from the database
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

      // Query the database for default income entries
      const { data, error } = await supabase
        .from("income")
        .select("source, amount")
        .eq("user_id", user.id)
        .eq("is_default", true);

      if (error) throw error;

      // Map backend data to state
      if (data && data.length > 0) {
        const newIncome = { lucas: 0, camila: 0, other: 0 };
        data.forEach((item: any) => {
          if (item.source === "Primary Job") newIncome.lucas = Number(item.amount);
          if (item.source === "Wife Job 1") newIncome.camila = Number(item.amount);
          if (item.source === "Other") newIncome.other = Number(item.amount);
        });
        console.log('Setting income state to:', newIncome);
        setIncome(newIncome);
      }
    } catch (error: any) {
      console.error("Error fetching default income:", error);
      toast({
        title: "Error fetching income",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Save income values to the database
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

      // Create current date string in YYYY-MM-DD format
      const currentDate = new Date().toISOString().split('T')[0];

      // Delete existing default income entries for this user
      const { error: deleteError } = await supabase
        .from("income")
        .delete()
        .eq("user_id", user.id)
        .eq("is_default", true);

      if (deleteError) throw deleteError;

      // Prepare updates with the date field
      const updates = [
        {
          amount: income.lucas,
          source: "Primary Job",
          user_id: user.id,
          is_default: true,
          date: currentDate
        },
        {
          amount: income.camila,
          source: "Wife Job 1",
          user_id: user.id,
          is_default: true,
          date: currentDate
        },
        {
          amount: income.other,
          source: "Other",
          user_id: user.id,
          is_default: true,
          date: currentDate
        }
      ];

      // Insert new default income entries
      const { error: insertError } = await supabase
        .from("income")
        .insert(updates);

      if (insertError) throw insertError;

      toast({
        title: "Success",
        description: "Default income saved successfully"
      });

      // Refresh the data
      await fetchDefaultIncome();
    } catch (error: any) {
      console.error("Error saving default income:", error);
      toast({
        title: "Error saving income",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Fetch default income values when component mounts
  useEffect(() => {
    fetchDefaultIncome();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Default Income Management</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <IncomeInputGroup
          income={income}
          onIncomeChange={(field, value) => setIncome((prev) => ({ ...prev, [field]: value }))}
        />
        <Button onClick={handleSave} className="w-full">
          Save Default Income
        </Button>
      </CardContent>
    </Card>
  );
};