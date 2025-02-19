
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CategoryManagement } from "./CategoryManagement";
import { BudgetPlanManagement } from "./BudgetPlanManagement";
import { DefaultIncomeManagement } from "./DefaultIncomeManagement";

export const BudgetAdministration = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Budget Administration</h2>
        <p className="text-muted-foreground">
          Manage your budget categories, fixed expenses, and default income settings.
        </p>
      </div>

      <Tabs defaultValue="categories" className="space-y-4">
        <TabsList>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="fixed-expenses">Fixed Expenses</TabsTrigger>
          <TabsTrigger value="default-income">Default Income</TabsTrigger>
        </TabsList>
        
        <TabsContent value="categories" className="space-y-4">
          <CategoryManagement />
        </TabsContent>
        
        <TabsContent value="fixed-expenses" className="space-y-4">
          <BudgetPlanManagement />
        </TabsContent>
        
        <TabsContent value="default-income" className="space-y-4">
          <DefaultIncomeManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
};
