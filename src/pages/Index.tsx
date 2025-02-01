import { useState } from "react";
import { BudgetOverview } from "@/components/dashboard/BudgetOverview";
import { MonthlyView } from "@/components/dashboard/MonthlyView";
import { ExpensesSection } from "@/components/dashboard/sections/ExpensesSection";
import { BudgetAdministration } from "@/components/admin/BudgetAdministration";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { LogOut } from "lucide-react";
import { MonthlyDeviation } from "@/components/dashboard/reports/MonthlyDeviation";
import { MonthlyExpensesTable } from "@/components/dashboard/reports/MonthlyExpensesTable";
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

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  const [selectedYear, setSelectedYear] = useState(currentYear);

  // Updated mock data to include all months
  const mockData = {
    monthlyData: [
      { month: 'Jan', planned: 5000, actual: 4800 },
      { month: 'Feb', planned: 5000, actual: 5200 },
      { month: 'Mar', planned: 5000, actual: 4900 },
      { month: 'Apr', planned: 5000, actual: 0 },
      { month: 'May', planned: 5000, actual: 0 },
      { month: 'Jun', planned: 5000, actual: 0 },
      { month: 'Jul', planned: 5000, actual: 0 },
      { month: 'Aug', planned: 5000, actual: 0 },
      { month: 'Sep', planned: 5000, actual: 0 },
      { month: 'Oct', planned: 5000, actual: 0 },
      { month: 'Nov', planned: 5000, actual: 0 },
      { month: 'Dec', planned: 5000, actual: 0 }
    ]
  };

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

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
          <TabsTrigger value="admin">Administration</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <BudgetOverview monthlyData={mockData.monthlyData} />
          <MonthlyDeviation />
          <MonthlyExpensesTable />
        </TabsContent>

        <TabsContent value="monthly">
          <div className="space-y-6">
            <div className="flex gap-4 items-center">
              <select
                className="p-2 border rounded"
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              >
                {[currentYear - 1, currentYear, currentYear + 1].map((year) => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
            
            <Tabs defaultValue={currentMonth.toString()} className="space-y-6">
              <TabsList>
                {months.map((month, index) => (
                  <TabsTrigger key={month} value={index.toString()}>
                    {month}
                  </TabsTrigger>
                ))}
              </TabsList>

              {months.map((month, index) => (
                <TabsContent key={month} value={index.toString()}>
                  <MonthlyView selectedYear={selectedYear} selectedMonth={index}>
                    <ExpensesSection
                      selectedYear={selectedYear}
                      selectedMonth={index}
                    />
                  </MonthlyView>
                </TabsContent>
              ))}
            </Tabs>
          </div>
        </TabsContent>

        <TabsContent value="admin">
          <BudgetAdministration />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Index;