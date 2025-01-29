import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { formatCurrency, formatCurrencyInput, parseCurrencyInput } from "@/utils/formatters";
import { supabase } from "@/integrations/supabase/client";

const defaultIncome = {
  lucas: 3867,
  camila: 2511,
  other: 220,
};

export const IncomeSection = () => {
  const [income, setIncome] = useState({ lucas: 0, camila: 0, other: 0 });
  const { toast } = useToast();

  const totalIncome = income.lucas + income.camila + income.other;

  const fetchIncome = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('income')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .limit(3);

    if (error) {
      toast({
        title: "Error fetching income",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    if (data && data.length > 0) {
      const lucasIncome = data.find(inc => inc.source === "Primary Job")?.amount || 0;
      const camilaIncome = data.find(inc => inc.source === "Wife Job 1")?.amount || 0;
      const otherIncome = data.find(inc => inc.source === "Other")?.amount || 0;

      setIncome({
        lucas: lucasIncome,
        camila: camilaIncome,
        other: otherIncome,
      });
    }
  };

  useEffect(() => {
    fetchIncome();
  }, []);

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

    const date = new Date().toISOString().split('T')[0];
    const promises = [
      supabase.from('income').upsert({
        amount: defaultIncome.lucas,
        source: "Primary Job",
        date,
        user_id: user.id
      }),
      supabase.from('income').upsert({
        amount: defaultIncome.camila,
        source: "Wife Job 1",
        date,
        user_id: user.id
      }),
      supabase.from('income').upsert({
        amount: defaultIncome.other,
        source: "Other",
        date,
        user_id: user.id
      })
    ];

    try {
      await Promise.all(promises);
      setIncome(defaultIncome);
      toast({
        title: "Income Defaults Loaded",
        description: "Your default monthly income has been loaded and saved.",
      });
    } catch (error) {
      toast({
        title: "Error saving defaults",
        description: "There was an error saving your default income.",
        variant: "destructive",
      });
    }
  };

  const handleIncomeBlur = (field: keyof typeof income) => (e: React.FocusEvent<HTMLInputElement>) => {
    const numericValue = parseCurrencyInput(e.target.value);
    setIncome(prev => ({ ...prev, [field]: numericValue }));
  };

  const handleIncomeChange = (field: keyof typeof income) => (e: React.ChangeEvent<HTMLInputElement>) => {
    // Allow only numbers and decimal point while typing
    const value = e.target.value.replace(/[^\d.]/g, '');
    setIncome(prev => ({ ...prev, [field]: parseCurrencyInput(value) }));
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Monthly Income</CardTitle>
        <Button onClick={handleLoadDefaults}>Load Defaults</Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="text-sm font-medium">Lucas's Income</label>
            <Input
              value={formatCurrencyInput(income.lucas)}
              onChange={handleIncomeChange('lucas')}
              onBlur={handleIncomeBlur('lucas')}
              placeholder="Enter income"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Camila's Income</label>
            <Input
              value={formatCurrencyInput(income.camila)}
              onChange={handleIncomeChange('camila')}
              onBlur={handleIncomeBlur('camila')}
              placeholder="Enter income"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Other Income</label>
            <Input
              value={formatCurrencyInput(income.other)}
              onChange={handleIncomeChange('other')}
              onBlur={handleIncomeBlur('other')}
              placeholder="Enter other income"
            />
          </div>
        </div>
        <div className="text-right">
          <span className="text-lg font-bold">
            Total Income: {formatCurrency(totalIncome)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
};