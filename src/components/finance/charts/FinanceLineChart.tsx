import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatCurrency } from '@/utils/formatters';

interface FinanceLineChartProps {
  data: Array<{
    month: string;
    income: number;
    expenses: number;
  }>;
}

export const FinanceLineChart = ({ data }: FinanceLineChartProps) => {
  return (
    <div className="h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip formatter={(value: number) => formatCurrency(value)} />
          <Line type="monotone" dataKey="income" stroke="#4a5568" strokeWidth={2} />
          <Line type="monotone" dataKey="expenses" stroke="#ecc94b" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};