import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface CurrencyInputProps {
  value: number;
  onChange: (value: number) => void;
  placeholder?: string;
  className?: string;
  label?: string;
}

export const CurrencyInput = ({
  value,
  onChange,
  placeholder = "Enter amount",
  className,
  label
}: CurrencyInputProps) => {
  const [isFocused, setIsFocused] = useState(false);
  const [inputValue, setInputValue] = useState(value.toString());
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newValue = e.target.value;
    
    if (newValue === '' || newValue === '.') {
      setInputValue(newValue);
      return;
    }

    const decimalRegex = /^\d*\.?\d{0,2}$/;
    if (!decimalRegex.test(newValue)) {
      return;
    }

    setInputValue(newValue);
    
    const numericValue = parseFloat(newValue || '0');
    if (!isNaN(numericValue)) {
      onChange(numericValue);
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    
    if (inputValue === '' || inputValue === '.') {
      setInputValue('0');
      onChange(0);
      return;
    }

    const numericValue = parseFloat(inputValue);
    if (!isNaN(numericValue)) {
      const formattedValue = numericValue.toFixed(2);
      setInputValue(formattedValue);
      onChange(parseFloat(formattedValue));
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
    if (parseFloat(inputValue) === 0) {
      setInputValue('');
    }
  };

  const formatValue = (): string => {
    if (isFocused) {
      return inputValue;
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(parseFloat(inputValue || '0'));
  };

  return (
    <div className="space-y-2">
      {label && <Label>{label}</Label>}
      <div className="relative">
        <Input
          type="text"
          value={formatValue()}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          className={className}
          inputMode="decimal"
        />
      </div>
    </div>
  );
};