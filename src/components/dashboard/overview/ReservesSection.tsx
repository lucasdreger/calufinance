import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ReserveCard } from "./ReserveCard";

interface Reserve {
  id: string;
  type: string;
  current_value: number;
  last_updated: string;
}

interface ReservesSectionProps {
  reserves: Reserve[];
  editingReserve: string | null;
  editValue: string;
  onEdit: (id: string, currentValue: number) => void;
  onSave: (id: string) => void;
  onEditValueChange: (value: string) => void;
}

export const ReservesSection = ({
  reserves,
  editingReserve,
  editValue,
  onEdit,
  onSave,
  onEditValueChange,
}: ReservesSectionProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Reserves</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {reserves.map((reserve) => (
            <ReserveCard
              key={reserve.id}
              reserve={reserve}
              isEditing={editingReserve === reserve.id}
              editValue={editValue}
              onEdit={() => onEdit(reserve.id, reserve.current_value)}
              onSave={() => onSave(reserve.id)}
              onEditValueChange={onEditValueChange}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};