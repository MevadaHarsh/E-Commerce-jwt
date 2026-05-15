const API_SEND_OTP   = '/api/register/';
const API_VERIFY_OTP = '/api/verify/';

const $ = (id) => document.getElementById(id);

let timerInterval = null;

// ── Helpers ───────────────────────────────────────────────────────────────────

const showAlert = (id, msg, type) => {
  const el = $(id);
  el.className = `alert alert-${type} py-2 small`;
  el.textContent = msg;
  el.classList.remove('d-none');
};

const hideAlert = (id) => $(id).classList.add('d-none');

const setLoading = (spinnerId, iconId, btnId, loading) => {
  $(spinnerId).classList.toggle('d-none', !loading);
  $(iconId).classList.toggle('d-none', loading);
  $(btnId).disabled = loading;
};

const safeJson = async (res) => { try { return await res.json(); } catch { return {}; } };

const getField = (id) => $(id).value.trim();

// ── Password Toggle ───────────────────────────────────────────────────────────

$('togglePass').addEventListener('click', () => {
  const pwd = $('password');
  const hidden = pwd.type === 'password';
  pwd.type = hidden ? 'text' : 'password';
  $('eyeIcon').className = hidden ? 'bi bi-eye-slash' : 'bi bi-eye';
});

// ── OTP Inputs ────────────────────────────────────────────────────────────────

const otpInputs = document.querySelectorAll('.otp-input');

otpInputs.forEach((input, idx) => {
  input.addEventListener('input', function () {
    this.value = this.value.replace(/\D/g, '');
    if (this.value && idx < otpInputs.length - 1) otpInputs[idx + 1].focus();
  });
  input.addEventListener('keydown', function (e) {
    if (e.key === 'Backspace' && !this.value && idx > 0) otpInputs[idx - 1].focus();
  });
  input.addEventListener('paste', function (e) {
    e.preventDefault();
    const pasted = (e.clipboardData || window.clipboardData).getData('text').replace(/\D/g, '').slice(0, 6);
    otpInputs.forEach((inp, i) => inp.value = pasted[i] || '');
    if (pasted.length < 6) otpInputs[Math.min(pasted.length, 5)].focus();
  });
});

const clearOtp = () => { otpInputs.forEach(i => i.value = ''); otpInputs[0].focus(); };

// ── Timer ─────────────────────────────────────────────────────────────────────

function startTimer(seconds) {
  clearInterval(timerInterval);
  $('resendBtn').disabled = true;
  const display = $('timer');
  let remaining = seconds;

  const tick = () => {
    const m = String(Math.floor(remaining / 60)).padStart(2, '0');
    const s = String(remaining % 60).padStart(2, '0');
    display.textContent = `${m}:${s}`;
    if (remaining-- <= 0) {
      clearInterval(timerInterval);
      display.textContent = '00:00';
      $('resendBtn').disabled = false;
    }
  };

  tick();
  timerInterval = setInterval(tick, 1000);
}

// ── Steps ─────────────────────────────────────────────────────────────────────

function goToStep(n) {
  [1, 2, 3].forEach(i => $(` step${i}`).classList.toggle('d-none', i !== n));

  ['dot1', 'dot2', 'dot3'].forEach((id, i) => {
    const dot = $(id);
    dot.className = 'rounded-circle d-flex align-items-center justify-content-center fw-bold';
    dot.classList.add(
      i + 1 < n  ? 'bg-success text-white' :
      i + 1 === n ? 'bg-warning text-dark'  : 'bg-secondary text-white'
    );
  });

  $('line1').classList.toggle('border-success', n >= 2);
  $('line2').classList.toggle('border-success', n >= 3);
}

const goBack = () => { clearInterval(timerInterval); goToStep(1); };

// ── Validation ────────────────────────────────────────────────────────────────

function validateStep1() {
  if (!getField('username'))                                   return 'Please enter a username.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(getField('email'))) return 'Please enter a valid email address.';
  if ($('password').value.length < 6)                         return 'Password must be at least 6 characters.';
  if (!$('terms').checked)                                     return 'Please accept the Terms & Conditions.';
  return null;
}

// ── Send OTP ──────────────────────────────────────────────────────────────────

const getRegBody = () => JSON.stringify({
  username : getField('username'),
  email    : getField('email'),
  password : $('password').value,
});

async function sendOtp() {
  hideAlert('reg-alert');
  const error = validateStep1();
  if (error) return showAlert('reg-alert', error, 'danger');

  setLoading('sendOtpSpinner', 'sendOtpIcon', 'sendOtpBtn', true);
  try {
    const res  = await fetch(API_SEND_OTP, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: getRegBody() });
    const data = await safeJson(res);

    if (res.ok) {
      $('verifyEmail').value = getField('email');
      goToStep(2);
      startTimer(300);
    } else {
      let msg = data.message || data.detail || data.email || data.non_field_errors || 'Failed to send OTP. Please try again.';
      if (Array.isArray(msg)) msg = msg[0];
      showAlert('reg-alert', msg, 'danger');
    }
  } catch {
    showAlert('reg-alert', 'Cannot reach server. Please check your internet or server is running.', 'danger');
  } finally {
    setLoading('sendOtpSpinner', 'sendOtpIcon', 'sendOtpBtn', false);
  }
}

// ── Verify OTP ────────────────────────────────────────────────────────────────

async function verifyOtp() {
  hideAlert('otp-alert');
  const otp = Array.from(otpInputs).map(i => i.value).join('');
  if (otp.length < 6) return showAlert('otp-alert', 'Please enter the complete 6-digit OTP.', 'danger');

  setLoading('verifySpinner', 'verifyIcon', 'verifyOtpBtn', true);
  try {
    const res  = await fetch(API_VERIFY_OTP, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: getField('verifyEmail'), otp }) });
    const data = await safeJson(res);

    if (data.redirect) {
      showAlert('otp-alert', data.message, 'warning');
      setTimeout(() => window.location.href = data.redirect, 2000);
      return;
    }
    if (res.ok) { clearInterval(timerInterval); goToStep(3); return; }

    showAlert('otp-alert', data.message || data.error || 'Invalid OTP', 'danger');
    clearOtp();
  } catch {
    showAlert('otp-alert', 'Server error', 'danger');
  } finally {
    setLoading('verifySpinner', 'verifyIcon', 'verifyOtpBtn', false);
  }
}

// ── Resend OTP ────────────────────────────────────────────────────────────────

async function resendOtp() {
  hideAlert('otp-alert');
  $('resendBtn').disabled = true;
  try {
    const res  = await fetch(API_SEND_OTP, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: getRegBody() });
    const data = await safeJson(res);
    if (res.ok) {
      showAlert('otp-alert', 'A new OTP has been sent to your email.', 'success');
      clearOtp();
      startTimer(300);
    } else {
      showAlert('otp-alert', data.message || 'Could not resend OTP.', 'danger');
      $('resendBtn').disabled = false;
    }
  } catch {
    showAlert('otp-alert', 'Network error.', 'danger');
    $('resendBtn').disabled = false;
  }
}