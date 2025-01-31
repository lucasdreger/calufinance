import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/utils/formatters";
import { Edit2, Save } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface InvestmentCardProps {
  investment: {
    id: string;
    type: string;
    current_value: number;
    last_updated: string;
  };
  isEditing: boolean;
  editValue: string;
  onEdit: () => void;
  onSave: () => void;
  onEditValueChange: (value: string) => void;
}

export const InvestmentCard = ({
  investment,
  isEditing,
  editValue,
  onEdit,
  onSave,
  onEditValueChange,
}: InvestmentCardProps) => {
  return (
    <TooltipProvider delayDuration={3000}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="bg-white rounded-lg p-4 shadow">
            <div className="text-sm font-medium text-gray-700 mb-2">
              {investment.type}
            </div>
            <div className="flex items-center justify-between gap-2">
              {isEditing ? (
                <>
                  <Input
                    type="number"
                    value={editValue}
                    onChange={(e) => onEditValueChange(e.target.value)}
                    className="w-24 text-right"
                  />
                  <Button size="sm" onClick={onSave}>
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
                    onClick={onEdit}
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
        </TooltipTrigger>
        <TooltipContent>
          <p>Click edit to update the current value of your {investment.type} investment</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};