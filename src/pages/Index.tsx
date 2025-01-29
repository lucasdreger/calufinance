import { useState } from "react";
import { BudgetOverview } from "@/components/dashboard/BudgetOverview";
import { MonthlyView } from "@/components/dashboard/MonthlyView";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { LogOut } from "lucide-react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

const Index = () => {
  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  // This would be fetched from your database
  const mockData = {
    totalBudget: 50000,
    monthlyData: [
      { month: 'Jan', planned: 5000, actual: 4800 },
      { month: 'Feb', planned: 5000, actual: 5200 },
      { month: 'Mar', planned: 5000, actual: 4900 },
    ]
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-[#1a365d]">
          Financial Dashboard
        </h1>
        <Button variant="outline" onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="monthly">Monthly Details</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <BudgetOverview 
            totalBudget={mockData.totalBudget}
            monthlyData={mockData.monthlyData}
          />
        </TabsContent>

        <TabsContent value="monthly">
          <MonthlyView />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Index;