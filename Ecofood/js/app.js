document.addEventListener("DOMContentLoaded", () => {
  const overlay = document.getElementById("auth-overlay");
  const loginPanel = document.getElementById("login-panel");
  const registerPanel = document.getElementById("register-panel");
  const dashboardPanel = document.getElementById("dashboard-panel");
  const loginBtn = document.querySelector(".nav-login");
  const backBtn = document.getElementById("back-home");
  const loginSubmit = document.getElementById("login-submit");
  const logoutBtn = document.getElementById("logout-dashboard");
  const fontButtons = document.querySelectorAll("[data-font-control]");

  const showView = (view) => {
    [loginPanel, registerPanel, dashboardPanel].forEach((panel) => {
      panel.classList.toggle("active", panel.id === view);
    });
  };

  const showOverlay = (view) => {
    overlay.classList.add("active");
    showView(view);
  };

  const hideOverlay = () => {
    overlay.classList.remove("active");
  };

  loginBtn?.addEventListener("click", (event) => {
    event.preventDefault();
    showOverlay("login-panel");
  });

  backBtn?.addEventListener("click", () => {
    hideOverlay();
  });

  loginSubmit?.addEventListener("click", () => {
    showView("dashboard-panel");
  });

  logoutBtn?.addEventListener("click", () => {
    showView("login-panel");
    hideOverlay();
  });

  document
    .querySelectorAll("[data-view]")
    .forEach((button) =>
      button.addEventListener("click", () => showView(`${button.dataset.view}-panel`))
    );

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
});
