import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export const IncomeSection = () => {
  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-[#1a365d]">Monthly Income</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium text-gray-700">Your Income</label>
          <Input type="number" placeholder="Enter your income" className="mt-1" />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700">Wife's Job 1</label>
          <Input type="number" placeholder="Enter first job income" className="mt-1" />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700">Wife's Job 2</label>
          <Input type="number" placeholder="Enter second job income" className="mt-1" />
        </div>
        <div className="pt-4 border-t">
          <div className="flex justify-between items-center">
            <span className="font-medium">Total Monthly Income:</span>
            <span className="text-xl font-bold text-[#4a5568]">$0.00</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};