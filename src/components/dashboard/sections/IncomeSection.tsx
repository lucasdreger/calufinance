import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { formatCurrency } from "@/utils/formatters";
import { supabase } from "@/integrations/supabase/client";
import { IncomeInputGroup } from "@/components/shared/IncomeInputGroup";

interface IncomeState {
  lucas: number;
  camila: number;
  other: number;
}

export const IncomeSection = () => {
  const [income, setIncome] = useState<IncomeState>({ lucas: 0, camila: 0, other: 0 });
  const { toast } = useToast();

  const totalIncome = income.lucas + income.camila + income.other;

  const handleLoadDefaults = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to load defaults",
        variant: "destructive",
      });
      return;
    }

    const { data, error } = await supabase
      .from('income')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_default', true);

    if (error) {
      toast({
        title: "Error loading defaults",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    if (data && data.length > 0) {
      const lucasIncome = data.find(inc => inc.source === "Primary Job")?.amount || 0;
      const camilaIncome = data.find(inc => inc.source === "Wife Job 1")?.amount || 0;
      const otherIncome = data.find(inc => inc.source === "Other")?.amount || 0;

      const date = new Date().toISOString().split('T')[0];
      const promises = [
        supabase.from('income').upsert({
          amount: lucasIncome,
          source: "Primary Job",
          date,
          user_id: user.id,
          is_default: false
        }, { onConflict: 'user_id,source,is_default' }),
        supabase.from('income').upsert({
          amount: camilaIncome,
          source: "Wife Job 1",
          date,
          user_id: user.id,
          is_default: false
        }, { onConflict: 'user_id,source,is_default' }),
        supabase.from('income').upsert({
          amount: otherIncome,
          source: "Other",
          date,
          user_id: user.id,
          is_default: false
        }, { onConflict: 'user_id,source,is_default' })
      ];

      try {
        await Promise.all(promises);
        setIncome({
          lucas: lucasIncome,
          camila: camilaIncome,
          other: otherIncome
        });
        toast({
          title: "Income Defaults Loaded",
          description: "Your default monthly income has been loaded.",
        });
      } catch (error: any) {
        toast({
          title: "Error saving income",
          description: error.message,
          variant: "destructive",
        });
      }
    } else {
      toast({
        title: "No defaults found",
        description: "Please set up default values in the Administration page first.",
      });
    }
  };

  const handleIncomeChange = (field: keyof IncomeState, value: number) => {
    setIncome(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Monthly Income</CardTitle>
        <Button onClick={handleLoadDefaults}>Load Defaults</Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <IncomeInputGroup
          income={income}
          onIncomeChange={handleIncomeChange}
        />
        <div className="text-right">
          <span className="text-lg font-bold">
            Total Income: {formatCurrency(totalIncome)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
};