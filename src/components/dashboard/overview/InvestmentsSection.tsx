
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InvestmentCard } from "./InvestmentCard";

interface Investment {
  id: string;
  type: string;
  current_value: number;
  last_updated: string;
}

interface InvestmentsSectionProps {
  investments: Investment[];
  editingInvestment: string | null;
  editValue: string;
  onEdit: (id: string, currentValue: number) => void;
  onSave: (id: string) => void;
  onEditValueChange: (value: string) => void;
}

export const InvestmentsSection = ({
  investments,
  editingInvestment,
  editValue,
  onEdit,
  onSave,
  onEditValueChange,
}: InvestmentsSectionProps) => {
  return (
    <Card className="col-span-3 md:col-span-2">
      <CardHeader>
        <CardTitle>Investments</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {investments.map((investment) => (
            <InvestmentCard
              key={investment.id}
              investment={investment}
              isEditing={editingInvestment === investment.id}
              editValue={editValue}
              onEdit={() => onEdit(investment.id, investment.current_value)}
              onSave={() => onSave(investment.id)}
              onEditValueChange={onEditValueChange}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
