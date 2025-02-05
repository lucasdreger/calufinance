import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { IncomeSource } from "@/types/income";

interface IncomeFormProps {
  source: IncomeSource;
  onIncomeSaved: () => void;
}

export const IncomeForm = ({ source, onIncomeSaved }: IncomeFormProps) => {
  const [amount, setAmount] = useState("");
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!amount) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to add income",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase
      .from('income')
      .insert({
        amount: parseFloat(amount),
        source,
        date: new Date().toISOString().split('T')[0],
        user_id: user.id
      });

    if (error) {
      toast({
        title: "Error saving income",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    setAmount("");
    onIncomeSaved();

    toast({
      title: "Income saved",
      description: "Your income has been successfully recorded.",
    });
  };

  return (
    <div>
      <label className="text-sm font-medium text-gray-700">{source}</label>
      <div className="flex gap-2">
        <Input 
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder={`Enter ${source.toLowerCase()} income`}
          className="mt-1"
        />
        <Button 
          onClick={handleSubmit}
          className="mt-1"
        >
          Add
        </Button>
      </div>
    </div>
  );
};