/* ---------- AUTH ---------- */
function getToken() {
  return localStorage.getItem('access');
}

/* ---------- LOAD CART SUMMARY ---------- */
async function loadSummary() {
  const token = getToken();
  if (!token) {
    document.getElementById('orderItems').innerHTML =
      `<p class="text-muted small">No items. <a href="/">Go back to shop</a>.</p>`;
    return;
  }

  try {
    const res = await fetch('/api/cart/', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();

    // API shape: { message, cart_item: [...], subtotal }
    const items    = data.cart_item || [];
    const subtotal = data.subtotal  || 0;

    let html = '';

    if (!items.length) {
      html = `<p class="text-muted small">Cart is empty. <a href="/">Shop now</a>.</p>`;
    } else {
      items.forEach(item => {
        html += `
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
          </div>`;
      });
    }

    document.getElementById('orderItems').innerHTML = html;
    document.getElementById('subtotal').textContent   = `₹${Number(subtotal).toLocaleString('en-IN')}`;
    document.getElementById('discount').textContent   = '—';
    document.getElementById('grandTotal').textContent = `₹${Number(subtotal).toLocaleString('en-IN')}`;

  } catch (e) {
    console.error(e);
  }
}

/* ---------- VALIDATION ---------- */
function validateForm() {
  let valid = true;

  const fields = [
    { id: 'fullName', check: v => v.trim().length >= 2 },
    { id: 'phone',    check: v => /^\d{10}$/.test(v.trim()) },
    { id: 'address',  check: v => v.trim().length >= 5 },
    { id: 'city',     check: v => v.trim().length >= 2 },
    { id: 'state',    check: v => v.trim().length >= 2 },
    { id: 'zip',      check: v => /^\d{6}$/.test(v.trim()) },
  ];

  fields.forEach(f => {
    const el = document.getElementById(f.id);
    const ok = f.check(el.value);
    el.classList.toggle('is-invalid', !ok);
    el.classList.toggle('is-valid',    ok);
    if (!ok) valid = false;
  });

  return valid;
}

/* ---------- PLACE ORDER ---------- */
async function placeOrder() {
  if (!validateForm()) {
    document.querySelector('.is-invalid')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }

  const btn = document.getElementById('placeOrderBtn');
  btn.disabled = true;
  btn.innerHTML = `<span class="spinner-border spinner-border-sm me-2"></span>Placing Order…`;

  const token = getToken();

  try {
    const res = await fetch('/api/checkout/', {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        full_name : document.getElementById('fullName').value.trim(),
        phone     : document.getElementById('phone').value.trim(),
        address   : document.getElementById('address').value.trim(),
        city      : document.getElementById('city').value.trim(),
        pincode   : document.getElementById('zip').value.trim(),
      })
    });
    const data = await res.json();
    if (res.ok) {
      showSuccess(data);
      loadSummary();
    } else {
      alert(data.message || "Failed to place order ❌");
      btn.disabled = false;
      btn.innerHTML = `<i class="bi bi-bag-check-fill me-2"></i>Place Order`;
    }
  } catch (error) {
    console.error(error);
    alert("Something went wrong while placing order");
    btn.disabled = false;
    btn.innerHTML = `<i class="bi bi-bag-check-fill me-2"></i>Place Order`;
  }
}

/* ---------- SUCCESS ---------- */
function showSuccess(data) {
  // Render ordered items from API response
  const items = data.cart_item || [];
  const subtotal = data.subtotal || 0;

  let itemsHtml = items.map(item => `
    <div class="d-flex justify-content-between align-items-center py-1 border-bottom">
      <div>
        <div class="fw-semibold small">${item.product_name}</div>
        <small class="text-muted">Qty: ${item.quantity}</small>
      </div>
      <span class="badge bg-success-subtle text-success fw-semibold">COD</span>
    </div>
  `).join('');

  if (!itemsHtml) {
    itemsHtml = `<p class="text-muted small mb-0">No item details available.</p>`;
  }

  document.getElementById('successItems').innerHTML = itemsHtml;
  document.getElementById('successTotal').textContent = `₹${Number(subtotal).toLocaleString('en-IN')}`;

  document.getElementById('successOverlay').classList.add('show');
  ['step3','step4'].forEach(s => document.getElementById(s).classList.add('done'));
  ['line2','line3'].forEach(l => document.getElementById(l).classList.add('done'));
}

function closeOverlay() {
  document.getElementById('successOverlay').classList.remove('show');
}

/* ---------- INIT ---------- */
loadSummary();