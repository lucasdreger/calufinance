import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/utils/formatters";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { TotalBudget } from "./overview/TotalBudget";
import { InvestmentsSection } from "./overview/InvestmentsSection";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface Investment {
  id: string;
  type: string;
  current_value: number;
  last_updated: string;
}

interface Reserve {
  id: string;
  type: string;
  current_value: number;
  last_updated: string;
}

interface BudgetOverviewProps {
  monthlyData: {
    month: string;
    planned: number;
    actual: number;
  }[];
}

export const BudgetOverview = ({ monthlyData }: BudgetOverviewProps) => {
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [reserves, setReserves] = useState<Reserve[]>([]);
  const [editingInvestment, setEditingInvestment] = useState<string | null>(null);
  const [editingReserve, setEditingReserve] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>("");
  const { toast } = useToast();

  const fetchData = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        console.error("User authentication error:", userError);
        toast({
          title: "Authentication Error",
          description: userError.message,
          variant: "destructive",
        });
        return;
      }

      if (!user) {
        console.error("No authenticated user found");
        toast({
          title: "Authentication Error",
          description: "Please log in to view your data",
          variant: "destructive",
        });
        return;
      }

      console.log("Current user:", user.email, "User ID:", user.id);

      // Create default investments if none exist
      const { count: investmentsCount, error: countError } = await supabase
        .from('investments')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      if (countError) {
        console.error("Error checking investments count:", countError);
      } else if (investmentsCount === 0) {
        console.log("No investments found, creating defaults...");
        const defaultInvestments = [
          { type: 'Crypto', current_value: 0, user_id: user.id },
          { type: 'Lucas Pension', current_value: 0, user_id: user.id },
          { type: 'Camila Pension', current_value: 0, user_id: user.id },
          { type: 'Fondsdepot', current_value: 0, user_id: user.id }
        ];

        const { error: createError } = await supabase
          .from('investments')
          .insert(defaultInvestments);

        if (createError) {
          console.error("Error creating default investments:", createError);
        }
      }

      // Fetch investments with detailed logging
      console.log("Fetching investments for user:", user.id);
      const { data: investmentsData, error: investmentsError } = await supabase
        .from('investments')
        .select('*')
        .eq('user_id', user.id);

      if (investmentsError) {
        console.error("Error fetching investments:", investmentsError);
        toast({
          title: "Error fetching investments",
          description: investmentsError.message,
          variant: "destructive",
        });
        return;
      }

      // Fetch reserves with detailed logging
      console.log("Fetching reserves for user:", user.id);
      const { data: reservesData, error: reservesError } = await supabase
        .from('reserves')
        .select('*')
        .eq('user_id', user.id);

      if (reservesError) {
        console.error("Error fetching reserves:", reservesError);
        toast({
          title: "Error fetching reserves",
          description: reservesError.message,
          variant: "destructive",
        });
        return;
      }

      console.log("Raw investments data:", investmentsData);
      console.log("Raw reserves data:", reservesData);

      setInvestments(investmentsData || []);
      setReserves(reservesData || []);
    } catch (error: any) {
      console.error("Error in fetchData:", error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchData();

    const investmentsChannel = supabase
      .channel('investments_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'investments' },
        (payload) => {
          console.log('Investment change detected:', payload);
          fetchData();
        }
      )
      .subscribe();

    const reservesChannel = supabase
      .channel('reserves_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'reserves' },
        (payload) => {
          console.log('Reserve change detected:', payload);
          fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(investmentsChannel);
      supabase.removeChannel(reservesChannel);
    };
  }, []);

  const handleEdit = (id: string, currentValue: number, type: 'investment' | 'reserve') => {
    setEditValue(currentValue.toString());
    if (type === 'investment') {
      setEditingInvestment(id);
      setEditingReserve(null);
    } else {
      setEditingReserve(id);
      setEditingInvestment(null);
    }
  };

  const handleSave = async (id: string, type: 'investment' | 'reserve') => {
    try {
      const numericValue = parseFloat(editValue);
      if (isNaN(numericValue)) {
        toast({
          title: "Invalid value",
          description: "Please enter a valid number",
          variant: "destructive",
        });
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication Error",
          description: "Please log in to update values",
          variant: "destructive",
        });
        return;
      }

      const table = type === 'investment' ? 'investments' : 'reserves';
      const { error } = await supabase
        .from(table)
        .update({
          current_value: numericValue,
          last_updated: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setEditingInvestment(null);
      setEditingReserve(null);
      setEditValue("");
      
      toast({
        title: "Success",
        description: "Value updated successfully",
      });

      await fetchData();
    } catch (error: any) {
      console.error("Error saving value:", error);
      toast({
        title: "Error saving value",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const totalBudget = investments.reduce((sum, inv) => sum + inv.current_value, 0) +
                      reserves.reduce((sum, res) => sum + res.current_value, 0);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <TotalBudget totalBudget={totalBudget} />
        
        <InvestmentsSection
          investments={investments}
          editingInvestment={editingInvestment}
          editValue={editValue}
          onEdit={(id, currentValue) => handleEdit(id, currentValue, 'investment')}
          onSave={(id) => handleSave(id, 'investment')}
          onEditValueChange={setEditValue}
        />

        <TooltipProvider delayDuration={3000}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Card className="col-span-3">
                <CardContent className="h-[300px] pt-6">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <RechartsTooltip formatter={(value: number) => formatCurrency(value)} />
                      <Bar dataKey="planned" fill="#4a5568" name="Planned" />
                      <Bar dataKey="actual" fill="#ecc94b" name="Actual" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TooltipTrigger>
            <TooltipContent>
              <p>Compare your planned budget against actual spending for each month</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
};
