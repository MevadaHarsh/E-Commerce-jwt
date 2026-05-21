/* ---------- AUTH ---------- */
function getToken() {
  return localStorage.getItem('access');
}

/* ---------- PAYMENT SELECTION ---------- */
let selectedPayment = 'cod';

function selectPayment(method) {
  selectedPayment = method;

  document.getElementById('opt-cod').classList.toggle('selected', method === 'cod');
  document.getElementById('opt-online').classList.toggle('selected', method === 'online');

  // Update the badge on each order item
  document.querySelectorAll('.payment-badge').forEach(badge => {
    badge.textContent = method === 'online' ? 'ONLINE' : 'COD';
    badge.className = `badge rounded-pill px-2 payment-badge ${method === 'online' ? 'bg-primary' : 'bg-dark'} text-light`;
  });

  const notice = document.getElementById('codNotice');
  if (method === 'online') {
    notice.innerHTML = `<i class="bi bi-credit-card-fill"></i>
      <span>Online Payment — you'll pay via Razorpay before order is placed.</span>`;
    notice.className = 'alert alert-info py-2 px-3 small mb-4 d-flex gap-2 align-items-center';
  } else {
    notice.innerHTML = `<i class="bi bi-info-circle-fill"></i>
      <span>Cash on Delivery selected — pay when your order arrives.</span>`;
    notice.className = 'alert alert-warning py-2 px-3 small mb-4 d-flex gap-2 align-items-center';
  }
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
              <span class="badge bg-dark text-light rounded-pill px-2 payment-badge">COD</span>
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

/* ---------- PLACE ORDER (entry point) ---------- */
async function placeOrder() {
  if (!validateForm()) {
    document.querySelector('.is-invalid')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }

  if (selectedPayment === 'online') {
    await openRazorpay();   // Razorpay collects payment → then calls submitOrder()
  } else {
    await submitOrder();    // COD → straight to API
  }
}

/* ---------- RAZORPAY FLOW ---------- */
async function openRazorpay() {
  const token = getToken();
  const totalText = document.getElementById('grandTotal').textContent.replace(/[^\d.]/g, '');
  const amountPaise = Math.round(parseFloat(totalText) * 100);

  // Step 1: Create a Razorpay order on your Django backend
  // Your backend should expose POST /api/razorpay/create-order/
  // returning { razorpay_order_id, amount, currency }
  let razorpayOrderId = null;
  try {
    const res = await fetch('/api/razorpay/create-order/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ amount: amountPaise })
    });
    const data = await res.json();
    razorpayOrderId = data.order_id;
  } catch (e) {
    // If you don't have the backend endpoint yet, proceed without order_id
    console.warn('Could not create Razorpay order on backend, proceeding without order_id:', e);
  }

  const options = {
    key: 'rzp_test_SrdDOI66t4YIf5',   // 🔑 Replace with your Razorpay Key ID
    amount: amountPaise,
    currency: 'INR',
    name: 'TechZone',
    description: 'Order Payment',
    order_id: razorpayOrderId || undefined,
    prefill: {
      name:    document.getElementById('fullName').value.trim(),
      contact: '+91' + document.getElementById('phone').value.trim(),
    },
    notes: {
      address: document.getElementById('address').value.trim(),
    },
    theme: { color: '#ffc107' },

    handler: async function (response) {

  console.log(response);

  // VERIFY + CAPTURE PAYMENT
  const verifyRes = await fetch('/payment-verify/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getToken()}`
    },
    body: JSON.stringify({
      razorpay_payment_id: response.razorpay_payment_id,
      razorpay_order_id: response.razorpay_order_id,
      razorpay_signature: response.razorpay_signature,
    })
  });

  const verifyData = await verifyRes.json();

  console.log(verifyData);

  if (verifyRes.ok) {

    // NOW PLACE ORDER
    await submitOrder({
      razorpay_payment_id: response.razorpay_payment_id,
      razorpay_order_id: response.razorpay_order_id,
      razorpay_signature: response.razorpay_signature,
    });

  } else {

    alert('Payment verification failed');

  }
},
    modal: {
      ondismiss: function () {
        const btn = document.getElementById('placeOrderBtn');
        btn.disabled = false;
        btn.innerHTML = `<i class="bi bi-bag-check-fill me-2"></i>Place Order`;
      }
    }
  };

  // Show spinner while Razorpay loads
  const btn = document.getElementById('placeOrderBtn');
  btn.disabled = true;
  btn.innerHTML = `<span class="spinner-border spinner-border-sm me-2"></span>Opening Payment…`;

  const rzp = new Razorpay(options);
  rzp.open();
}

/* ---------- SUBMIT ORDER TO DJANGO API ---------- */
async function submitOrder(razorpayData = null) {
  const btn = document.getElementById('placeOrderBtn');
  btn.disabled = true;
  btn.innerHTML = `<span class="spinner-border spinner-border-sm me-2"></span>Placing Order…`;

  const token = getToken();

  const payload = {
    full_name     : document.getElementById('fullName').value.trim(),
    phone         : document.getElementById('phone').value.trim(),
    address       : document.getElementById('address').value.trim(),
    city          : document.getElementById('city').value.trim(),
    pincode       : document.getElementById('zip').value.trim(),
    payment_method: selectedPayment,   // 'cod' or 'online'
    // Razorpay fields — only present for online payments
    ...(razorpayData || {})
  };

  try {
    const res = await fetch('/api/checkout/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    const data = await res.json();

    if (res.ok) {
      showSuccess(data);
      loadSummary();
    } else {
      alert(data.message || 'Failed to place order ❌');
      btn.disabled = false;
      btn.innerHTML = `<i class="bi bi-bag-check-fill me-2"></i>Place Order`;
    }
  } catch (error) {
    console.error(error);
    alert('Something went wrong while placing order');
    btn.disabled = false;
    btn.innerHTML = `<i class="bi bi-bag-check-fill me-2"></i>Place Order`;
  }
}

/* ---------- SUCCESS OVERLAY ---------- */
function showSuccess(data) {
  const items    = data.cart_item || [];
  const subtotal = data.subtotal  || 0;

  let itemsHtml = items.map(item => `
    <div class="d-flex justify-content-between align-items-center py-1 border-bottom">
      <div>
        <div class="fw-semibold small">${item.product_name}</div>
        <small class="text-muted">Qty: ${item.quantity}</small>
      </div>
      <span class="badge ${selectedPayment === 'online' ? 'bg-primary' : 'bg-success-subtle text-success'} fw-semibold">
        ${selectedPayment === 'online' ? 'PAID' : 'COD'}
      </span>
    </div>
  `).join('');

  if (!itemsHtml) {
    itemsHtml = `<p class="text-muted small mb-0">No item details available.</p>`;
  }

  document.getElementById('successItems').innerHTML = itemsHtml;
  document.getElementById('successTotal').textContent = `₹${Number(subtotal).toLocaleString('en-IN')}`;

  document.getElementById('successOverlay').classList.add('show');
  ['step3', 'step4'].forEach(s => document.getElementById(s).classList.add('done'));
  ['line2', 'line3'].forEach(l => document.getElementById(l).classList.add('done'));
}

function closeOverlay() {
  document.getElementById('successOverlay').classList.remove('show');
}

/* ---------- INIT ---------- */
loadSummary();