import { Card } from "@/components/ui/card";
import { FinanceOverview } from "@/components/finance/FinanceOverview";
import { ExpenseCategories } from "@/components/finance/ExpenseCategories";
import { IncomeSection } from "@/components/finance/IncomeSection";
import { MonthlySpending } from "@/components/finance/MonthlySpending";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { LogOut } from "lucide-react";

const Index = () => {
  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-[#1a365d]">
          Personal Finance Dashboard
        </h1>
        <Button variant="outline" onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          Sair
        </Button>
      </div>

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