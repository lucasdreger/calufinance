import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { IncomeInputGroup } from "../shared/IncomeInputGroup";
import { useToast } from "@/components/ui/use-toast";

// Interface for managing income state
interface IncomeState {
  lucas: number;
  camila: number;
  other: number;
}

export const DefaultIncomeManagement = () => {
  // State to manage default income values
  const [income, setIncome] = useState<IncomeState>({
    lucas: 0,
    camila: 0,
    other: 0,
  });
  const { toast } = useToast();

  // Fetch existing default income values from the backend
  const fetchDefaultIncome = async () => {
    try {
      // Get current user
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
        .select("*")
        .eq("user_id", user.id)
        .eq("is_default", true);

      if (error) {
        console.error('Error fetching default income:', error);
        throw error;
      }

      // Map backend data to state
      if (data && data.length > 0) {
        data.forEach((item: any) => {
          if (item.source === "Primary Job") newIncome.lucas = Number(item.amount);
          if (item.source === "Wife Job 1") newIncome.camila = Number(item.amount);
          if (item.source === "Other") newIncome.other = Number(item.amount);
        });
        console.log('Setting income state to:', newIncome);
        setIncome(newIncome);
      }
    } catch (error: any) {
      console.error('Error in fetchDefaultIncome:', error);
      toast({
        title: "Error fetching income",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Handle income field changes
  const handleIncomeChange = (field: keyof IncomeState, value: number) => {
    setIncome((prev) => ({ ...prev, [field]: value }));
  };

  // Save default income values to the backend
  const handleSave = async () => {
    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        toast({
          title: "Error",
          description: "Please login to continue",
          variant: "destructive",
        });
        return;
      }

      const currentDate = new Date().toISOString().split('T')[0];
      
      // Prepare data for upsert operation
      const updates = [
        {
          amount: income.lucas,
          source: "Primary Job",
          user_id: user.id,
          is_default: true,
          date: currentDate,
        },
        {
          amount: income.camila,
          source: "Wife Job 1",
          user_id: user.id,
          is_default: true,
          date: currentDate,
        },
        {
          amount: income.other,
          source: "Other",
          user_id: user.id,
          is_default: true,
          date: currentDate,
        }
      ];

      // Delete existing default income entries for this user
      const { error: deleteError } = await supabase
        .from("income")
        .delete()
        .eq("user_id", user.id)
        .eq("is_default", true);

      if (deleteError) throw deleteError;

      // Insert new default income entries
      const { error: insertError } = await supabase
        .from("income")
        .insert(updates);

      if (insertError) throw insertError;

      toast({
        title: "Success",
        description: "Default income saved successfully"
      });
      
      // Reload data after saving
      await fetchDefaultIncome();
    } catch (error: any) {
      console.error('Error saving default income:', error);
      toast({
        title: "Error saving income",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Fetch data when component mounts
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