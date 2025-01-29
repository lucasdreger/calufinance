import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CategoryManagement } from "./CategoryManagement";
import { BudgetPlanManagement } from "./BudgetPlanManagement";
import { DefaultIncomeManagement } from "./DefaultIncomeManagement";

export const BudgetAdministration = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Budget Administration</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <DefaultIncomeManagement />
          <CategoryManagement />
          <BudgetPlanManagement />
        </div>
      </CardContent>
    </Card>
  );
};