import { supabase } from './supabaseClient.js';

export async function registerUser({ fullName, email, password }) {
  const normalizedName = String(fullName || '').trim();
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const normalizedPassword = String(password || '');

  if (!normalizedName || !normalizedEmail || !normalizedPassword) {
    return { success: false, message: 'Completa todos los campos.' };
  }

  if (normalizedPassword.length < 6) {
    return { success: false, message: 'La contrasena debe tener minimo 6 caracteres.' };
  }

  let data;
  let error;
  try {
    const response = await supabase.auth.signUp({
      email: normalizedEmail,
      password: normalizedPassword,
      options: { data: { full_name: normalizedName } }
    });
    data = response.data;
    error = response.error;
  } catch (networkError) {
    const message = String(networkError?.message || '');
    if (message.toLowerCase().includes('failed to fetch')) {
      return {
        success: false,
        message: 'No hay conexion con Supabase. Abre la app con servidor local (http://localhost).'
      };
    }
    return { success: false, message: `Error de red: ${message || 'desconocido'}` };
  }

  if (error) {
    const msg = String(error.message || '');
    const lowered = msg.toLowerCase();
    if (lowered.includes('email address') && lowered.includes('invalid')) {
      return { success: false, message: 'Correo invalido. Usa un correo real, por ejemplo nombre@gmail.com' };
    }
    if (lowered.includes('already registered')) {
      return { success: false, message: 'Este correo ya esta registrado.' };
    }
    if (lowered.includes('email signups are disabled')) {
      return { success: false, message: 'El registro por correo esta desactivado en Supabase.' };
    }
    return { success: false, message: `No se pudo registrar: ${msg}` };
  }

  const userId = data.user?.id;
  if (userId) {
    await supabase
      .from('profiles')
      .upsert(
        {
          id: userId,
          full_name: normalizedName,
          role: 'user'
        },
        { onConflict: 'id' }
      );
  }

  if (!data.session) {
    const probe = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password: normalizedPassword
    });

    if (!probe.error) {
      await supabase.auth.signOut();
      return { success: true, message: 'Registro exitoso. Ya puedes iniciar sesion.' };
    }

    if (String(probe.error.message || '').toLowerCase().includes('email not confirmed')) {
      return {
        success: true,
        message: 'Registro exitoso. Revisa tu correo y confirma la cuenta para iniciar sesion.'
      };
    }
  }

  return { success: true, message: 'Registro exitoso. Ya puedes iniciar sesion.' };
}

export async function loginUser({ email, password }) {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const normalizedPassword = String(password || '');

  if (!normalizedEmail || !normalizedPassword) {
    return { success: false, message: 'Completa correo y contrasena.' };
  }

  let data;
  let error;
  try {
    const response = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password: normalizedPassword
    });
    data = response.data;
    error = response.error;
  } catch (networkError) {
    const message = String(networkError?.message || '');
    if (message.toLowerCase().includes('failed to fetch')) {
      return {
        success: false,
        message: 'No hay conexion con Supabase. Abre la app con servidor local (http://localhost).'
      };
    }
    return { success: false, message: `Error de red: ${message || 'desconocido'}` };
  }

  if (error || !data.user) {
    const msg = String(error?.message || '').toLowerCase();
    if (msg.includes('email not confirmed')) {
      return { success: false, message: 'Debes confirmar tu correo antes de iniciar sesion.' };
    }
    if (msg.includes('invalid login credentials')) {
      return { success: false, message: 'Correo o contrasena invalida.' };
    }
    return { success: false, message: `No se pudo iniciar sesion: ${error?.message || 'error'}` };
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', data.user.id)
    .maybeSingle();

  return { success: true, role: profile?.role ?? 'user' };
}

export async function logoutUser() {
  await supabase.auth.signOut();
  return { success: true };
}

export async function getCurrentRole() {
  const { data } = await supabase.auth.getSession();
  const user = data.session?.user;
  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  return profile?.role ?? 'user';
}

export async function listProfilesForAdmin() {
  const currentRole = await getCurrentRole();
  if (currentRole !== 'admin') {
    return { success: false, message: 'Solo admin puede ver usuarios.', users: [] };
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, role, is_active, created_at')
    .order('created_at', { ascending: false });

  if (error) {
    return { success: false, message: `No se pudo cargar usuarios: ${error.message}`, users: [] };
  }

  return { success: true, users: data || [] };
}

export async function updateRoleAsAdmin(userId, newRole) {
  const allowed = ['user', 'seller', 'admin'];
  if (!allowed.includes(newRole)) {
    return { success: false, message: 'Rol no valido.' };
  }

  const currentRole = await getCurrentRole();
  if (currentRole !== 'admin') {
    return { success: false, message: 'Solo admin puede cambiar roles.' };
  }

  const { error } = await supabase
    .from('profiles')
    .update({ role: newRole })
    .eq('id', userId);

  if (error) {
    return { success: false, message: `No se pudo actualizar rol: ${error.message}` };
  }

  return { success: true, message: 'Rol actualizado correctamente.' };
}
