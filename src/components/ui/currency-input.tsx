import * as React from "react";
import { Input } from "./input";
import { formatCurrency, parseCurrencyInput } from "@/utils/formatters";

interface CurrencyInputProps {
  value: string | number;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
}

export const CurrencyInput = ({ value, onChange, className, placeholder }: CurrencyInputProps) => {
  // Convert number to string for editing
  const displayValue = typeof value === 'string' ? value : value.toString();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newValue = e.target.value;
    
    // Allow only numbers and one decimal point
    if (!/^\d*\.?\d*$/.test(newValue)) {
      return;
    }
    
    onChange(newValue);
  };

  const handleBlur = () => {
    // Format on blur only
    if (value) {
      const numValue = parseCurrencyInput(value.toString());
      if (!isNaN(numValue)) {
        onChange(numValue.toFixed(2));
      }
    }
  };

  return (
    <Input
      type="text"
      value={displayValue}
      onChange={handleChange}
      onBlur={handleBlur}
      className={className}
      placeholder={placeholder || "0.00"}
    />
  );
}; 