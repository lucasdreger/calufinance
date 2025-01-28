import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FinanceOverview } from "@/components/finance/FinanceOverview";
import { ExpenseCategories } from "@/components/finance/ExpenseCategories";
import { IncomeSection } from "@/components/finance/IncomeSection";
import { MonthlySpending } from "@/components/finance/MonthlySpending";

const Index = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-4xl font-bold text-[#1a365d] mb-8">Personal Finance Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <FinanceOverview />
        <ExpenseCategories />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <IncomeSection />
        <MonthlySpending />
      </div>
    </div>
  );
};

export default Index;