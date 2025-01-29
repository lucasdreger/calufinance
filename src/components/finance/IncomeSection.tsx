import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

export const IncomeSection = () => {
  const [incomes, setIncomes] = useState<any[]>([]);
  const [newIncome, setNewIncome] = useState({
    source: "",
    amount: "",
    date: new Date().toISOString().split('T')[0]
  });
  const { toast } = useToast();

  const fetchIncomes = async () => {
    const { data, error } = await supabase
      .from('income')
      .select('*')
      .order('date', { ascending: false });
    
    if (error) {
      toast({
        title: "Error fetching income data",
        description: error.message,
        variant: "destructive",
      });
      return;
    }
    
    setIncomes(data || []);
  };

  useEffect(() => {
    fetchIncomes();

    const channel = supabase
      .channel('income_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'income' },
        () => {
          fetchIncomes();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleSubmit = async (source: string) => {
    if (!newIncome.amount || !source) return;

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
        amount: parseFloat(newIncome.amount),
        source,
        date: newIncome.date,
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

    setNewIncome({
      source: "",
      amount: "",
      date: new Date().toISOString().split('T')[0]
    });

    toast({
      title: "Income saved",
      description: "Your income has been successfully recorded.",
    });
  };

  const totalIncome = incomes.reduce((sum, income) => sum + parseFloat(income.amount), 0);

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-[#1a365d]">Monthly Income</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium text-gray-700">Your Income</label>
          <div className="flex gap-2">
            <Input 
              type="number" 
              value={newIncome.amount}
              onChange={(e) => setNewIncome(prev => ({ ...prev, amount: e.target.value }))}
              placeholder="Enter your income" 
              className="mt-1" 
            />
            <Button 
              onClick={() => handleSubmit("Primary Job")}
              className="mt-1"
            >
              Add
            </Button>
          </div>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700">Wife's Job 1</label>
          <div className="flex gap-2">
            <Input 
              type="number"
              value={newIncome.amount}
              onChange={(e) => setNewIncome(prev => ({ ...prev, amount: e.target.value }))}
              placeholder="Enter first job income" 
              className="mt-1" 
            />
            <Button 
              onClick={() => handleSubmit("Wife Job 1")}
              className="mt-1"
            >
              Add
            </Button>
          </div>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700">Wife's Job 2</label>
          <div className="flex gap-2">
            <Input 
              type="number"
              value={newIncome.amount}
              onChange={(e) => setNewIncome(prev => ({ ...prev, amount: e.target.value }))}
              placeholder="Enter second job income" 
              className="mt-1" 
            />
            <Button 
              onClick={() => handleSubmit("Wife Job 2")}
              className="mt-1"
            >
              Add
            </Button>
          </div>
        </div>
        <div className="pt-4 border-t">
          <div className="flex justify-between items-center">
            <span className="font-medium">Total Monthly Income:</span>
            <span className="text-xl font-bold text-[#4a5568]">
              ${totalIncome.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};