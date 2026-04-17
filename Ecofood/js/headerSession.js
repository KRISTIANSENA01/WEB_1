import { supabase } from './supabaseClient.js';
import { logoutUser } from './auth.js';

function byId(id) {
  return document.getElementById(id);
}

export async function initHeaderSession() {
  const loginLink = byId('navLogin');
  const registerLink = byId('navRegister');
  const dashboardLink = byId('navDashboard');
  const logoutBtn = byId('navLogout');
  const userInfo = byId('navUserInfo');

  const { data } = await supabase.auth.getSession();
  const user = data.session?.user ?? null;

  if (user) {
    if (loginLink) loginLink.style.display = 'none';
    if (registerLink) registerLink.style.display = 'none';
    if (dashboardLink) dashboardLink.style.display = 'inline-block';
    if (logoutBtn) logoutBtn.style.display = 'inline-block';
    if (userInfo) userInfo.textContent = user.email ?? '';
  } else {
    if (loginLink) loginLink.style.display = 'inline-block';
    if (registerLink) registerLink.style.display = 'inline-block';
    if (dashboardLink) dashboardLink.style.display = 'none';
    if (logoutBtn) logoutBtn.style.display = 'none';
    if (userInfo) userInfo.textContent = '';
  }

  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      await logoutUser();
    });
  }
}

