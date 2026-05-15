const getToken = () => localStorage.getItem('access');

const authFetch = (url, options = {}) =>
  fetch(url, {
    ...options,
    headers: {
      "Authorization": `Bearer ${getToken()}`,
      "Content-Type": "application/json",
    },
  });

const toINR  = (n)      => `₹${Number(n).toLocaleString('en-IN')}`;
const setText = (id, v) => document.getElementById(id).textContent = v;
const getField = (id)   => document.getElementById(id).value.trim();

/* ---------- LOAD CART SUMMARY ---------- */
async function loadSummary() {
  const token = getToken();
  if (!token) {
    document.getElementById('orderItems').innerHTML =
      `<p class="text-muted small">No items. <a href="/">Go back to shop</a>.</p>`;
    return;
  }

  try {
    const res      = await authFetch('/api/cart/');
    const data     = await res.json();
    const items    = data.cart_item || [];
    const subtotal = data.subtotal  || 0;

    let html = items.length
      ? items.map(item => `
          <div class="summary-item">
            <div class="d-flex justify-content-between align-items-center gap-2">
              <div class="d-flex align-items-center gap-2">
                <div class="bg-warning bg-opacity-10 rounded-3 p-2">
                  <i class="bi bi-box-seam text-warning"></i>
                </div>
                <div>
                  <div class="fw-semibold small">${item.product_name}</div>
                  <small class="text-muted">Qty: ${item.quantity}</small>
                </div>
              </div>
              <span class="badge bg-dark text-light rounded-pill px-2">COD</span>
            </div>
          </div>`).join('')
      : `<p class="text-muted small">Cart is empty. <a href="/">Shop now</a>.</p>`;

    document.getElementById('orderItems').innerHTML = html;
    setText('subtotal',   toINR(subtotal));
    setText('discount',   '—');
    setText('grandTotal', toINR(subtotal));

  } catch (e) {
    console.error(e);
  }
}

/* ---------- VALIDATION ---------- */
const FIELDS = [
  { id: 'fullName', check: v => v.trim().length >= 2 },
  { id: 'phone',    check: v => /^\d{10}$/.test(v.trim()) },
  { id: 'address',  check: v => v.trim().length >= 5 },
  { id: 'city',     check: v => v.trim().length >= 2 },
  { id: 'state',    check: v => v.trim().length >= 2 },
  { id: 'zip',      check: v => /^\d{6}$/.test(v.trim()) },
];

function validateForm() {
  let valid = true;
  FIELDS.forEach(({ id, check }) => {
    const el = document.getElementById(id);
    const ok = check(el.value);
    el.classList.toggle('is-invalid', !ok);
    el.classList.toggle('is-valid',    ok);
    if (!ok) valid = false;
  });
  return valid;
}

/* ---------- PLACE ORDER ---------- */
const BTN_DEFAULT = `<i class="bi bi-bag-check-fill me-2"></i>Place Order`;
const BTN_LOADING = `<span class="spinner-border spinner-border-sm me-2"></span>Placing Order…`;

async function placeOrder() {
  if (!validateForm()) {
    document.querySelector('.is-invalid')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }

  const btn = document.getElementById('placeOrderBtn');
  btn.disabled  = true;
  btn.innerHTML = BTN_LOADING;

  try {
    const res  = await authFetch('/api/checkout/', {
      method: "POST",
      body: JSON.stringify({
        full_name : getField('fullName'),
        phone     : getField('phone'),
        address   : getField('address'),
        city      : getField('city'),
        pincode   : getField('zip'),
      })
    });
    const data = await res.json();

    if (res.ok) {
      showSuccess(data);
      loadSummary();
    } else {
      alert(data.message || "Failed to place order ❌");
      btn.disabled  = false;
      btn.innerHTML = BTN_DEFAULT;
    }
  } catch (error) {
    console.error(error);
    alert("Something went wrong while placing order");
    btn.disabled  = false;
    btn.innerHTML = BTN_DEFAULT;
  }
}

/* ---------- SUCCESS ---------- */
function showSuccess(data) {
  const items    = data.cart_item || [];
  const subtotal = data.subtotal  || 0;

  document.getElementById('successItems').innerHTML = items.length
    ? items.map(item => `
        <div class="d-flex justify-content-between align-items-center py-1 border-bottom">
          <div>
            <div class="fw-semibold small">${item.product_name}</div>
            <small class="text-muted">Qty: ${item.quantity}</small>
          </div>
          <span class="badge bg-success-subtle text-success fw-semibold">COD</span>
        </div>`).join('')
    : `<p class="text-muted small mb-0">No item details available.</p>`;

  setText('successTotal', toINR(subtotal));

  document.getElementById('successOverlay').classList.add('show');
  ['step3', 'step4'].forEach(id => document.getElementById(id).classList.add('done'));
  ['line2', 'line3'].forEach(id => document.getElementById(id).classList.add('done'));
}

function closeOverlay() {
  document.getElementById('successOverlay').classList.remove('show');
}

/* ---------- INIT ---------- */
loadSummary();