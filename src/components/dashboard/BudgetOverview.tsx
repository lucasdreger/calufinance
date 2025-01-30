import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/utils/formatters";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Edit2, Save } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

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
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: investmentsData, error: investmentsError } = await supabase
      .from('investments')
      .select('*')
      .eq('user_id', user.id)
      .order('type');

    const { data: reservesData, error: reservesError } = await supabase
      .from('reserves')
      .select('*')
      .eq('user_id', user.id)
      .order('type');

    if (investmentsError || reservesError) {
      console.error("Error fetching data:", { investmentsError, reservesError });
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
    if (!user) return;

    const table = type === 'investment' ? 'investments' : 'reserves';
    const { error } = await supabase
      .from(table)
      .update({
        current_value: numericValue,
        last_updated: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      toast({
        title: "Error updating value",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    setEditingInvestment(null);
    setEditingReserve(null);
    setEditValue("");
    
    toast({
      title: "Success",
      description: "Value updated successfully",
    });

    fetchData();
  };

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
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {investments.map((investment) => (
                <div key={investment.id} className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-sm font-medium text-muted-foreground mb-2">
                    {investment.type}
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    {editingInvestment === investment.id ? (
                      <>
                        <Input
                          type="number"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="w-32"
                        />
                        <Button
                          size="sm"
                          onClick={() => handleSave(investment.id, 'investment')}
                        >
                          <Save className="h-4 w-4" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <span className="text-lg font-semibold">
                          {formatCurrency(investment.current_value)}
                        </span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEdit(investment.id, investment.current_value, 'investment')}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground mt-2">
                    Last updated: {new Date(investment.last_updated).toLocaleDateString()}
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
                <div key={reserve.id} className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-sm font-medium text-muted-foreground mb-2">
                    {reserve.type}
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    {editingReserve === reserve.id ? (
                      <>
                        <Input
                          type="number"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="w-32"
                        />
                        <Button
                          size="sm"
                          onClick={() => handleSave(reserve.id, 'reserve')}
                        >
                          <Save className="h-4 w-4" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <span className="text-lg font-semibold">
                          {formatCurrency(reserve.current_value)}
                        </span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEdit(reserve.id, reserve.current_value, 'reserve')}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground mt-2">
                    Last updated: {new Date(reserve.last_updated).toLocaleDateString()}
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