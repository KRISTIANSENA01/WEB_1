const loadSection = async (selector, path) => {
  const response = await fetch(path);
  const container = document.querySelector(selector);
  if (container && response.ok) {
    container.innerHTML = await response.text();
  }
};

const initApp = () => {
  const loginLink = document.querySelector('.nav-login');
  const loginSection = document.getElementById('login');
  const homeContent = document.getElementById('home-content');
  const backButton = document.getElementById('back-home');
  const switchButtons = document.querySelectorAll('.login__switch');
  const registerPanel = document.getElementById('register-panel');
  const loginPanel = document.getElementById('login-panel');
  const loginSubmit = document.querySelector('.login__submit');
  const dashboard = document.getElementById('dashboard');
  const logoutButton = document.getElementById('logout-dashboard');
  const sidebarLinks = document.querySelectorAll('.dashboard__sidebar a');
  const dashboardPanels = document.querySelectorAll('[data-dashboard-view]');

  const showPanel = (panel) => {
    if (panel === 'register') {
      registerPanel.classList.add('active');
      loginPanel.classList.remove('active');
    } else {
      registerPanel.classList.remove('active');
      loginPanel.classList.add('active');
    }
  };

  const activateDashboardView = (view) => {
    dashboardPanels.forEach((panel) => {
      panel.classList.toggle('active', panel.dataset.dashboardView === view);
    });
    sidebarLinks.forEach((link) => {
      link.classList.toggle('active', link.dataset.view === view);
    });
  };

  const showLogin = () => {
    loginSection.classList.add('active');
    loginSection.classList.remove('dashboard-active');
    dashboard.classList.remove('active');
    homeContent.classList.add('hidden');
    document.body.classList.add('login-active');
    showPanel('login');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const exitLogin = () => {
    loginSection.classList.remove('active', 'dashboard-active');
    dashboard.classList.remove('active');
    homeContent.classList.remove('hidden');
    document.body.classList.remove('login-active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const showDashboard = () => {
    loginSection.classList.add('active', 'dashboard-active');
    dashboard.classList.add('active');
    document.body.classList.add('login-active');
    showPanel('login');
    activateDashboardView('inicio');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  loginLink.addEventListener('click', (event) => {
    event.preventDefault();
    showLogin();
  });

  backButton.addEventListener('click', exitLogin);
  logoutButton.addEventListener('click', exitLogin);

  loginSubmit.addEventListener('click', (event) => {
    event.preventDefault();
    showDashboard();
  });

  switchButtons.forEach((button) => {
    button.addEventListener('click', () => {
      showPanel(button.dataset.view);
    });
  });

  sidebarLinks.forEach((link) => {
    link.addEventListener('click', (event) => {
      event.preventDefault();
      const view = link.dataset.view;
      activateDashboardView(view);
    });
  });

  activateDashboardView('inicio');
};

const loadApp = async () => {
  await Promise.all([
    loadSection('#header-placeholder', 'pages/header.html'),
    loadSection('#login-placeholder', 'pages/login.html'),
    loadSection('#home-content', 'pages/home.html'),
    loadSection('#footer-placeholder', 'pages/footer.html'),
  ]);
  initApp();
};

loadApp();
