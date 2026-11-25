import { redirect } from 'next/navigation';
import { createClient } from '../../../lib/supabase/server';

const FINANCE_ROLES = ['SUPER_ADMIN', 'CEO', 'CORPORATE_ADMIN', 'FINANCE'];

export default async function FinanceRoute() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/login?redirect=%2Fdashboard%2Ffinance');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role_id, is_active')
    .eq('id', user.id)
    .single();

  if (!profile || profile.is_active !== true || !profile.role_id) {
    redirect('/dashboard');
  }

  const { data: role } = await supabase
    .from('roles')
    .select('code')
    .eq('id', profile.role_id)
    .single();

  if (!role || !FINANCE_ROLES.includes(role.code)) {
    redirect('/dashboard');
  }

  // The established finance dashboard already covers farmer settlements,
  // procurement, expenses, credit recovery, and printable statements.
  redirect('/bodhifarm/finance');
}
