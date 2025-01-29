import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { formatCurrency } from "@/utils/formatters";

const defaultIncome = {
  lucas: 3867,
  camila: 2511,
  other: 220,
};

export const IncomeSection = () => {
  const [income, setIncome] = useState({ lucas: 0, camila: 0, other: 0 });
  const { toast } = useToast();

  const totalIncome = income.lucas + income.camila + income.other;

  const handleLoadDefaults = () => {
    setIncome(defaultIncome);
    toast({
      title: "Income Defaults Loaded",
      description: "Your default monthly income has been loaded.",
    });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Monthly Income</CardTitle>
        <Button onClick={handleLoadDefaults}>Load Defaults</Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="text-sm font-medium">Lucas's Income</label>
            <Input
              type="number"
              value={income.lucas || ''}
              onChange={(e) => setIncome(prev => ({ ...prev, lucas: parseFloat(e.target.value) || 0 }))}
              placeholder="Enter income"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Camila's Income</label>
            <Input
              type="number"
              value={income.camila || ''}
              onChange={(e) => setIncome(prev => ({ ...prev, camila: parseFloat(e.target.value) || 0 }))}
              placeholder="Enter income"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Other Income</label>
            <Input
              type="number"
              value={income.other || ''}
              onChange={(e) => setIncome(prev => ({ ...prev, other: parseFloat(e.target.value) || 0 }))}
              placeholder="Enter other income"
            />
          </div>
        </div>
        <div className="text-right">
          <span className="text-lg font-bold">
            Total Income: {formatCurrency(totalIncome)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
};