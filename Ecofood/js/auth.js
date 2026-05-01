import { supabase } from './supabaseClient.js';

// Resuelve el rol final del usuario usando primero `profiles` y, si no
// existe o falla, intenta aprovechar metadata de Auth antes de caer en `user`.
function resolveUserRole(profileRole, user) {
  return (
    profileRole ||
    user?.app_metadata?.role ||
    user?.user_metadata?.role ||
    'user'
  );
}

// Registra un usuario nuevo en Supabase Auth.
// Después intenta crear o actualizar el perfil básico en la tabla
// `profiles`, dejando listo el nombre y el rol inicial `user`.
export async function registerUser({ fullName, email, password }) {
  const normalizedName = String(fullName || '').trim();
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const normalizedPassword = String(password || '');

  console.log('[registerUser] Inicio de registro', {
    fullName: normalizedName,
    email: normalizedEmail,
    passwordLength: normalizedPassword.length
  });

  if (!normalizedName || !normalizedEmail || !normalizedPassword) {
    console.warn('[registerUser] Validacion fallida: faltan campos obligatorios');
    return { success: false, message: 'Completa todos los campos.' };
  }

  if (normalizedPassword.length < 6) {
    console.warn('[registerUser] Validacion fallida: contrasena muy corta');
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
    console.log('[registerUser] Respuesta auth.signUp', response);
    data = response.data;
    error = response.error;
  } catch (networkError) {
    console.error('[registerUser] Error de red en signUp', networkError);
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
    console.error('[registerUser] Error devuelto por Supabase Auth', error);
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
  console.log('[registerUser] Usuario creado en auth', { userId, hasSession: Boolean(data.session) });

  if (userId) {
    const profileResponse = await supabase
      .from('profiles')
      .upsert(
        {
          id: userId,
          full_name: normalizedName,
          role: 'user'
        },
        { onConflict: 'id' }
      );
    console.log('[registerUser] Resultado upsert profiles', profileResponse);
  }

  if (!data.session) {
    console.log('[registerUser] No hay sesion inmediata, probando signIn para confirmar estado del correo');
    const probe = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password: normalizedPassword
    });
    console.log('[registerUser] Resultado de prueba signInWithPassword', probe);

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

// Inicia sesión con correo y contraseña.
// Si la autenticación es válida, consulta la tabla `profiles` para
// conocer el rol real que se usará para construir el dashboard.
export async function loginUser({ email, password }) {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const normalizedPassword = String(password || '');

  console.log('[loginUser] Intento de inicio de sesion', {
    email: normalizedEmail,
    passwordLength: normalizedPassword.length
  });

  if (!normalizedEmail || !normalizedPassword) {
    console.warn('[loginUser] Validacion fallida: correo o contrasena vacios');
    return { success: false, message: 'Completa correo y contrasena.' };
  }

  let data;
  let error;
  try {
    const response = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password: normalizedPassword
    });
    console.log('[loginUser] Respuesta auth.signInWithPassword', response);
    data = response.data;
    error = response.error;
  } catch (networkError) {
    console.error('[loginUser] Error de red en signInWithPassword', networkError);
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
    console.error('[loginUser] Error de autenticacion', { error, data });
    const msg = String(error?.message || '').toLowerCase();
    if (msg.includes('email not confirmed')) {
      return { success: false, message: 'Debes confirmar tu correo antes de iniciar sesion.' };
    }
    if (msg.includes('invalid login credentials')) {
      return { success: false, message: 'Correo o contrasena invalida.' };
    }
    return { success: false, message: `No se pudo iniciar sesion: ${error?.message || 'error'}` };
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', data.user.id)
    .maybeSingle();

  console.log('[loginUser] Perfil cargado', { profile, profileError, user: data.user });

  const resolvedRole = resolveUserRole(profile?.role, data.user);

  return {
    success: true,
    role: resolvedRole,
    profile: {
      fullName: profile?.full_name || data.user.user_metadata?.full_name || '',
      email: data.user.email || normalizedEmail,
      role: resolvedRole
    }
  };
}

// Cierra la sesión actual del usuario autenticado.
// Devuelve un objeto simple para mantener el mismo formato de respuesta
// que usan los demás flujos del módulo.
export async function logoutUser() {
  await supabase.auth.signOut();
  return { success: true };
}

// Obtiene el rol del usuario que ya tiene una sesión activa.
// Esto permite restaurar el dashboard correcto cuando la persona vuelve
// a cargar la página sin tener que iniciar sesión otra vez.
export async function getCurrentRole() {
  const { data } = await supabase.auth.getSession();
  console.log('[getCurrentRole] Sesion actual', data);
  const user = data.session?.user;
  if (!user) return null;

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  console.log('[getCurrentRole] Perfil recuperado', { profile, error, user });

  return resolveUserRole(profile?.role, user);
}

// Recupera la informacion base del usuario autenticado para pintarla en UI.
// Une datos de Auth y de la tabla `profiles` para mostrar nombre, correo
// y rol actual en el panel sin depender de textos fijos.
export async function getCurrentUserProfile() {
  const { data } = await supabase.auth.getSession();
  console.log('[getCurrentUserProfile] Sesion actual', data);
  const user = data.session?.user;
  if (!user) return null;

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', user.id)
    .maybeSingle();

  console.log('[getCurrentUserProfile] Perfil recuperado', { profile, error });

  const resolvedRole = resolveUserRole(profile?.role, user);

  return {
    id: user.id,
    fullName: profile?.full_name || user.user_metadata?.full_name || 'Sin nombre',
    email: user.email || 'Sin correo',
    role: resolvedRole
  };
}

// Lista todos los perfiles visibles en el módulo de administración.
// Antes de consultar verifica que el usuario autenticado sí tenga rol
// `admin`, para evitar enseñar datos a quien no corresponde.
export async function listProfilesForAdmin() {
  const currentRole = await getCurrentRole();
  console.log('[listProfilesForAdmin] Rol actual', currentRole);
  if (currentRole !== 'admin') {
    return { success: false, message: 'Solo admin puede ver usuarios.', users: [] };
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, role, is_active, created_at')
    .order('created_at', { ascending: false });

  console.log('[listProfilesForAdmin] Respuesta consulta profiles', { data, error });

  if (error) {
    return { success: false, message: `No se pudo cargar usuarios: ${error.message}`, users: [] };
  }

  return { success: true, users: data || [] };
}

// Actualiza el rol de otro usuario desde el panel de administración.
// Valida que el nuevo rol exista y confirma que quien ejecuta la acción
// realmente sea admin antes de tocar la base de datos.
export async function updateRoleAsAdmin(userId, newRole) {
  const allowed = ['user', 'seller', 'admin'];
  if (!allowed.includes(newRole)) {
    console.warn('[updateRoleAsAdmin] Rol no permitido', { userId, newRole });
    return { success: false, message: 'Rol no valido.' };
  }

  const currentRole = await getCurrentRole();
  console.log('[updateRoleAsAdmin] Intento de cambio de rol', { userId, newRole, currentRole });
  if (currentRole !== 'admin') {
    return { success: false, message: 'Solo admin puede cambiar roles.' };
  }

  const { error } = await supabase
    .from('profiles')
    .update({ role: newRole })
    .eq('id', userId);

  console.log('[updateRoleAsAdmin] Resultado update role', { userId, newRole, error });

  if (error) {
    return { success: false, message: `No se pudo actualizar rol: ${error.message}` };
  }

  return { success: true, message: 'Rol actualizado correctamente.' };
}
