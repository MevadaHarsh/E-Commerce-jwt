
// ── CONFIG ────────────────────────────────────────────────────────────────
const API_LOGIN = '/api/login/';   // POST { username, password }
// ─────────────────────────────────────────────────────────────────────────

// Toggle password visibility
document.getElementById('togglePass').addEventListener('click', function () {
    var pwd  = document.getElementById('password');
    var icon = document.getElementById('eyeIcon');
    if (pwd.type === 'password') {
    pwd.type = 'text';
    icon.className = 'bi bi-eye-slash';
    } else {
    pwd.type = 'password';
    icon.className = 'bi bi-eye';
    }
});

// Enter key submits
document.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') doLogin();
});

function showAlert(msg, type) {
    var el = document.getElementById('login-alert');
    el.className = 'alert alert-' + type + ' py-2 small d-flex align-items-center gap-2';
    var icon = type === 'danger' ? 'bi-x-circle-fill' : type === 'success' ? 'bi-check-circle-fill' : 'bi-exclamation-triangle-fill';
    el.innerHTML = '<i class="bi ' + icon + '"></i>' + msg;
    el.classList.remove('d-none');
}

function hideAlert() {
    document.getElementById('login-alert').classList.add('d-none');
}

function setLoading(loading) {
    document.getElementById('loginSpinner').classList.toggle('d-none', !loading);
    document.getElementById('loginIcon').classList.toggle('d-none', loading);
    document.getElementById('loginBtn').disabled = loading;
}

function validate() {
    var username = document.getElementById('username').value.trim();
    var password = document.getElementById('password').value;
    if (!username) return 'Please enter your username.';
    if (!password) return 'Please enter your password.';
    return null;
}

async function doLogin() {

  hideAlert();

  var error = validate();

  if (error) {
    showAlert(error, 'danger');
    return;
  }

  var username = document.getElementById('username').value.trim();
  var password = document.getElementById('password').value;

  setLoading(true);

  try {

    var res = await fetch(API_LOGIN, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: username,
        password: password
      })
    });

    var data = await res.json();

    console.log(data);

    if (res.status === 200 || res.status === 201) {

      // Save tokens
      if (data.access) {
        localStorage.setItem('access', data.access);
      }

      if (data.refresh) {
        localStorage.setItem('refresh', data.refresh);
      }

      // Save role
      if (data.role) {
        localStorage.setItem('role', data.role);
      }

      // Save user data
      if (data.user) {
        localStorage.setItem('user', JSON.stringify(data.user));
      }

      showAlert('Login successful! Redirecting...', 'success');

      setTimeout(function () {

        // Redirect by role
        if (data.role === 'Admin') {

          window.location.href = '/product-admin/';

        } else if (data.role === 'Visitor') {

          window.location.href = '/';

        } else if (data.role === 'Delivery') {

          window.location.href = '/dashboard-delivery/';

        } else {
          alert("invalid")
        }

      }, 1000);

    } else {

      showAlert(data.detail || 'Invalid credentials', 'danger');

    }

  } catch (error) {

    console.log(error);

    showAlert('Server error occurred', 'danger');

  } finally {

    setLoading(false);

  }
}