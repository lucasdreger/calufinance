export interface FixedExpensePlan {
  id: string; // UUID in DB but keeping as string for API
  user_id: string; // UUID in DB but keeping as string for API
  category_id: string; // UUID in DB but keeping as string for API
  description: string;
  estimated_amount: number;
  is_fixed: boolean;
  created_at: string; // timestamp in DB, but comes as ISO string in API
  requires_status: boolean | null;
  owner: string; // text in DB
}
