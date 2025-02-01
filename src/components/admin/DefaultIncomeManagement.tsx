import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { IncomeInputGroup } from "@/components/shared/IncomeInputGroup";
import { InfoCircle } from "lucide-react";
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

    // First, delete existing default records
    await supabase
      .from('income')
      .delete()
      .eq('user_id', user.id)
      .eq('is_default', true);

    // Then insert new default records
    const promises = [
      supabase.from('income').insert({
        amount: defaultIncome.lucas,
        source: "Primary Job",
        date,
        user_id: user.id,
        is_default: true
      }),
      supabase.from('income').insert({
        amount: defaultIncome.camila,
        source: "Wife Job 1",
        date,
        user_id: user.id,
        is_default: true
      }),
      supabase.from('income').insert({
        amount: defaultIncome.other,
        source: "Other",
        date,
        user_id: user.id,
        is_default: true
      })
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
        <div className="flex items-center gap-2">
          <CardTitle>Default Monthly Income</CardTitle>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <InfoCircle className="h-4 w-4 text-gray-500" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Set your default monthly income values here. These will be used as templates for new months.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
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