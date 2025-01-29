import { Input } from "@/components/ui/input";
import { formatCurrencyInput, parseCurrencyInput } from "@/utils/formatters";

interface CurrencyInputProps {
  value: number;
  onChange: (value: number) => void;
  placeholder?: string;
  className?: string;
}

export const CurrencyInput = ({
  value,
  onChange,
  placeholder = "Enter amount",
  className,
}: CurrencyInputProps) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseCurrencyInput(e.target.value);
    onChange(newValue);
  };

  return (
    <Input
      type="text"
      value={formatCurrencyInput(value)}
      onChange={handleChange}
      placeholder={placeholder}
      className={className}
    />
  );
};