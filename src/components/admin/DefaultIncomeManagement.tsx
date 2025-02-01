import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { IncomeInputGroup } from "@/components/shared/IncomeInputGroup";

interface IncomeState {
  lucas: number;
  camila: number;
  other: number;
}

export const DefaultIncomeManagement = () => {
  const [defaultIncome, setDefaultIncome] = useState<IncomeState>({
    lucas: 0,
    camila: 0,
    other: 0,
  });
  const { toast } = useToast();

  const fetchDefaultIncome = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('income')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_default', true);

    if (error) {
      toast({
        title: "Error fetching default income",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    if (data && data.length > 0) {
      const lucasIncome = data.find(inc => inc.source === "Primary Job")?.amount || 0;
      const camilaIncome = data.find(inc => inc.source === "Wife Job 1")?.amount || 0;
      const otherIncome = data.find(inc => inc.source === "Other")?.amount || 0;

      setDefaultIncome({
        lucas: lucasIncome,
        camila: camilaIncome,
        other: otherIncome,
      });
    }
  };

  useEffect(() => {
    fetchDefaultIncome();

    const channel = supabase
      .channel('income_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'income' },
        () => {
          fetchDefaultIncome();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleSaveDefaults = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to save defaults",
        variant: "destructive",
      });
      return;
    }

    const date = new Date().toISOString().split('T')[0];
    const promises = [
      supabase.from('income').upsert({
        amount: defaultIncome.lucas,
        source: "Primary Job",
        date,
        user_id: user.id,
        is_default: true
      }, { onConflict: 'user_id,source,is_default' }),
      supabase.from('income').upsert({
        amount: defaultIncome.camila,
        source: "Wife Job 1",
        date,
        user_id: user.id,
        is_default: true
      }, { onConflict: 'user_id,source,is_default' }),
      supabase.from('income').upsert({
        amount: defaultIncome.other,
        source: "Other",
        date,
        user_id: user.id,
        is_default: true
      }, { onConflict: 'user_id,source,is_default' })
    ];

    try {
      const results = await Promise.all(promises);
      const errors = results.filter(result => result.error);
      
      if (errors.length > 0) {
        throw new Error(errors[0].error.message);
      }

      toast({
        title: "Default Income Saved",
        description: "Your default monthly income has been saved.",
      });
    } catch (error: any) {
      toast({
        title: "Error saving defaults",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleIncomeChange = (field: keyof IncomeState, value: number) => {
    setDefaultIncome(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Default Monthly Income</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <IncomeInputGroup
          income={defaultIncome}
          onIncomeChange={handleIncomeChange}
        />
        <div className="flex justify-end">
          <Button onClick={handleSaveDefaults}>Save Defaults</Button>
        </div>
      </CardContent>
    </Card>
  );
};