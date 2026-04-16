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
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const html = await response.text();
    if (append) {
      container.insertAdjacentHTML("beforeend", html);
    } else {
      container.innerHTML = html;
    }
  } catch (error) {
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

const initApp = () => {
  const overlay = document.getElementById("auth-overlay");
  const loginPanel = document.getElementById("login-panel");
  const registerPanel = document.getElementById("register-panel");
  const dashboardPage = document.getElementById("dashboard-page");
  const loginBtn = document.querySelector(".nav-login");
  const backBtn = document.getElementById("back-home");
  const loginSubmit = document.getElementById("login-submit");
  const logoutBtn = document.getElementById("logout-dashboard");
  const fontButtons = document.querySelectorAll("[data-font-control]");
  const sidebarLinks = dashboardPage?.querySelectorAll(".dashboard-sidebar a");
  const dashboardPanels = dashboardPage?.querySelectorAll(".dashboard-content");

  const showView = (view) => {
    [loginPanel, registerPanel].forEach((panel) => {
      panel?.classList.toggle("active", panel.id === view);
    });
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

  loginBtn?.addEventListener("click", (event) => {
    event.preventDefault();
    showOverlay("login-panel");
  });

  backBtn?.addEventListener("click", () => {
    hideOverlay();
  });

  loginSubmit?.addEventListener("click", () => {
    showDashboardPage();
    setDashboardView("inicio");
  });

  logoutBtn?.addEventListener("click", () => {
    hideDashboard();
    showOverlay("login-panel");
  });

  document
    .querySelectorAll("[data-auth-view]")
    .forEach((button) => button.addEventListener("click", () => showView(button.dataset.authView)));

  const setDashboardView = (view) => {
    dashboardPanels?.forEach((panel) => {
      panel.classList.toggle("active", panel.dataset.view === view);
    });
    sidebarLinks?.forEach((link) => {
      link.classList.toggle("active", link.dataset.view === view);
    });
  };

  sidebarLinks?.forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      setDashboardView(link.dataset.view);
    });
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
};

document.addEventListener("DOMContentLoaded", () => {
  loadAllFragments()
    .then(() => initApp())
    .catch((error) => console.error("Error al cargar componentes:", error));
});
