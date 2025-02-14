import React, { useState } from 'react';
import { useBudgetContext } from '../context/BudgetContext';

const MonthlyDetails: React.FC = () => {
  const { budgetPlans } = useBudgetContext();
  const [fixedExpenses, setFixedExpenses] = useState([]);

  const loadDefaults = () => {
    // Retrieve default fixed expenses then merge with shared Budget Plans
    const defaults = getDefaultFixedExpenses(); // ...existing function...
    setFixedExpenses([...defaults, ...budgetPlans]); // instantly update the list
  };

  const handleCheckboxToggle = (taskId) => {
    // ...existing toggle logic...
    updateTaskState(taskId); // ensure state is updated immediately after the action
  };

  return (
    <div>
      <button onClick={loadDefaults}>Load Defaults</button>
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
