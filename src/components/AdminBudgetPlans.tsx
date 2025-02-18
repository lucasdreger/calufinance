import React from 'react';
import { useBudgetContext } from '../context/BudgetContext';

const Adminfixed_expense_plan: React.FC = () => {
  const { addBudgetPlan } = useBudgetContext();
  
  const handleCreatePlan = (plan) => {
    // ...existing plan creation logic...
    addBudgetPlan(plan); // instantly update shared state for all family members
  };

  return (
    <div>
      {/* ...existing code... */}
      <button onClick={() => handleCreatePlan(newPlan)}>Create Budget Plan</button>
    </div>
  );
};

export default Adminfixed_expense_plan;
