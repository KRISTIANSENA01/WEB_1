const layoutFragments = [
  { selector: "#header-placeholder", templateId: "header-template" },
  { selector: "#dashboard-placeholder", templateId: "dashboard-template" },
  { selector: "#footer-placeholder", templateId: "footer-template" },
];

const authFragments = [
  { selector: "#auth-views", templateId: "login-template", append: true },
  { selector: "#auth-views", templateId: "register-template", append: true },
];

const FONT_STEP = 0.1;
const MIN_SCALE = 0.85;
const MAX_SCALE = 1.35;
const FONT_STORAGE_KEY = "ecofood-font-scale";
const THEME_STORAGE_KEY = "ecofood-theme";

const roleConfig = {
  admin: {
    label: "Administrador",
    title: "Panel de administración",
    welcome: "Bienvenido, administrador",
    avatar: "AD",
    allowedViews: ["inicio", "inventario", "donantes", "beneficiarios", "roles", "reportes"],
    defaultView: "inicio",
  },
  seller: {
    label: "Aliado",
    title: "Panel operativo",
    welcome: "Bienvenido, aliado EcoFood",
    avatar: "AL",
    allowedViews: ["inicio", "inventario", "donantes", "beneficiarios"],
    defaultView: "inicio",
  },
  user: {
    label: "Beneficiario",
    title: "Mi panel",
    welcome: "Bienvenido, beneficiario",
    avatar: "BF",
    allowedViews: ["beneficiario-inicio", "beneficiario-ayudas", "beneficiario-cuenta"],
    defaultView: "beneficiario-inicio",
  },
};

// Busca un elemento por `id` y centraliza esa consulta en una sola función.
// Esto hace el código más corto y facilita cambiar la forma de buscar nodos
// si más adelante el proyecto crece o se reorganiza.
function byId(id) {
  return document.getElementById(id);
}

// Convierte un `NodeList` en un arreglo real para poder usar `forEach`,
// filtros o cualquier otra operación de arrays sin depender del navegador.
function queryAll(selector, scope = document) {
  return Array.from(scope.querySelectorAll(selector));
}

// Inserta HTML desde un `<template>` ya embebido en `index.html`.
// Se usa para construir header, footer, login y dashboard sin depender
// de `fetch`, algo útil cuando el usuario abre el archivo localmente.
function applyTemplate(templateId, container, append = false) {
  if (!templateId || !container) return;
  const template = byId(templateId);
  if (!template) return;
  if (append) {
    container.insertAdjacentHTML("beforeend", template.innerHTML);
    return;
  }
  container.innerHTML = template.innerHTML;
}

// Monta todos los fragmentos reutilizables apenas carga el DOM.
// Primero pinta la estructura principal y después inyecta las vistas
// de autenticación para que los listeners encuentren todo listo.
function loadAllFragments() {
  layoutFragments.forEach(({ selector, templateId }) => {
    applyTemplate(templateId, document.querySelector(selector));
  });

  const authContainer = document.querySelector("#auth-views");
  if (!authContainer) return;

  authFragments.forEach(({ selector, templateId, append }) => {
    applyTemplate(templateId, document.querySelector(selector), append);
  });
}

// Escribe mensajes de éxito o error dentro de un nodo visual.
// Además de cambiar el texto, añade clases de estado para que el CSS
// muestre el color correcto según sea confirmación o problema.
function setFeedback(element, text, isError = false) {
  if (!element) return;
  element.textContent = text || "";
  element.classList.toggle("feedback-error", Boolean(isError));
  element.classList.toggle("feedback-success", Boolean(text) && !isError);
}

// Cierra el menú móvil y sincroniza el atributo `aria-expanded`.
// Esto evita que el estado visual del menú quede distinto del estado
// accesible que leen lectores de pantalla u otras ayudas.
function closeMenu() {
  document.body.classList.remove("menu-open");
  const menuToggle = byId("menu-toggle");
  menuToggle?.setAttribute("aria-expanded", "false");
}

// Abre el menú móvil cuando la navegación colapsada está oculta.
function openMenu() {
  document.body.classList.add("menu-open");
  const menuToggle = byId("menu-toggle");
  menuToggle?.setAttribute("aria-expanded", "true");
}

// Alterna el menú principal en pantallas pequeñas.
// Si ya está abierto, lo cierra; si está cerrado, lo muestra.
function toggleMenu() {
  if (document.body.classList.contains("menu-open")) {
    closeMenu();
    return;
  }
  openMenu();
}

