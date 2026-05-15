const API_LOGIN = '/api/login/';

const ROLE_ROUTES = {
  Admin    : '/product-admin/',
  Visitor  : '/',
  Delivery : '/dashboard-delivery/',
};

const ALERT_ICONS = {
  danger  : 'bi-x-circle-fill',
  success : 'bi-check-circle-fill',
  warning : 'bi-exclamation-triangle-fill',
};

const $ = (id) => document.getElementById(id);

// ── UI Helpers ────────────────────────────────────────────────────────────────

function showAlert(msg, type) {
  const el = $('login-alert');
  el.className = `alert alert-${type} py-2 small d-flex align-items-center gap-2`;
  el.innerHTML = `<i class="bi ${ALERT_ICONS[type]}"></i>${msg}`;
  el.classList.remove('d-none');
}

const hideAlert = () => $('login-alert').classList.add('d-none');

function setLoading(loading) {
  $('loginSpinner').classList.toggle('d-none', !loading);
  $('loginIcon').classList.toggle('d-none', loading);
  $('loginBtn').disabled = loading;
}

// ── Events ────────────────────────────────────────────────────────────────────

$('togglePass').addEventListener('click', () => {
  const pwd = $('password');
  const isHidden = pwd.type === 'password';
  pwd.type = isHidden ? 'text' : 'password';
  $('eyeIcon').className = isHidden ? 'bi bi-eye-slash' : 'bi bi-eye';
});

document.addEventListener('keydown', (e) => e.key === 'Enter' && doLogin());

// ── Login ─────────────────────────────────────────────────────────────────────

function validate() {
  if (!$('username').value.trim()) return 'Please enter your username.';
  if (!$('password').value)        return 'Please enter your password.';
  return null;
}

async function doLogin() {
  hideAlert();

  const error = validate();
  if (error) return showAlert(error, 'danger');

  setLoading(true);

  try {
    const res  = await fetch(API_LOGIN, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: $('username').value.trim(),
        password: $('password').value,
      })
    });

    const data = await res.json();

    if (res.ok) {
      ['access', 'refresh', 'role'].forEach(k => data[k] && localStorage.setItem(k, data[k]));
      if (data.user) localStorage.setItem('user', JSON.stringify(data.user));

      showAlert('Login successful! Redirecting...', 'success');
      setTimeout(() => {
        window.location.href = ROLE_ROUTES[data.role] ?? '/';
      }, 1000);

    } else {
      showAlert(data.detail || 'Invalid credentials', 'danger');
    }

  } catch {
    showAlert('Server error occurred', 'danger');
  } finally {
    setLoading(false);
  }
}