import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const categories = [
  { id: 'housing', name: 'Housing', isFixed: true },
  { id: 'insurance', name: 'Insurance', isFixed: true },
  { id: 'investments', name: 'Investments', isFixed: true },
  { id: 'groceries', name: 'Groceries', isFixed: false },
  { id: 'entertainment', name: 'Entertainment', isFixed: false },
];

export const MonthlySpending = () => {
  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-[#1a365d]">Monthly Spending</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {categories.map((category) => (
            <div key={category.id}>
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                {category.name}
                <span className={`text-xs px-2 py-1 rounded ${
                  category.isFixed ? 'bg-[#4a5568] text-white' : 'bg-[#ecc94b]'
                }`}>
                  {category.isFixed ? 'Fixed' : 'Variable'}
                </span>
              </label>
              <Input 
                type="number" 
                placeholder={`Enter ${category.name.toLowerCase()} expenses`}
                className="mt-1"
              />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};