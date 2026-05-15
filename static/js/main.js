
// ── CONFIG ────────────────────────────────────────────────────────────────

const API_SEND_OTP   = '/api/register/';    // POST { username, email, password }
const API_VERIFY_OTP = '/api/verify/';  // POST { email, otp }

// ─────────────────────────────────────────────────────────────────────────

var timerInterval = null;

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

// OTP box auto-advance + paste support
document.querySelectorAll('.otp-input').forEach(function (input, idx, inputs) {
    input.addEventListener('input', function () {
    this.value = this.value.replace(/\D/g, '');
    if (this.value && idx < inputs.length - 1) inputs[idx + 1].focus();
    });
    input.addEventListener('keydown', function (e) {
    if (e.key === 'Backspace' && !this.value && idx > 0) inputs[idx - 1].focus();
    });
    input.addEventListener('paste', function (e) {
    e.preventDefault();
    var pasted = (e.clipboardData || window.clipboardData).getData('text').replace(/\D/g, '').slice(0, 6);
    inputs.forEach(function (inp, i) { inp.value = pasted[i] || ''; });
    if (pasted.length < 6) inputs[Math.min(pasted.length, 5)].focus();
    });
});

function validateStep1() {
    var username = document.getElementById('username').value.trim();
    var email    = document.getElementById('email').value.trim();
    var password = document.getElementById('password').value;
    var terms    = document.getElementById('terms').checked;
    if (!username)                                          return 'Please enter a username.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))        return 'Please enter a valid email address.';
    if (password.length < 6)                               return 'Password must be at least 6 characters.';
    if (!terms)                                            return 'Please accept the Terms & Conditions.';
    return null;
}

function showAlert(id, msg, type) {
    var el = document.getElementById(id);
    el.className = 'alert alert-' + type + ' py-2 small';
    el.textContent = msg;
    el.classList.remove('d-none');
}
function hideAlert(id) { document.getElementById(id).classList.add('d-none'); }

function setLoading(spinnerId, iconId, btnId, loading) {
    document.getElementById(spinnerId).classList.toggle('d-none', !loading);
    document.getElementById(iconId).classList.toggle('d-none', loading);
    document.getElementById(btnId).disabled = loading;
}

function startTimer(seconds) {
    clearInterval(timerInterval);
    document.getElementById('resendBtn').disabled = true;
    var display = document.getElementById('timer');
    var remaining = seconds;
    function tick() {
    var m = String(Math.floor(remaining / 60)).padStart(2, '0');
    var s = String(remaining % 60).padStart(2, '0');
    display.textContent = m + ':' + s;
    if (remaining <= 0) {
        clearInterval(timerInterval);
        display.textContent = '00:00';
        document.getElementById('resendBtn').disabled = false;
    }
    remaining--;
    }
    tick();
    timerInterval = setInterval(tick, 1000);
}

function goToStep(n) {
    [1, 2, 3].forEach(function (i) {
    document.getElementById('step' + i).classList.add('d-none');
    });
    document.getElementById('step' + n).classList.remove('d-none');

    var dots   = ['dot1','dot2','dot3'];
    var labels = ['label2','label3'];
    dots.forEach(function (id, i) {
    var dot = document.getElementById(id);
    dot.className = 'rounded-circle d-flex align-items-center justify-content-center fw-bold';
    if (i + 1 < n)      dot.classList.add('bg-success','text-white');
    else if (i + 1 === n) dot.classList.add('bg-warning','text-dark');
    else                 dot.classList.add('bg-secondary','text-white');
    });
    if (n >= 2) document.getElementById('line1').classList.add('border-success');
    else        document.getElementById('line1').classList.remove('border-success');
    if (n >= 3) document.getElementById('line2').classList.add('border-success');
    else        document.getElementById('line2').classList.remove('border-success');
}

function goBack() {
    clearInterval(timerInterval);
    goToStep(1);
}