// Ajusta el tamaño base tipográfico de toda la página.
// El valor se limita entre un mínimo y un máximo para evitar que el
// layout se rompa, y luego se guarda en `localStorage`.
function applyFontScale(scale) {
  const safeScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, Number(scale) || 1));
  document.documentElement.style.fontSize = `${16 * safeScale}px`;
  localStorage.setItem(FONT_STORAGE_KEY, String(safeScale));

  queryAll("[data-font-control]").forEach((button) => {
    button.classList.toggle("active", button.dataset.fontControl === "reset" && safeScale === 1);
  });

  return safeScale;
}

// Aplica el tema visual elegido por la persona usuaria.
// Si se selecciona `default`, limpia el dataset; si no, asigna el tema
// y marca el botón activo para que la interfaz dé retroalimentación.
function applyTheme(theme) {
  const safeTheme = theme && theme !== "default" ? theme : "";
  if (safeTheme) {
    document.body.dataset.theme = safeTheme;
    localStorage.setItem(THEME_STORAGE_KEY, safeTheme);
  } else {
    delete document.body.dataset.theme;
    localStorage.setItem(THEME_STORAGE_KEY, "default");
  }

  queryAll("[data-theme]").forEach((button) => {
    const isActive = (button.dataset.theme || "default") === (safeTheme || "default");
    button.classList.toggle("active", isActive);
  });
}

// Muestra u oculta el panel flotante de ayuda visual.
// También actualiza `aria-hidden` para que el estado sea consistente
// entre lo que se ve en pantalla y lo que exponen tecnologías asistivas.
function toggleAccessibilityPanel(forceOpen) {
  const panel = byId("accessibility-panel");
  if (!panel) return;

  const shouldOpen = typeof forceOpen === "boolean" ? forceOpen : !panel.classList.contains("active");
  panel.classList.toggle("active", shouldOpen);
  panel.setAttribute("aria-hidden", shouldOpen ? "false" : "true");
}

// Desplaza suavemente la vista hacia una sección concreta.
// Se usa en botones del hero y en cualquier otro CTA que apunte a un
// bloque interno de la landing sin recargar la página.
function scrollToTarget(selector) {
  const target = document.querySelector(selector);
  if (!target) return;
  target.scrollIntoView({ behavior: "smooth", block: "start" });
  closeMenu();
}

// Marca en el menú principal la sección visible en pantalla.
// Recorre las anclas internas del header, identifica qué sección está
// más cerca de la parte superior y aplica la clase `active`.
function bindSectionSpy() {
  const navLinks = queryAll('.top-nav a[href^="#"]');
  const sections = navLinks
    .map((link) => {
      const href = link.getAttribute("href");
      if (!href || href === "#login") return null;
      const section = document.querySelector(href);
      if (!section) return null;
      return { link, section, id: href };
    })
    .filter(Boolean);

  if (!sections.length) return;

  const updateActiveLink = () => {
    const offset = 160;
    let currentId = sections[0].id;

    sections.forEach(({ section, id }) => {
      const top = section.getBoundingClientRect().top;
      if (top - offset <= 0) {
        currentId = id;
      }
    });

    sections.forEach(({ link, id }) => {
      link.classList.toggle("active", id === currentId);
    });
  };

  updateActiveLink();
  window.addEventListener("scroll", updateActiveLink, { passive: true });
  window.addEventListener("resize", updateActiveLink);
}

// Registra los listeners globales del sitio público.
// Aquí viven las interacciones del menú móvil, los botones de scroll
// y la apertura del panel de accesibilidad visual.
function bindGlobalInteractions() {
  byId("menu-toggle")?.addEventListener("click", toggleMenu);

  queryAll('.top-nav a[href^="#"]').forEach((link) => {
    link.addEventListener("click", () => closeMenu());
  });

  queryAll("[data-scroll-target]").forEach((button) => {
    button.addEventListener("click", () => {
      scrollToTarget(button.dataset.scrollTarget);
    });
  });

  byId("accessibility-toggle")?.addEventListener("click", () => toggleAccessibilityPanel());
  byId("accessibility-close")?.addEventListener("click", () => toggleAccessibilityPanel(false));

  queryAll("[data-theme]").forEach((button) => {
    button.addEventListener("click", () => applyTheme(button.dataset.theme));
  });
}

