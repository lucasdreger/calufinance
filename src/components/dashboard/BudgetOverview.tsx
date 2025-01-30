import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/utils/formatters";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { supabase } from "@/integrations/supabase/client";

interface Investment {
  type: string;
  current_value: number;
}

interface Reserve {
  type: string;
  current_value: number;
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

  const fetchData = async () => {
    const { data: investmentsData, error: investmentsError } = await supabase
      .from('investments')
      .select('type, current_value')
      .order('type');

    const { data: reservesData, error: reservesError } = await supabase
      .from('reserves')
      .select('type, current_value')
      .order('type');

    if (investmentsError || reservesError) {
      console.error("Error fetching data:", investmentsError || reservesError);
      return;
    }

    setInvestments(investmentsData || []);
    setReserves(reservesData || []);
  };

  useEffect(() => {
    fetchData();

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

  const totalBudget = investments.reduce((sum, inv) => sum + inv.current_value, 0) +
                      reserves.reduce((sum, res) => sum + res.current_value, 0);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="col-span-3 md:col-span-1">
          <CardHeader>
            <CardTitle>Total Budget</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatCurrency(totalBudget)}</div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Investments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-4">
              {investments.map((investment) => (
                <div key={investment.type} className="text-center">
                  <div className="text-sm font-medium text-muted-foreground mb-1">
                    {investment.type === "Fondos Depot" ? "Fondsdepot" :
                     investment.type === "Lucas Pension" ? "Prev. Lucas" :
                     investment.type === "Camila Pension" ? "Prev. Camila" :
                     investment.type}
                  </div>
                  <div className="text-lg font-semibold tabular-nums">
                    {formatCurrency(investment.current_value)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle>Reserves</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {reserves.map((reserve) => (
                <div key={reserve.type} className="text-center">
                  <div className="text-sm font-medium text-muted-foreground mb-1">
                    {reserve.type === "Emergency" ? "SOS" :
                     reserve.type === "Travel" ? "Viagens" :
                     reserve.type}
                  </div>
                  <div className="text-lg font-semibold tabular-nums">
                    {formatCurrency(reserve.current_value)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Monthly Budget vs Actual</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
              <Bar dataKey="planned" fill="#4a5568" name="Planned" />
              <Bar dataKey="actual" fill="#ecc94b" name="Actual" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};