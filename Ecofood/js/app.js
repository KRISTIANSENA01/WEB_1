const layoutFragments = [
  { selector: "#header-placeholder", url: "pages/header.html", templateId: "header-template" },
  { selector: "#dashboard-placeholder", url: "pages/dashboard-panel.html" },
  { selector: "#footer-placeholder", url: "pages/footer.html", templateId: "footer-template" },
];

const authFragments = [
  { selector: "#auth-views", url: "pages/login-panel.html", templateId: "login-template", append: true },
  { selector: "#auth-views", url: "pages/register-panel.html", templateId: "register-template", append: true },
];

const applyTemplate = (templateId, container, append = false) => {
  if (!templateId || !container) return;
  const template = document.getElementById(templateId);
  if (!template) return;
  if (append) {
    container.insertAdjacentHTML("beforeend", template.innerHTML);
  } else {
    container.innerHTML = template.innerHTML;
  }
};

const loadFragment = async ({ selector, url, append, templateId }) => {
  const container = document.querySelector(selector);
  if (!container) return;
  if (!url) {
    applyTemplate(templateId, container, append);
    return;
  }
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const html = await response.text();
    if (append) {
      container.insertAdjacentHTML("beforeend", html);
    } else {
      container.innerHTML = html;
    }
  } catch {
    applyTemplate(templateId, container, append);
  }
};

const loadAllFragments = async () => {
  for (const fragment of layoutFragments) {
    await loadFragment(fragment);
  }
  const authContainer = document.querySelector("#auth-views");
  if (authContainer) {
    for (const fragment of authFragments) {
      await loadFragment(fragment);
    }
  }
};

