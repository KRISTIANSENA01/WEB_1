import { supabase } from './supabaseClient.js';

export async function requireAuth(redirectTo = './Index.html') {
  const { data } = await supabase.auth.getSession();
  if (!data.session) {
    window.location.href = redirectTo;
    return false;
  }
  return true;
}

export async function requireRole(allowedRoles = [], redirectTo = './Index.html') {
  const { data } = await supabase.auth.getSession();
  const user = data.session?.user;
  if (!user) {
    window.location.href = redirectTo;
    return false;
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, is_active')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile || profile.is_active === false) {
    window.location.href = redirectTo;
    return false;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(profile.role)) {
    window.location.href = redirectTo;
    return false;
  }

  return true;
}

export async function protectPage() {
  const protectedEl = document.body?.dataset?.protected;
  if (protectedEl === 'true') {
    await requireAuth();
  }
}
