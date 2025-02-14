import React, { useState } from 'react';
import { useBudgetContext } from '../context/BudgetContext';
import { supabase } from "@/integrations/supabase/client";

const MonthlyDetails: React.FC = () => {
  const { budgetPlans } = useBudgetContext();
  const [fixedExpenses, setFixedExpenses] = useState([]);

  const loadDefaults = async () => {
    try {
      // Retrieve default fixed expenses (from the existing function)
      const defaults = getDefaultFixedExpenses(); // ...existing function...
      // Query shared Administrator budget plans that require status
      const { data: bpData, error: bpError } = await supabase
        .from('budget_plans')
        .select('*')
        .eq('requires_status', true);
      if (bpError) throw bpError;
      // Merge defaults with fetched budget plans
      setFixedExpenses([...defaults, ...(bpData || [])]);
    } catch (error: any) {
      console.error("Error loading defaults:", error);
      // Optionally display an error toast here if you add a toast hook.
    }
  };

  const handleCheckboxToggle = (taskId) => {
    // ...existing toggle logic...
    updateTaskState(taskId); // ensure state is updated immediately after the action
  };

  // Compute number of completed tasks (assuming each expense has a 'completed' boolean)
  const completedCount = fixedExpenses.filter(expense => expense.completed).length;

  return (
    <div>
      <button onClick={loadDefaults}>Load Defaults</button>
      {/* Display test completion status */}
      <div style={{ color: (fixedExpenses.length > 0 && completedCount === fixedExpenses.length) ? 'green' : 'inherit' }}>
        {completedCount} out of {fixedExpenses.length} tests completed
      </div>
      {/* Render fixed expenses */}
      {fixedExpenses.map(expense => (
        <div key={expense.id}>
          {/* ...existing expense rendering... */}
        </div>
      ))}
      {/* ...existing code... */}
    </div>
  );
};

export default MonthlyDetails;
