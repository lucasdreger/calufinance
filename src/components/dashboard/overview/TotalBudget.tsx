import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/utils/formatters";
import { Tooltip } from "@/components/ui/tooltip";
import { TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface TotalBudgetProps {
  totalBudget: number;
}

export const TotalBudget = ({ totalBudget }: TotalBudgetProps) => {
  return (
    <TooltipProvider delayDuration={3000}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Card className="col-span-3 md:col-span-1">
            <CardHeader>
              <CardTitle>Total Budget</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{formatCurrency(totalBudget)}</div>
            </CardContent>
          </Card>
        </TooltipTrigger>
        <TooltipContent>
          <p>Your total budget across all investments and reserves</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};