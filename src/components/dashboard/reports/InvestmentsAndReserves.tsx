import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Edit2, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { formatCurrency } from "@/utils/formatters";

interface Investment {
  id: string;
  type: string;
  initial_value: number;
  current_value: number;
  last_updated: string;
}

interface Reserve {
  id: string;
  type: string;
  current_value: number;
  target_value: number | null;
  last_updated: string;
}

export const InvestmentsAndReserves = () => {
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [reserves, setReserves] = useState<Reserve[]>([]);
  const [editingInvestment, setEditingInvestment] = useState<string | null>(null);
  const [editingReserve, setEditingReserve] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>("");
  const { toast } = useToast();

  const fetchData = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) throw userError;
      if (!user) {
        toast({
          title: "Authentication Error",
          description: "Please log in to view your investments and reserves",
          variant: "destructive",
        });
        return;
      }

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
        toast({
          title: "Error fetching data",
          description: investmentsError?.message || reservesError?.message,
          variant: "destructive",
        });
        return;
      }

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

    const table = type === 'investment' ? 'investments' : 'reserves';
    const { error } = await supabase
      .from(table)
      .update({
        current_value: numericValue,
        last_updated: new Date().toISOString(),
      })
      .eq('id', id);

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
  };

  const calculateTotalInvestments = () => {
    return investments.reduce((sum, inv) => sum + inv.current_value, 0);
  };

  const calculateTotalReserves = () => {
    return reserves.reduce((sum, res) => sum + res.current_value, 0);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="border-b bg-muted/30">
          <CardTitle className="text-xl font-semibold text-primary">Investments Overview</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-[200px]">Type</TableHead>
                <TableHead className="text-right">Initial Value</TableHead>
                <TableHead className="text-right">Current Value</TableHead>
                <TableHead className="text-right">Last Updated</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {investments.map((investment, index) => (
                <TableRow
                  key={investment.id}
                  className={`
                    ${index % 2 === 0 ? 'bg-background' : 'bg-muted/30'}
                    hover:bg-muted/50 transition-colors
                  `}
                >
                  <TableCell className="font-medium">{investment.type}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatCurrency(investment.initial_value)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {editingInvestment === investment.id ? (
                      <Input
                        type="number"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="w-32 ml-auto"
                      />
                    ) : (
                      formatCurrency(investment.current_value)
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {new Date(investment.last_updated).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {editingInvestment === investment.id ? (
                      <Button
                        size="sm"
                        onClick={() => handleSave(investment.id, 'investment')}
                      >
                        <Save className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEdit(investment.id, investment.current_value, 'investment')}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              <TableRow className="bg-muted font-semibold">
                <TableCell>Total</TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatCurrency(investments.reduce((sum, inv) => sum + inv.initial_value, 0))}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatCurrency(investments.reduce((sum, inv) => sum + inv.current_value, 0))}
                </TableCell>
                <TableCell colSpan={2} />
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b bg-muted/30">
          <CardTitle className="text-xl font-semibold text-primary">Reserves Overview</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-[200px]">Type</TableHead>
                <TableHead className="text-right">Current Value</TableHead>
                <TableHead className="text-right">Target Value</TableHead>
                <TableHead className="text-right">Last Updated</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reserves.map((reserve, index) => (
                <TableRow
                  key={reserve.id}
                  className={`
                    ${index % 2 === 0 ? 'bg-background' : 'bg-muted/30'}
                    hover:bg-muted/50 transition-colors
                  `}
                >
                  <TableCell className="font-medium">{reserve.type}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {editingReserve === reserve.id ? (
                      <Input
                        type="number"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="w-32 ml-auto"
                      />
                    ) : (
                      formatCurrency(reserve.current_value)
                    )}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {reserve.target_value ? formatCurrency(reserve.target_value) : '—'}
                  </TableCell>
                  <TableCell className="text-right">
                    {new Date(reserve.last_updated).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {editingReserve === reserve.id ? (
                      <Button
                        size="sm"
                        onClick={() => handleSave(reserve.id, 'reserve')}
                      >
                        <Save className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEdit(reserve.id, reserve.current_value, 'reserve')}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              <TableRow className="bg-muted font-semibold">
                <TableCell>Total</TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatCurrency(reserves.reduce((sum, res) => sum + res.current_value, 0))}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatCurrency(reserves.reduce((sum, res) => sum + (res.target_value || 0), 0))}
                </TableCell>
                <TableCell colSpan={2} />
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};