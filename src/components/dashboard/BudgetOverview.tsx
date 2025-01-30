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
          { type: 'Fondos Depot', current_value: 0, user_id: user.id }
        ];

        const { error: createError } = await supabase
          .from('investments')
          .insert(defaultInvestments);

        if (createError) {
          console.error("Error creating default investments:", createError);
        }
      }

      // Create default reserves if none exist
      const { count: reservesCount, error: reservesCountError } = await supabase
        .from('reserves')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      if (reservesCountError) {
        console.error("Error checking reserves count:", reservesCountError);
      } else if (reservesCount === 0) {
        console.log("No reserves found, creating defaults...");
        const defaultReserves = [
          { type: 'Emergency', current_value: 0, user_id: user.id },
          { type: 'Travel', current_value: 0, user_id: user.id }
        ];

        const { error: createError } = await supabase
          .from('reserves')
          .insert(defaultReserves);

        if (createError) {
          console.error("Error creating default reserves:", createError);
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

    // Set up real-time subscriptions
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

      if (error) {
        throw error;
      }

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

  const investmentTypes = ['Crypto', 'Lucas Pension', 'Camila Pension', 'Fondsdepot'];
  const reserveTypes = ['Emergency', 'Travel'];

  const filteredInvestments = investments.filter(inv => investmentTypes.includes(inv.type));
  const filteredReserves = reserves.filter(res => reserveTypes.includes(res.type));

  console.log("Filtered investments:", filteredInvestments);
  console.log("Filtered reserves:", filteredReserves);
  console.log("Investment types to filter:", investmentTypes);
  console.log("Reserve types to filter:", reserveTypes);

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

        <Card className="col-span-3 md:col-span-2">
          <CardHeader>
            <CardTitle>Investments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {filteredInvestments.map((investment) => (
                <div key={investment.id} className="bg-white rounded-lg p-4 shadow">
                  <div className="text-sm font-medium text-gray-700 mb-2">
                    {investment.type}
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    {editingInvestment === investment.id ? (
                      <>
                        <Input
                          type="number"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="w-24 text-right"
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
                  <div className="text-xs text-gray-500 mt-2">
                    Last updated: {new Date(investment.last_updated).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Reserves</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredReserves.map((reserve) => (
                <div key={reserve.id} className="bg-white rounded-lg p-4 shadow">
                  <div className="text-sm font-medium text-gray-700 mb-2">
                    {reserve.type}
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    {editingReserve === reserve.id ? (
                      <>
                        <Input
                          type="number"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="w-24 text-right"
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
                  <div className="text-xs text-gray-500 mt-2">
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
