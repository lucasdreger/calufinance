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
  // Estado para armazenar dados mensais do gráfico
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  // Estado para armazenar investimentos
  const [investments, setInvestments] = useState<any[]>([]);
  // Estado para armazenar reservas
  const [reserves, setReserves] = useState<any[]>([]);
  // Estados para controle de edição
  const [editingInvestment, setEditingInvestment] = useState<string | null>(null);
  const [editingReserve, setEditingReserve] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>("");
  const { toast } = useToast();

  // Função para buscar dados mensais para o gráfico
  const fetchMonthlyData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const currentYear = new Date().getFullYear();
    
    // Cria array com todos os meses do ano
    const months = Array.from({ length: 12 }, (_, i) => {
      const date = new Date(currentYear, i, 1);
      return {
        month: date.toLocaleString('default', { month: 'short' }),
        startDate: new Date(currentYear, i, 1).toISOString(),
        endDate: new Date(currentYear, i + 1, 0).toISOString()
      };
    });

    // Busca dados para cada mês
    const monthlyDataPromises = months.map(async ({ month, startDate, endDate }) => {
      // Busca gastos planejados
      const { data: plannedData } = await supabase
        .from('budget_plans')
        .select('estimated_amount')
        .eq('user_id', user.id);

      // Busca gastos reais
      const { data: actualData } = await supabase
        .from('expenses')
        .select('amount')
        .eq('user_id', user.id)
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
    console.log('Monthly data fetched:', data); // Debug log
    setMonthlyData(data);
  };

  // Função para buscar dados gerais (investimentos e reservas)
  const fetchData = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        console.error("Auth error:", userError);
        toast({
          title: "Erro de Autenticação",
          description: "Por favor, faça login novamente",
          variant: "destructive",
        });
        return;
      }

      // Busca investimentos
      const { data: investmentsData, error: investmentsError } = await supabase
        .from('investments')
        .select('*')
        .eq('user_id', user.id);

      if (investmentsError) throw investmentsError;

      // Busca reservas
      const { data: reservesData, error: reservesError } = await supabase
        .from('reserves')
        .select('*')
        .eq('user_id', user.id);

      if (reservesError) throw reservesError;

      console.log('Investments data:', investmentsData);
      console.log('Reserves data:', reservesData);

      setInvestments(investmentsData || []);
      setReserves(reservesData || []);
    } catch (error: any) {
      console.error("Error in fetchData:", error);
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Efeito para carregar dados iniciais
  useEffect(() => {
    fetchData();
    fetchMonthlyData();

    // Setup real-time listeners
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

  // Funções de edição
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
          title: "Valor inválido",
          description: "Por favor, insira um número válido",
          variant: "destructive",
        });
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Erro de Autenticação",
          description: "Por favor, faça login novamente",
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
        title: "Sucesso",
        description: "Valor atualizado com sucesso",
      });

      await fetchData();
    } catch (error: any) {
      console.error("Error saving value:", error);
      toast({
        title: "Erro ao salvar",
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