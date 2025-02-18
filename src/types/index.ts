export interface FixedExpensePlan {
  id: string;
  user_id: string;
  category_id: string;
  description: string;
  estimated_amount: number;
  is_fixed: boolean;
  created_at: string;
  requires_status: boolean;
  owner: string;
}
