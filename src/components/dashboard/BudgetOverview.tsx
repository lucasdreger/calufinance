
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/utils/formatters";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { TotalBudget } from "./overview/TotalBudget";
import { InvestmentsSection } from "./overview/InvestmentsSection";
import { ReservesSection } from "./overview/ReservesSection";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface MonthlyData {
  month: string;
  planned: number;
  actual: number;
}

export const BudgetOverview = () => {
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [investments, setInvestments] = useState<any[]>([]);
  const [reserves, setReserves] = useState<any[]>([]);
  const [editingInvestment, setEditingInvestment] = useState<string | null>(null);
  const [editingReserve, setEditingReserve] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>("");
  const { toast } = useToast();

  const fetchMonthlyData = async () => {
    try {
      const currentYear = new Date().getFullYear();
      
      const months = Array.from({ length: 12 }, (_, i) => {
        const date = new Date(currentYear, i, 1);
        return {
          month: date.toLocaleString('default', { month: 'short' }),
          startDate: new Date(currentYear, i, 1).toISOString(),
          endDate: new Date(currentYear, i + 1, 0).toISOString()
        };
      });

      const monthlyDataPromises = months.map(async ({ month, startDate, endDate }) => {
        const { data: plannedData } = await supabase
          .from('budget_plans')
          .select('estimated_amount');

        const { data: actualData } = await supabase
          .from('expenses')
          .select('amount')
          .gte('date', startDate)
          .lte('date', endDate);

        const planned = plannedData?.reduce((sum, item) => sum + Number(item.estimated_amount), 0) || 0;
        const actual = actualData?.reduce((sum, item) => sum + Number(item.amount), 0) || 0;

        return {
          month,
          planned,
          actual
        };
      });

      const data = await Promise.all(monthlyDataPromises);
      setMonthlyData(data);
    } catch (error) {
      console.error('Error fetching monthly data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch monthly data",
        variant: "destructive",
      });
    }
  };

  const fetchData = async () => {
    try {
      const { data: investmentsData, error: investmentsError } = await supabase
        .from('investments')
        .select('*')
        .order('type');

      if (investmentsError) throw investmentsError;

      const { data: reservesData, error: reservesError } = await supabase
        .from('reserves')
        .select('*')
        .order('type');

      if (reservesError) throw reservesError;

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
    fetchMonthlyData();

    const investmentsChannel = supabase
      .channel('investments_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'investments' },
        () => fetchData()
      )
      .subscribe();

    const reservesChannel = supabase
      .channel('reserves_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'reserves' },
        () => fetchData()
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

      const table = type === 'investment' ? 'investments' : 'reserves';
      const { error } = await supabase
        .from(table)
        .update({
          current_value: numericValue,
          last_updated: new Date().toISOString(),
        })
        .eq('id', id);

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
        title: "Error saving",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <TotalBudget totalBudget={investments.reduce((sum, inv) => sum + inv.current_value, 0) +
                      reserves.reduce((sum, res) => sum + res.current_value, 0)} />
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <InvestmentsSection
                investments={investments}
                editingInvestment={editingInvestment}
                editValue={editValue}
                onEdit={(id, currentValue) => handleEdit(id, currentValue, 'investment')}
                onSave={(id) => handleSave(id, 'investment')}
                onEditValueChange={setEditValue}
              />
            </TooltipTrigger>
            <TooltipContent>
              <p>Acompanhe e gerencie seu portfólio de investimentos</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <ReservesSection
                reserves={reserves}
                editingReserve={editingReserve}
                editValue={editValue}
                onEdit={(id, currentValue) => handleEdit(id, currentValue, 'reserve')}
                onSave={(id) => handleSave(id, 'reserve')}
                onEditValueChange={setEditValue}
              />
            </TooltipTrigger>
            <TooltipContent>
              <p>Monitore suas reservas de emergência e viagem</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <Card className="col-span-3">
          <CardContent className="h-[300px] pt-6">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <RechartsTooltip formatter={(value: number) => formatCurrency(value)} />
                <Bar dataKey="planned" fill="#4a5568" name="Planejado" />
                <Bar dataKey="actual" fill="#ecc94b" name="Real" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
