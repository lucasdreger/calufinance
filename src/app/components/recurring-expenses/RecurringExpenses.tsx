import useSWR from 'swr';
import fetcher from '../utils/fetcher';
import { FixedExpensePlan } from '@/types';

export default function RecurringExpenses() {
  const { data: fixedExpensePlans, error, isLoading } = useSWR<FixedExpensePlan[]>(
    '/api/fixed-expense-plans',
    fetcher
  );

  if (error) {
    return <div>Failed to load expenses</div>;
  }

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!fixedExpensePlans?.length) {
    return <div>No recurring expenses found</div>;
  }

  // Update any references from fixed_expense_plan to fixedExpensePlans

  // ...existing code...
}
