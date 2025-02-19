export interface FixedExpensePlan {
  id: string;
  user_id: string;
  category_id: string;
  description: string;
  estimated_amount: number;
  requires_status: boolean;
  is_fixed: boolean;
  owner: string;
  created_at: string;
}
