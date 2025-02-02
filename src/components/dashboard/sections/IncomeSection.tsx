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

  // Fetch current month's income on mount
  useEffect(() => {
    const fetchCurrentIncome = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const currentDate = new Date();
        const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString().split('T')[0];
        const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).toISOString().split('T')[0];

        const { data, error } = await supabase
          .from('income')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_default', false)
          .gte('date', startOfMonth)
          .lte('date', endOfMonth);

        if (error) throw error;

        const newIncome = { lucas: 0, camila: 0, other: 0 };
        data?.forEach((item: any) => {
          if (item.source === "Primary Job") newIncome.lucas = item.amount;
          if (item.source === "Wife Job 1") newIncome.camila = item.amount;
          if (item.source === "Other") newIncome.other = item.amount;
        });
        setIncome(newIncome);
      } catch (error: any) {
        console.error('Error fetching income:', error);
        toast({
          title: "Error fetching income",
          description: error.message,
          variant: "destructive",
        });
      }
    };

    fetchCurrentIncome();
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

      const { data, error } = await supabase
        .from('income')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_default', true);

      if (error) throw error;

      if (data && data.length > 0) {
        const currentDate = new Date().toISOString().split('T')[0];
        const lucasIncome = data.find(inc => inc.source === "Primary Job")?.amount || 0;
        const camilaIncome = data.find(inc => inc.source === "Wife Job 1")?.amount || 0;
        const otherIncome = data.find(inc => inc.source === "Other")?.amount || 0;

        const promises = [
          supabase.from('income').upsert({
            amount: lucasIncome,
            source: "Primary Job",
            date: currentDate,
            user_id: user.id,
            is_default: false
          }, { 
            onConflict: 'user_id,source,date',
            ignoreDuplicates: false 
          }),
          supabase.from('income').upsert({
            amount: camilaIncome,
            source: "Wife Job 1",
            date: currentDate,
            user_id: user.id,
            is_default: false
          }, { 
            onConflict: 'user_id,source,date',
            ignoreDuplicates: false 
          }),
          supabase.from('income').upsert({
            amount: otherIncome,
            source: "Other",
            date: currentDate,
            user_id: user.id,
            is_default: false
          }, { 
            onConflict: 'user_id,source,date',
            ignoreDuplicates: false 
          })
        ];

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
      } else {
        toast({
          title: "No defaults found",
          description: "Please set up default values in the Administration page first.",
        });
      }
    } catch (error: any) {
      console.error('Error loading defaults:', error);
      toast({
        title: "Error loading defaults",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleIncomeChange = async (field: keyof IncomeState, value: number) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in to update income",
          variant: "destructive",
        });
        return;
      }

      const currentDate = new Date().toISOString().split('T')[0];
      const source = field === 'lucas' ? "Primary Job" : field === 'camila' ? "Wife Job 1" : "Other";

      const { error } = await supabase
        .from('income')
        .upsert({
          amount: value,
          source,
          date: currentDate,
          user_id: user.id,
          is_default: false
        }, {
          onConflict: 'user_id,source,date',
          ignoreDuplicates: false
        });

      if (error) throw error;

      setIncome(prev => ({ ...prev, [field]: value }));
    } catch (error: any) {
      console.error('Error updating income:', error);
      toast({
        title: "Error updating income",
        description: error.message,
        variant: "destructive",
      });
    }
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