// Conecta los botones que cambian tamaño de texto.
// Cada clic recalcula la escala y actualiza el estado compartido para
// que el tamaño actual se conserve al seguir navegando.
function bindFontControls(state) {
  queryAll("[data-font-control]").forEach((button) => {
    button.addEventListener("click", () => {
      const action = button.dataset.fontControl;
      if (action === "increase") {
        state.fontScale = applyFontScale(state.fontScale + FONT_STEP);
        return;
      }
      if (action === "decrease") {
        state.fontScale = applyFontScale(state.fontScale - FONT_STEP);
        return;
      }
      state.fontScale = applyFontScale(1);
    });
  });
}

// Controla el formulario de donación de la landing.
// Su objetivo aquí es evitar errores comunes: campos vacíos, correo mal
// escrito y envíos sin información mínima antes de mostrar confirmación.
function bindDonationForm() {
  const form = byId("donation-form");
  const message = byId("donation-message");
  if (!form || !message) return;

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const name = String(byId("donation-name")?.value || "").trim();
    const email = String(byId("donation-email")?.value || "").trim();
    const type = String(byId("donation-type")?.value || "").trim();
    const amount = String(byId("donation-amount")?.value || "").trim();

    if (!name || !email || !type || !amount) {
      setFeedback(message, "Completa todos los campos principales para registrar la intención de donación.", true);
      return;
    }

    const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!validEmail) {
      setFeedback(message, "Ingresa un correo válido para continuar.", true);
      return;
    }

    form.reset();
    setFeedback(message, "Tu intención de donación quedó registrada en esta demo. Ya puedes seguir navegando.");
  });
}

// Pinta la tabla de roles dentro del dashboard de administración.
// Genera una fila por usuario, crea el selector de rol y conecta el
// botón Guardar de cada fila con la actualización en Supabase.
function renderRolesRows(users, auth) {
  const rolesTableBody = byId("rolesTableBody");
  const rolesMessage = byId("rolesMessage");
  if (!rolesTableBody) return;

  rolesTableBody.innerHTML = "";

  users.forEach((user) => {
    const row = document.createElement("tr");
    const currentRole = user.role || "user";
    const shortId = String(user.id || "").slice(0, 8);

    row.innerHTML = `
      <td>${user.full_name || "Sin nombre"}</td>
      <td title="${user.id || ""}">${shortId}</td>
      <td>
        <select data-role-user-id="${user.id}">
          <option value="user" ${currentRole === "user" ? "selected" : ""}>Beneficiario</option>
          <option value="seller" ${currentRole === "seller" ? "selected" : ""}>Aliado</option>
          <option value="admin" ${currentRole === "admin" ? "selected" : ""}>Administrador</option>
        </select>
      </td>
      <td>
        <button type="button" class="outline" data-save-role-id="${user.id}">Guardar</button>
      </td>
    `;

    rolesTableBody.appendChild(row);
  });

  queryAll("[data-save-role-id]", rolesTableBody).forEach((button) => {
    button.addEventListener("click", async () => {
      const userId = button.getAttribute("data-save-role-id");
      const select = rolesTableBody.querySelector(`[data-role-user-id="${userId}"]`);
      const role = select?.value || "user";

      setFeedback(rolesMessage, "Guardando cambios...");
      const result = await auth.updateRoleAsAdmin(userId, role);
      setFeedback(rolesMessage, result.message || "", !result.success);
    });
  });
}

// Pide a Supabase la lista de perfiles para el panel de roles.
// Si falla la consulta o el usuario no tiene permisos, limpia la tabla
// y deja un mensaje entendible en lugar de un fallo silencioso.
async function loadRolesForAdmin(auth) {
  const rolesMessage = byId("rolesMessage");
  const rolesTableBody = byId("rolesTableBody");
  if (!rolesMessage || !rolesTableBody) return;

  setFeedback(rolesMessage, "Cargando usuarios...");
  const result = await auth.listProfilesForAdmin();

  if (!result.success) {
    rolesTableBody.innerHTML = "";
    setFeedback(rolesMessage, result.message || "No se pudo cargar la lista de usuarios.", true);
    return;
  }

  renderRolesRows(result.users || [], auth);
  setFeedback(rolesMessage, `Usuarios cargados: ${(result.users || []).length}`);
}

