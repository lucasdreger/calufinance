import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { IncomeInputGroup } from "../shared/IncomeInputGroup";
import { useToast } from "@/components/ui/use-toast";

interface IncomeState {
  lucas: number;
  camila: number;
  other: number;
}

export const DefaultIncomeManagement = () => {
  // Estados para gerenciar renda padrão
  const [defaultIncome, setDefaultIncome] = useState<any[]>([]);
  const { toast } = useToast();
  const [income, setIncome] = useState<IncomeState>({
    lucas: 0,
    camila: 0,
    other: 0,
  });

  // Busca renda padrão do backend
  const fetchDefaultIncome = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        toast({
          title: "Erro",
          description: "Por favor, faça login para continuar",
          variant: "destructive",
        });
        return;
      }

      console.log('Fetching default income for user:', user.id);

      const { data, error } = await supabase
        .from("income")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_default", true);

      if (error) {
        console.error('Error fetching default income:', error);
        throw error;
      }

      console.log('Fetched default income data:', data);
      setDefaultIncome(data || []);

      // Atualiza o estado com os valores do backend
      const newIncome = { lucas: 0, camila: 0, other: 0 };
      data?.forEach((item: any) => {
        if (item.source === "Primary Job") newIncome.lucas = item.amount;
        if (item.source === "Wife Job 1") newIncome.camila = item.amount;
        if (item.source === "Other") newIncome.other = item.amount;
      });
      console.log('Setting income state to:', newIncome);
      setIncome(newIncome);
    } catch (error: any) {
      console.error('Error in fetchDefaultIncome:', error);
      toast({
        title: "Erro ao buscar renda",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Atualiza valores de renda
  const handleIncomeChange = (field: keyof IncomeState, value: number) => {
    setIncome((prev) => ({ ...prev, [field]: value }));
  };

  // Salva renda padrão no backend
  const handleSave = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        toast({
          title: "Erro",
          description: "Por favor, faça login para continuar",
          variant: "destructive",
        });
        return;
      }

      const currentDate = new Date().toISOString().split('T')[0];
      
      // Prepara dados para atualização
      const updates = [
        {
          amount: income.lucas,
          source: "Primary Job",
          user_id: user.id,
          is_default: true,
          date: currentDate,
        },
        {
          amount: income.camila,
          source: "Wife Job 1",
          user_id: user.id,
          is_default: true,
          date: currentDate,
        },
        {
          amount: income.other,
          source: "Other",
          user_id: user.id,
          is_default: true,
          date: currentDate,
        }
      ];

      console.log('Saving default income:', updates);

      // Atualiza ou insere novos registros
      const { error } = await supabase
        .from("income")
        .upsert(updates, { 
          onConflict: 'user_id,source,is_default',
          ignoreDuplicates: false 
        });

      if (error) throw error;

      toast({ 
        title: "Sucesso", 
        description: "Renda padrão salva com sucesso" 
      });
      
      // Recarrega dados após salvar
      await fetchDefaultIncome();
    } catch (error: any) {
      console.error('Error saving default income:', error);
      toast({
        title: "Erro ao salvar renda",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Carrega dados ao montar o componente
  useEffect(() => {
    fetchDefaultIncome();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gerenciamento de Renda Padrão</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <IncomeInputGroup income={income} onIncomeChange={handleIncomeChange} />
        <Button onClick={handleSave} className="w-full">
          Salvar Renda Padrão
        </Button>
      </CardContent>
    </Card>
  );
};