
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { FixedExpensePlan } from '@/types';

export async function GET() {
  const supabase = createRouteHandlerClient({ cookies });
  
  try {
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: fixedExpensePlans, error } = await supabase
      .from('fixed_expense_plans')
      .select('*')
      .eq('user_id', session.user.id)
      .returns<FixedExpensePlan[]>();

    if (error) throw error;

    return NextResponse.json(fixedExpensePlans);
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Error fetching fixed expense plans' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const supabase = createRouteHandlerClient({ cookies });
  
  try {
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const json = await request.json();
    const newPlan = {
      ...json,
      user_id: session.user.id,
      owner: session.user.id
    };

    const { data, error } = await supabase
      .from('fixed_expense_plans')
      .insert([newPlan])
      .select()
      .returns<FixedExpensePlan[]>();

    if (error) throw error;

    return NextResponse.json(data?.[0] || null);
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Error creating fixed expense plan' }, { status: 500 });
  }
}
