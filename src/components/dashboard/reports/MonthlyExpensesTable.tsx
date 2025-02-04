import React from "react";

interface Expense {
  category: string;
  month: string;
  actualAmount: number;
  budgetedAmount: number;
}

interface MonthlyExpensesTableProps {
  expenses: Expense[];
}

const MonthlyExpensesTable: React.FC<MonthlyExpensesTableProps> = ({ expenses }) => {
  // Filter out months where actualAmount is 0 or undefined
  const filteredExpenses = expenses.filter(expense => expense.actualAmount > 0);

  // Group expenses by category
  const expensesByCategory = filteredExpenses.reduce((acc, expense) => {
    if (!acc[expense.category]) {
      acc[expense.category] = [];
    }
    acc[expense.category].push(expense);
    return acc;
  }, {} as Record<string, Expense[]>);

  return (
    <div className="p-4 bg-white shadow-md rounded-lg">
      <h2 className="text-lg font-semibold mb-4">Monthly Expenses by Category</h2>
      {Object.keys(expensesByCategory).length === 0 ? (
        <p className="text-gray-500">No expenses recorded.</p>
      ) : (
        <table className="w-full border-collapse border border-gray-200">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-2 text-left">Category</th>
              <th className="border p-2 text-left">Month</th>
              <th className="border p-2 text-right">Actual Amount</th>
              <th className="border p-2 text-right">Budgeted Amount</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(expensesByCategory).map(([category, expenses]) => (
              <React.Fragment key={category}>
                {expenses.map((expense, index) => (
                  <tr key={`${category}-${expense.month}`} className={index % 2 === 0 ? "bg-gray-50" : ""}>
                    <td className="border p-2">{expense.category}</td>
                    <td className="border p-2">{expense.month}</td>
                    <td className="border p-2 text-right">${expense.actualAmount.toFixed(2)}</td>
                    <td className="border p-2 text-right">${expense.budgetedAmount.toFixed(2)}</td>
                  </tr>
                ))}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default MonthlyExpensesTable;