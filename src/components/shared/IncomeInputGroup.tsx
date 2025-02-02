import { useEffect } from "react";
import { CurrencyInput } from "./CurrencyInput";

interface IncomeState {
  lucas: number;
  camila: number;
  other: number;
}

interface IncomeInputGroupProps {
  income: IncomeState;
  onIncomeChange: (field: keyof IncomeState, value: number) => void;
}

export const IncomeInputGroup = ({ income, onIncomeChange }: IncomeInputGroupProps) => {
  useEffect(() => {
    console.log("🔄 IncomeInputGroup received new income state:", income);
  }, [income]);

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <div>
        <label className="text-sm font-medium">Lucas's Income</label>
        <CurrencyInput
          key={income.lucas} // Forces re-render
          value={income.lucas}
          onChange={(value) => onIncomeChange("lucas", value)}
          placeholder="Enter income"
        />
      </div>
      <div>
        <label className="text-sm font-medium">Camila's Income</label>
        <CurrencyInput
          key={income.camila}
          value={income.camila}
          onChange={(value) => onIncomeChange("camila", value)}
          placeholder="Enter income"
        />
      </div>
      <div>
        <label className="text-sm font-medium">Other Income</label>
        <CurrencyInput
          key={income.other}
          value={income.other}
          onChange={(value) => onIncomeChange("other", value)}
          placeholder="Enter other income"
        />
      </div>
    </div>
  );
};
