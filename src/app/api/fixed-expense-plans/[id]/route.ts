import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { FixedExpensePlan } from '@/types';

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const supabase = createRouteHandlerClient({ cookies });
  
  try {
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const json = await request.json();
    const { data, error } = await supabase
      .from('fixed_expense_plans')
      .update(json)
      .eq('id', params.id)
      .eq('user_id', session.user.id)
      .select()
      .returns<FixedExpensePlan[]>();

    if (error) throw error;
    if (!data?.length) {
      return NextResponse.json({ error: 'Plan not found or unauthorized' }, { status: 404 });
    }

    return NextResponse.json(data[0]);
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Error updating fixed expense plan' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const supabase = createRouteHandlerClient({ cookies });
  
  try {
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { error } = await supabase
      .from('fixed_expense_plans')
      .delete()
      .eq('id', params.id)
      .eq('user_id', session.user.id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Error deleting fixed expense plan' }, { status: 500 });
  }
}
