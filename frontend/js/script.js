document.addEventListener('DOMContentLoaded', () => {
  const API_URL = 'http://localhost:5000/api';

  // If already logged in, go to dashboard
  if (localStorage.getItem('cb_token')) {
    window.location.href = 'dashboard.html';
    return;
  }

  const loginForm    = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  const alertBox     = document.getElementById('alertMsg');

  function showAlert(message, isSuccess) {
    alertBox.textContent = message;
    alertBox.className = isSuccess ? 'show success' : 'show error';
    alertBox.style.display = 'block';
  }

  // Login
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email    = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const btn = document.getElementById('loginSubmit');
    btn.textContent = 'Signing in...'; btn.disabled = true;
    try {
      const res = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('cb_token', data.token);
        localStorage.setItem('cb_user', JSON.stringify({ ...data.user, id: data.user.id || data.user._id }));
        showAlert('Login successful! Redirecting...', true);
        setTimeout(() => { window.location.href = 'dashboard.html'; }, 800);
      } else {
        showAlert(data.message, false);
        btn.textContent = 'Sign In to CampusBridge →'; btn.disabled = false;
      }
    } catch {
      showAlert('Could not connect to server. Is the backend running?', false);
      btn.textContent = 'Sign In to CampusBridge →'; btn.disabled = false;
    }
  });

  // Register
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fullName = document.getElementById('regFullName').value;
    const role     = document.getElementById('regRole').value;
    const email    = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;
    const btn = document.getElementById('registerSubmit');
    btn.textContent = 'Creating account...'; btn.disabled = true;
    try {
      const res = await fetch(`${API_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, role, email, password }),
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('cb_token', data.token);
        localStorage.setItem('cb_user', JSON.stringify({ ...data.user, id: data.user.id || data.user._id }));
        showAlert('Account created! Redirecting...', true);
        setTimeout(() => { window.location.href = 'dashboard.html'; }, 800);
      } else {
        showAlert(data.message, false);
        btn.textContent = 'Create My Account →'; btn.disabled = false;
      }
    } catch {
      showAlert('Could not connect to server.', false);
      btn.textContent = 'Create My Account →'; btn.disabled = false;
    }
  });

  // Password toggles
  const eyeOpen = '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>';
  const eyeOff  = '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>';
  function setupToggle(btnId, inputId, iconId) {
    const btn = document.getElementById(btnId);
    if (!btn) return;
    btn.addEventListener('click', () => {
      const inp = document.getElementById(inputId);
      const icon = document.getElementById(iconId);
      const isPass = inp.type === 'password';
      inp.type = isPass ? 'text' : 'password';
      icon.innerHTML = isPass ? eyeOff : eyeOpen;
    });
  }
  setupToggle('toggleLoginPass', 'loginPassword', 'loginEyeIcon');
  setupToggle('toggleRegPass',   'regPassword',   'regEyeIcon');

  // Tab switching
  const tabLogin    = document.getElementById('tabLogin');
  const tabRegister = document.getElementById('tabRegister');
  function switchTab(view) {
    alertBox.className = ''; alertBox.style.display = 'none';
    if (view === 'login') {
      tabLogin.classList.add('active'); tabRegister.classList.remove('active');
      loginForm.classList.add('active'); registerForm.classList.remove('active');
    } else {
      tabRegister.classList.add('active'); tabLogin.classList.remove('active');
      registerForm.classList.add('active'); loginForm.classList.remove('active');
    }
  }
  tabLogin.addEventListener('click', () => switchTab('login'));
  tabRegister.addEventListener('click', () => switchTab('register'));
  document.getElementById('showRegisterBtn').addEventListener('click', () => switchTab('register'));
  document.getElementById('showLoginBtn').addEventListener('click', () => switchTab('login'));
});