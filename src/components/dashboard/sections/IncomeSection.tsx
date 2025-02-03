import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { IncomeInputGroup } from "@/components/shared/IncomeInputGroup";
import { useToast } from "@/hooks/use-toast";

interface IncomeState {
  lucas: number;
  camila: number;
  other: number;
}

export const IncomeSection = () => {
  const [income, setIncome] = useState<IncomeState>({
    lucas: 0,
    camila: 0,
    other: 0,
  });
  const { toast } = useToast();

  const fetchIncomeOnLoad = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const currentDate = new Date().toISOString().split("T")[0];

      const { data, error } = await supabase
        .from("income")
        .select("*")
        .eq("user_id", user.id)
        .eq("date", currentDate)
        .eq("is_default", false);

      if (error) throw error;

      console.log("🔄 Income loaded from database:", data);

      if (data && data.length > 0) {
        setIncome({
          lucas: data.find((inc) => inc.source === "Primary Job")?.amount || 0,
          camila: data.find((inc) => inc.source === "Wife Job 1")?.amount || 0,
          other: data.find((inc) => inc.source === "Other")?.amount || 0,
        });
      }
    } catch (error: any) {
      console.error("❌ Error fetching income:", error);
    }
  };

  useEffect(() => {
    fetchIncomeOnLoad();
  }, []);

  const handleLoadDefaults = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in to load defaults",
          variant: "destructive",
        });
        return;
      }

      // Fetch default income values
      const { data: defaultIncome, error } = await supabase
        .from("income")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_default", true);

      if (error) throw error;

      if (defaultIncome && defaultIncome.length > 0) {
        const currentDate = new Date().toISOString().split("T")[0];

        const newIncome = {
          lucas: defaultIncome.find((inc) => inc.source === "Primary Job")?.amount || 0,
          camila: defaultIncome.find((inc) => inc.source === "Wife Job 1")?.amount || 0,
          other: defaultIncome.find((inc) => inc.source === "Other")?.amount || 0,
        };

        console.log("🚀 New default income values:", newIncome);

        // First, delete existing non-default records for this date
        const { error: deleteError } = await supabase
          .from("income")
          .delete()
          .eq("user_id", user.id)
          .eq("date", currentDate)
          .eq("is_default", false);

        if (deleteError) throw deleteError;

        // Then insert new records
        const sources = [
          { amount: newIncome.lucas, source: "Primary Job" },
          { amount: newIncome.camila, source: "Wife Job 1" },
          { amount: newIncome.other, source: "Other" },
        ];

        for (const entry of sources) {
          const { error: insertError } = await supabase
            .from("income")
            .insert({
              amount: entry.amount,
              source: entry.source,
              date: currentDate,
              user_id: user.id,
              is_default: false,
            });

          if (insertError) throw insertError;
        }

        setIncome(newIncome);
        console.log("🎯 Updated income state:", newIncome);

        toast({
          title: "Income Defaults Loaded",
          description: "Your default monthly income has been loaded successfully.",
        });
      } else {
        toast({
          title: "No defaults found",
          description: "Please set up default values in the Administration page first.",
        });
      }
    } catch (error: any) {
      console.error("❌ Error loading defaults:", error);
      toast({
        title: "Error loading defaults",
        description: error.message || "An unknown error occurred",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Monthly Income</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <IncomeInputGroup
          income={income}
          onIncomeChange={(field, value) => setIncome((prev) => ({ ...prev, [field]: value }))}
        />
        <Button onClick={handleLoadDefaults} className="w-full">
          Load Default Values
        </Button>
      </CardContent>
    </Card>
  );
};