export async function getFixedExpenses(userId: string) {
  const { data, error } = await supabase
    .from('fixed_expense_plans')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error fetching fixed expenses:', error)
    return []
  }

  return data
}
