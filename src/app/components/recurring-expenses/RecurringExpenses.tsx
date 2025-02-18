import useSWR from 'swr';
import fetcher from '../utils/fetcher';

// ...existing code...

const { data: fixedExpenses, error } = useSWR<FixedExpensePlan[]>(
  '/api/fixed-expense-plans',
  fetcher
);

// ...existing code...

// Update any references from budgetPlans to fixedExpensePlans

// ...existing code...