// Activa una sola vista del dashboard y desactiva las demás.
// Esto mantiene la lógica de "paneles" sin cambiar de página, como
// inventario, reportes, beneficiarios o cuenta personal.
function setDashboardView(view) {
  queryAll(".dashboard-content").forEach((panel) => {
    panel.classList.toggle("active", panel.dataset.view === view);
  });

  queryAll(".sidebar-nav a[data-view]").forEach((link) => {
    link.classList.toggle("active", link.dataset.view === view);
  });
}

// Traduce el rol interno a un texto entendible para la persona usuaria.
function getRoleLabel(role) {
  if (role === "admin") return "Administrador";
  if (role === "seller") return "Aliado";
  return "Beneficiario";
}

// Pinta en el dashboard los datos reales del usuario autenticado.
// Actualiza saludo, etiqueta lateral y la tarjeta "Mi cuenta" usando
// nombre, correo y rol obtenidos desde Supabase.
function applyUserProfile(profile) {
  if (!profile) return;

  const accountName = byId("account-name");
  const accountEmail = byId("account-email");
  const accountRole = byId("account-role");
  const dashboardWelcome = byId("dashboard-welcome");

  if (accountName) accountName.textContent = profile.fullName || "Sin nombre";
  if (accountEmail) accountEmail.textContent = profile.email || "Sin correo";
  if (accountRole) accountRole.textContent = getRoleLabel(profile.role);
  if (dashboardWelcome) {
    dashboardWelcome.textContent = `Bienvenido, ${profile.fullName || getRoleLabel(profile.role).toLowerCase()}`;
  }
}

// Ajusta qué bloques del dashboard puede ver cada rol autenticado.
// También cambia títulos, saludo y avatar para que la interfaz deje
// claro si la sesión pertenece a admin, aliado o beneficiario.
function applyRoleAccess(role) {
  const currentRole = roleConfig[role] ? role : "user";
  const config = roleConfig[currentRole];
  const roleLabel = byId("dashboard-role-label");
  const dashboardTitle = byId("dashboard-title");
  const dashboardWelcome = byId("dashboard-welcome");
  const dashboardAvatar = byId("dashboard-avatar");

  if (roleLabel) roleLabel.textContent = config.label;
  if (dashboardTitle) dashboardTitle.textContent = config.title;
  if (dashboardWelcome) dashboardWelcome.textContent = config.welcome;
  if (dashboardAvatar) dashboardAvatar.textContent = config.avatar;

  queryAll(".admin-nav").forEach((item) => {
    item.style.display = currentRole === "admin" || currentRole === "seller" ? "" : "none";
  });

  queryAll(".beneficiary-nav").forEach((item) => {
    item.style.display = currentRole === "user" ? "" : "none";
  });

  queryAll(".dashboard-content").forEach((panel) => {
    const allowed = config.allowedViews.includes(panel.dataset.view || "");
    panel.style.display = allowed ? "" : "none";
    panel.classList.remove("active");
  });

  setDashboardView(config.defaultView);
}

// Abre el overlay de autenticación con la vista solicitada.
// Puede mostrar login o registro según el botón pulsado y, además,
// oculta el menú móvil para evitar capas visuales superpuestas.
function showOverlay(view) {
  const overlay = byId("auth-overlay");
  overlay?.classList.add("active");
  overlay?.setAttribute("aria-hidden", "false");
  document.body.classList.add("overlay-active");
  closeMenu();

  queryAll(".auth-panel").forEach((panel) => {
    panel.classList.toggle("active", panel.id === view);
  });
}

// Cierra el overlay de autenticación y devuelve la landing a su estado normal.
function hideOverlay() {
  const overlay = byId("auth-overlay");
  overlay?.classList.remove("active");
  overlay?.setAttribute("aria-hidden", "true");
  document.body.classList.remove("overlay-active");
}

// Muestra el dashboard cuando el login fue correcto o la sesión ya existía.
// También fuerza el cierre del overlay para que no quede abierto detrás.
function showDashboardPage() {
  hideOverlay();
  byId("dashboard-page")?.classList.add("active");
  document.body.classList.add("dashboard-active");
}

// Oculta el dashboard y devuelve la app a la portada pública.
function hideDashboard() {
  byId("dashboard-page")?.classList.remove("active");
  document.body.classList.remove("dashboard-active");
}