async function sendOtp() {
    hideAlert('reg-alert');
    var error = validateStep1();
    if (error) { showAlert('reg-alert', error, 'danger'); return; }

    var username = document.getElementById('username').value.trim();
    var email    = document.getElementById('email').value.trim();
    var password = document.getElementById('password').value;

    setLoading('sendOtpSpinner', 'sendOtpIcon', 'sendOtpBtn', true);
    try {
    var res = await fetch(API_SEND_OTP, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username, email: email, password: password })
    });

    // Try to parse JSON but don't crash if it fails
    var data = {};
    try { data = await res.json(); } catch(e) {}

    if (res.ok || res.status === 200 || res.status === 201) {
        // Success — move to OTP screen
        document.getElementById('verifyEmail').value = email;
        goToStep(2);
        startTimer(300);
    } else {
        // Server returned an error (400, 409, etc.)
        var msg = data.message || data.detail || data.email || data.non_field_errors || 'Failed to send OTP. Please try again.';
        if (Array.isArray(msg)) msg = msg[0];
        showAlert('reg-alert', msg, 'danger');
    }
    } catch (err) {
    // Only a true network failure reaches here (no internet, server down, CORS preflight blocked)
    showAlert('reg-alert', 'Cannot reach server. Please check your internet or server is running.', 'danger');
    console.error('sendOtp error:', err);
    } finally {
    setLoading('sendOtpSpinner', 'sendOtpIcon', 'sendOtpBtn', false);
    }
}


async function verifyOtp() {

hideAlert('otp-alert');

var inputs = document.querySelectorAll('.otp-input');

var otp = Array.from(inputs)
.map(function (i) { return i.value; })
.join('');

if (otp.length < 6) {

showAlert(
    'otp-alert',
    'Please enter the complete 6-digit OTP.',
    'danger'
);

return;
}

var email = document.getElementById('verifyEmail').value.trim();

setLoading(
'verifySpinner',
'verifyIcon',
'verifyOtpBtn',
true
);

try {

var res = await fetch(API_VERIFY_OTP, {
    method: 'POST',
    headers: {
    'Content-Type': 'application/json'
    },
    body: JSON.stringify({
    email: email,
    otp: otp
    })
});

var data = {};

try {
    data = await res.json();
} catch(e) {}

console.log(data);

// ---------------- OTP EXPIRED ----------------

if (data.redirect) {

    showAlert(
    'otp-alert',
    data.message,
    'warning'
    );

    setTimeout(() => {
    window.location.href = data.redirect;
    }, 2000);

    return;
}

// ---------------- SUCCESS ----------------

if (res.status === 200) {

    clearInterval(timerInterval);

    goToStep(3);

    return;
}

// ---------------- INVALID OTP ----------------

showAlert(
    'otp-alert',
    data.message || data.error || 'Invalid OTP',
    'danger'
);

inputs.forEach(function(i) {
    i.value = '';
});

inputs[0].focus();

} catch(err) {

console.log(err);

showAlert(
    'otp-alert',
    'Server error',
    'danger'
);

} finally {

setLoading(
    'verifySpinner',
    'verifyIcon',
    'verifyOtpBtn',
    false
);
}
}



async function resendOtp() {
    hideAlert('otp-alert');
    var email    = document.getElementById('email').value.trim();
    var username = document.getElementById('username').value.trim();
    var password = document.getElementById('password').value;
    document.getElementById('resendBtn').disabled = true;
    try {
    var res  = await fetch(API_SEND_OTP, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username, email: email, password: password })
    });
    var data = await res.json();
    if (res.ok) {
        showAlert('otp-alert', 'A new OTP has been sent to your email.', 'success');
        document.querySelectorAll('.otp-input').forEach(function (i) { i.value = ''; });
        document.querySelectorAll('.otp-input')[0].focus();
        startTimer(300);
    } else {
        showAlert('otp-alert', data.message || 'Could not resend OTP.', 'danger');
        document.getElementById('resendBtn').disabled = false;
    }
    } catch (err) {
    showAlert('otp-alert', 'Network error.', 'danger');
    document.getElementById('resendBtn').disabled = false;
    }
}
