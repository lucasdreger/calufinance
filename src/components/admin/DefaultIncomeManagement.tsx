import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { IncomeInputGroup } from "@/components/shared/IncomeInputGroup";
import { Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface IncomeState {
  lucas: number;
  camila: number;
  other: number;
}

export const DefaultIncomeManagement = () => {
  const [defaultIncome, setDefaultIncome] = useState<IncomeState>({ lucas: 0, camila: 0, other: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchDefaultIncome();
  }, []);

  const fetchDefaultIncome = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { data, error } = await supabase.from("income").select("*").eq("user_id", user.id).eq("is_default", true);
      if (error) throw error;

      if (!data || data.length === 0) {
        await createDefaultIncome(user.id);
      } else {
        setDefaultIncome({
          lucas: data.find((inc) => inc.source === "Primary Job")?.amount || 0,
          camila: data.find((inc) => inc.source === "Wife Job 1")?.amount || 0,
          other: data.find((inc) => inc.source === "Other")?.amount || 0,
        });
      }
    } catch (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const createDefaultIncome = async (userId: string) => {
    const defaultEntries = [
      { amount: 0, source: "Primary Job", user_id: userId, is_default: true, date: new Date().toISOString().split('T')[0] },
      { amount: 0, source: "Wife Job 1", user_id: userId, is_default: true, date: new Date().toISOString().split('T')[0] },
      { amount: 0, source: "Other", user_id: userId, is_default: true, date: new Date().toISOString().split('T')[0] },
    ];
    await supabase.from("income").insert(defaultEntries);
    fetchDefaultIncome();
  };

  const handleSaveDefaults = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const updates = Object.entries(defaultIncome).map(([key, value]) => ({
        amount: value,
        source: key === "lucas" ? "Primary Job" : key === "camila" ? "Wife Job 1" : "Other",
        user_id: user.id,
        is_default: true,
        date: new Date().toISOString().split('T')[0]
      }));

      const { error } = await supabase.from("income").upsert(updates, { onConflict: "user_id,source,is_default" });
      if (error) throw error;

      toast({ title: "Success", description: "Income saved successfully" });
      fetchDefaultIncome();
    } catch (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleIncomeChange = (field: keyof IncomeState, value: number) => {
    setDefaultIncome((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <CardTitle>Default Monthly Income</CardTitle>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Info className="h-4 w-4 text-gray-500" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Set your default monthly income values here. These will be used as templates for new months.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <IncomeInputGroup income={defaultIncome} onIncomeChange={handleIncomeChange} />
        <div className="flex justify-end">
          <Button onClick={handleSaveDefaults} disabled={isLoading}>
            {isLoading ? "Saving..." : "Save Defaults"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};