// Asigna comportamiento básico a botones del dashboard que hoy funcionan
// como demostración visual, evitando que parezcan rotos o sin respuesta.
function bindDashboardHelpers() {
  const dashboardFeedback = byId("dashboard-feedback");

  queryAll("[data-action-message]").forEach((button) => {
    button.addEventListener("click", () => {
      setFeedback(dashboardFeedback, button.dataset.actionMessage || "Acción disponible.");
    });
  });

  queryAll(".sidebar-nav a[data-view]").forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      setDashboardView(link.dataset.view);
    });
  });
}

// Conecta todo el flujo de autenticación de la interfaz.
// Incluye apertura de modal, cambio entre login y registro, validación,
// envío a Supabase, logout y recarga manual del panel de roles.
async function initAuthFlows(auth) {
  const loginForm = byId("loginForm");
  const registerForm = byId("registerForm");
  const loginMessage = byId("loginMessage");
  const registerMessage = byId("registerMessage");

  document.querySelector(".nav-login")?.addEventListener("click", (event) => {
    event.preventDefault();
    showOverlay("login-panel");
  });

  byId("back-home")?.addEventListener("click", hideOverlay);

  queryAll("[data-auth-view]").forEach((button) => {
    button.addEventListener("click", () => {
      setFeedback(loginMessage, "");
      setFeedback(registerMessage, "");
      showOverlay(button.dataset.authView);
    });
  });

  loginForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    setFeedback(loginMessage, "");

    const email = String(byId("login-email")?.value || "").trim();
    const password = String(byId("login-password")?.value || "");

    if (!email || !password) {
      setFeedback(loginMessage, "Completa correo y contraseña.", true);
      return;
    }

  const result = await auth.loginUser({ email, password });
    if (!result.success) {
      setFeedback(loginMessage, result.message || "No se pudo iniciar sesión.", true);
      return;
    }

    applyRoleAccess(result.role || "user");
    applyUserProfile(result.profile);
    showDashboardPage();

    if ((result.role || "user") === "admin") {
      await loadRolesForAdmin(auth);
    }
  });

  registerForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    setFeedback(registerMessage, "");

    const fullName = String(byId("register-name")?.value || "").trim();
    const email = String(byId("register-email")?.value || "").trim();
    const password = String(byId("register-password")?.value || "");

    console.log("[registerForm] Datos capturados", {
      fullName,
      email,
      passwordLength: password.length
    });

    if (!fullName || !email || !password) {
      console.warn("[registerForm] Validacion fallida: campos incompletos");
      setFeedback(registerMessage, "Completa todos los campos.", true);
      return;
    }

    const result = await auth.registerUser({ fullName, email, password });
    console.log("[registerForm] Resultado final registerUser", result);
    setFeedback(registerMessage, result.message || "", !result.success);

    if (!result.success) return;

    registerForm.reset();
    showOverlay("login-panel");
    const loginEmail = byId("login-email");
    if (loginEmail) loginEmail.value = email;
    setFeedback(loginMessage, "Registro completado. Ya puedes iniciar sesión.");
  });

  byId("logout-dashboard")?.addEventListener("click", async () => {
    await auth.logoutUser();
    hideDashboard();
    showOverlay("login-panel");
    setFeedback(loginMessage, "Sesión cerrada.");
  });

  byId("rolesRefreshBtn")?.addEventListener("click", async () => {
    await loadRolesForAdmin(auth);
  });
}

// Inicializa toda la aplicación en el orden correcto.
// Primero registra interacciones, luego recupera preferencias guardadas
// y por último revisa si ya existe una sesión activa para abrir dashboard.
async function initApp() {
  const auth = await import("./auth.js");
  const state = {
    fontScale: Number(localStorage.getItem(FONT_STORAGE_KEY) || 1),
    theme: localStorage.getItem(THEME_STORAGE_KEY) || "default",
  };

  bindGlobalInteractions();
  bindSectionSpy();
  bindFontControls(state);
  bindDonationForm();
  bindDashboardHelpers();
  await initAuthFlows(auth);

  state.fontScale = applyFontScale(state.fontScale);
  applyTheme(state.theme);

  const currentRole = await auth.getCurrentRole();
  if (currentRole) {
    applyRoleAccess(currentRole);
    const currentProfile = await auth.getCurrentUserProfile();
    applyUserProfile(currentProfile);
    showDashboardPage();
    if (currentRole === "admin") {
      await loadRolesForAdmin(auth);
    }
  }

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      hideOverlay();
      toggleAccessibilityPanel(false);
      closeMenu();
    }
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  loadAllFragments();
  await initApp();
});
