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
        <CurrencyInput
          label="Lucas's Income"
          key={income.lucas}
          value={income.lucas}
          onChange={(value) => onIncomeChange("lucas", value)}
          placeholder="Enter income"
        />
      </div>
      <div>
        <CurrencyInput
          label="Camila's Income"
          key={income.camila}
          value={income.camila}
          onChange={(value) => onIncomeChange("camila", value)}
          placeholder="Enter income"
        />
      </div>
      <div>
        <CurrencyInput
          label="Other Income"
          key={income.other}
          value={income.other}
          onChange={(value) => onIncomeChange("other", value)}
          placeholder="Enter other income"
        />
      </div>
    </div>
  );
};