const initApp = async () => {
  const auth = await import("./auth.js");
  const overlay = document.getElementById("auth-overlay");
  const loginPanel = document.getElementById("login-panel");
  const registerPanel = document.getElementById("register-panel");
  const dashboardPage = document.getElementById("dashboard-page");
  const loginBtn = document.querySelector(".nav-login");
  const backBtn = document.getElementById("back-home");
  const loginSubmit = document.getElementById("login-submit");
  const loginForm = document.getElementById("loginForm");
  const loginEmail = document.getElementById("login-email");
  const loginPassword = document.getElementById("login-password");
  const loginMessage = document.getElementById("loginMessage");
  const registerForm = document.getElementById("registerForm");
  const registerName = document.getElementById("register-name");
  const registerEmail = document.getElementById("register-email");
  const registerPassword = document.getElementById("register-password");
  const registerMessage = document.getElementById("registerMessage");
  const logoutBtn = document.getElementById("logout-dashboard");
  const fontButtons = document.querySelectorAll("[data-font-control]");
  const sidebarLinks = dashboardPage?.querySelectorAll(".dashboard-sidebar a");
  const adminNavItems = dashboardPage?.querySelectorAll(".admin-nav");
  const beneficiaryNavItems = dashboardPage?.querySelectorAll(".beneficiary-nav");
  const dashboardPanels = dashboardPage?.querySelectorAll(".dashboard-content");
  const rolesTableBody = document.getElementById("rolesTableBody");
  const rolesMessage = document.getElementById("rolesMessage");
  const rolesRefreshBtn = document.getElementById("rolesRefreshBtn");

  const roleConfig = {
    admin: {
      allowedViews: ["inicio", "inventario", "donantes", "beneficiarios", "roles", "reportes"],
      defaultView: "inicio",
    },
    seller: {
      allowedViews: ["inicio", "inventario", "donantes", "beneficiarios"],
      defaultView: "inicio",
    },
    user: {
      allowedViews: ["beneficiario-inicio", "beneficiario-ayudas", "beneficiario-cuenta"],
      defaultView: "beneficiario-inicio",
    },
  };

  const showView = (view) => {
    [loginPanel, registerPanel].forEach((panel) => {
      panel?.classList.toggle("active", panel.id === view);
    });
  };

  const setMessage = (el, text, isError = false) => {
    if (!el) return;
    el.textContent = text || "";
    el.style.color = isError ? "#c62828" : "#1b7f3b";
  };

  const setRolesMessage = (text, isError = false) => {
    if (!rolesMessage) return;
    rolesMessage.textContent = text || "";
    rolesMessage.style.color = isError ? "#ffd2d2" : "#d7ffd7";
  };

  const showOverlay = (view) => {
    overlay?.classList.add("active");
    document.body.classList.add("overlay-active");
    showView(view);
  };

  const hideOverlay = () => {
    overlay?.classList.remove("active");
    document.body.classList.remove("overlay-active");
  };

  const showDashboardPage = () => {
    hideOverlay();
    dashboardPage?.classList.add("active");
    document.body.classList.add("dashboard-active");
  };

  const hideDashboard = () => {
    dashboardPage?.classList.remove("active");
    document.body.classList.remove("dashboard-active");
  };

  const setDashboardView = (view) => {
    dashboardPanels?.forEach((panel) => {
      panel.classList.toggle("active", panel.dataset.view === view);
    });
    sidebarLinks?.forEach((link) => {
      link.classList.toggle("active", link.dataset.view === view);
    });
  };

  const applyRoleAccess = (role) => {
    const currentRole = roleConfig[role] ? role : "user";
    const config = roleConfig[currentRole];

    const showAdminNav = currentRole === "admin" || currentRole === "seller";
    adminNavItems?.forEach((item) => {
      item.style.display = showAdminNav ? "" : "none";
    });

    const showBeneficiaryNav = currentRole === "user";
    beneficiaryNavItems?.forEach((item) => {
      item.style.display = showBeneficiaryNav ? "" : "none";
    });

    dashboardPanels?.forEach((panel) => {
      const view = panel.dataset.view || "";
      panel.style.display = config.allowedViews.includes(view) ? "" : "none";
      panel.classList.remove("active");
    });

    setDashboardView(config.defaultView);
  };

  const renderRolesRows = (users) => {
    if (!rolesTableBody) return;
    rolesTableBody.innerHTML = "";

    users.forEach((user) => {
      const tr = document.createElement("tr");
      const shortId = String(user.id || "").slice(0, 8);
      const displayName = user.full_name || "Sin nombre";
      const currentRole = user.role || "user";

      tr.innerHTML = `
        <td>${displayName}</td>
        <td title="${user.id || ""}">${shortId}</td>
        <td>
          <select data-role-user-id="${user.id}">
            <option value="user" ${currentRole === "user" ? "selected" : ""}>user</option>
            <option value="seller" ${currentRole === "seller" ? "selected" : ""}>seller</option>
            <option value="admin" ${currentRole === "admin" ? "selected" : ""}>admin</option>
          </select>
        </td>
        <td>
          <button type="button" class="outline" data-save-role-id="${user.id}">Guardar</button>
        </td>
      `;
      rolesTableBody.appendChild(tr);
    });

    rolesTableBody.querySelectorAll("[data-save-role-id]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const userId = btn.getAttribute("data-save-role-id");
        const select = rolesTableBody.querySelector(`[data-role-user-id="${userId}"]`);
        const role = select?.value || "user";
        setRolesMessage("Guardando...");
        const result = await auth.updateRoleAsAdmin(userId, role);
        setRolesMessage(result.message || "", !result.success);
      });
    });
  };

  const loadRolesForAdmin = async () => {
    if (!rolesTableBody) return;
    setRolesMessage("Cargando usuarios...");
    const result = await auth.listProfilesForAdmin();
    if (!result.success) {
      setRolesMessage(result.message || "No se pudo cargar usuarios.", true);
      rolesTableBody.innerHTML = "";
      return;
    }
    renderRolesRows(result.users || []);
    setRolesMessage(`Usuarios cargados: ${(result.users || []).length}`);
  };

  loginBtn?.addEventListener("click", (event) => {
    event.preventDefault();
    showOverlay("login-panel");
  });

  backBtn?.addEventListener("click", () => {
    hideOverlay();
  });

  loginForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    setMessage(loginMessage, "");

    const email = String(loginEmail?.value || "").trim();
    const password = String(loginPassword?.value || "");

    if (!email || !password) {
      setMessage(loginMessage, "Completa correo y contrasena.", true);
      return;
    }

    const result = await auth.loginUser({ email, password });
    if (!result.success) {
      setMessage(loginMessage, result.message || "No se pudo iniciar sesion.", true);
      return;
    }

    applyRoleAccess(result.role || "user");
    showDashboardPage();
  });

  loginSubmit?.addEventListener("click", () => {
    loginForm?.requestSubmit();
  });

  logoutBtn?.addEventListener("click", async () => {
    await auth.logoutUser();
    hideDashboard();
    showOverlay("login-panel");
    setMessage(loginMessage, "Sesion cerrada.");
  });

  registerForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    setMessage(registerMessage, "");

    const fullName = String(registerName?.value || "").trim();
    const email = String(registerEmail?.value || "").trim();
    const password = String(registerPassword?.value || "");

    if (!fullName || !email || !password) {
      setMessage(registerMessage, "Completa todos los campos.", true);
      return;
    }

    const result = await auth.registerUser({ fullName, email, password });
    setMessage(registerMessage, result.message || "", !result.success);

    if (result.success) {
      if (loginEmail) {
        loginEmail.value = email;
      }
      registerForm.reset();
      showView("login-panel");
      setMessage(loginMessage, "Registro completado. Inicia sesion con tu correo.");
    }
  });

  document
    .querySelectorAll("[data-auth-view]")
    .forEach((button) => button.addEventListener("click", () => showView(button.dataset.authView)));

  sidebarLinks?.forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      setDashboardView(link.dataset.view);
      if (link.dataset.view === "roles") {
        void loadRolesForAdmin();
      }
    });
  });

  rolesRefreshBtn?.addEventListener("click", async () => {
    await loadRolesForAdmin();
  });

  const FONT_STEP = 0.1;
  const MIN_SCALE = 0.8;
  const MAX_SCALE = 1.3;
  let currentScale = 1;

  const setScale = (value) => {
    currentScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, value));
    document.documentElement.style.fontSize = `${16 * currentScale}px`;
  };

  fontButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const action = button.dataset.fontControl;
      if (action === "increase") {
        setScale(currentScale + FONT_STEP);
      } else if (action === "decrease") {
        setScale(currentScale - FONT_STEP);
      } else {
        setScale(1);
      }
    });
  });

  const role = await auth.getCurrentRole();
  if (role) {
    applyRoleAccess(role);
    showDashboardPage();
    if (role === "admin") {
      await loadRolesForAdmin();
    }
  }
};

document.addEventListener("DOMContentLoaded", () => {
  loadAllFragments()
    .then(() => initApp())
    .catch((error) => console.error("Error al cargar componentes:", error));
});
