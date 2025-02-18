import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function GET() {
  try {
    const { data: fixedExpensePlans, error } = await supabase
      .from('fixed_expense_plans')
      .select('*');

    if (error) throw error;

    return NextResponse.json(fixedExpensePlans);
  } catch (error) {
    return NextResponse.json({ error: 'Error fetching fixed expense plans' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const { data, error } = await supabase
      .from('fixed_expense_plans')
      .insert([json])
      .select();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Error creating fixed expense plan' }, { status: 500 });
  }
}
