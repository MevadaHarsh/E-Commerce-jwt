const PROFILE_API = '/api/user/';
const ORDERS_API  = '/api/DeliveryPartner/';
const DELIVER_API = '/api/Order-status/';

let orders              = [];
let cancelTargetId      = null;
let cancelModalInstance = null;

// ── Helpers ───────────────────────────────────────────────────────────────────

const apiHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${localStorage.getItem('access')}`
});

const apiFetch = (url, options = {}) =>
  fetch(url, { ...options, headers: apiHeaders() });

const show = (id) => document.getElementById(id).classList.remove('d-none');
const hide = (id) => document.getElementById(id).classList.add('d-none');

// ── Auth / Access ─────────────────────────────────────────────────────────────

async function checkDeliveryAccess() {
  try {
    const res  = await apiFetch(PROFILE_API);
    const user = await res.json();
    user.role === 'Delivery'
      ? (show('dashboardBox'), fetchOrders())
      : show('pendingBox');
  } catch (err) {
    console.error(err);
    alert('Failed to load profile');
  }
}

// ── Orders ────────────────────────────────────────────────────────────────────

async function fetchOrders() {
  try {
    const res         = await apiFetch(ORDERS_API);
    const data        = await res.json();
    const partnerData = Array.isArray(data) ? data[0] : data;

    if (!partnerData) return console.warn('Empty response from API');

    orders = partnerData.checkout_list || [];
    showPartnerInfo(partnerData);
    renderOrders();
  } catch (err) {
    console.error(err);
    alert('Failed to fetch orders');
  }
}

// ── Partner Info ──────────────────────────────────────────────────────────────

function showPartnerInfo(p) {
  const initials = (p.username || 'Partner').slice(0, 2).toUpperCase();

  document.getElementById('partnerAvatar').innerText   = initials;
  document.getElementById('partnerUsername').innerText = p.username || 'Partner';
  document.getElementById('partnerAvailBadge').innerHTML =
    `<span class="badge ${p.is_available ? 'bg-success' : 'bg-secondary'}" style="font-size:.65rem;">
       <i class="bi bi-circle-fill me-1" style="font-size:.4rem;vertical-align:middle;"></i>
       ${p.is_available ? 'Available' : 'Unavailable'}
     </span>`;
  show('partnerInfo');
}

// ── Render Orders ─────────────────────────────────────────────────────────────

const statusBadge = (status) => {
  const cls = status === 'Delivered' ? 'bg-success'
            : status === 'Cancelled' ? 'bg-danger'
            : 'bg-warning text-dark';
  return `<span class="badge ${cls}">${status}</span>`;
};

const orderActions = (o) =>
  (o.status === 'Delivered' || o.status === 'Cancelled')
    ? `<span class="text-muted">—</span>`
    : `<div class="d-flex gap-2">
         <button class="btn btn-sm btn-success" onclick="markDelivered(${o.id})">
           <i class="bi bi-check-circle me-1"></i>Delivered
         </button>
         <button class="btn btn-sm btn-outline-danger" onclick="openCancelModal(${o.id})">
           <i class="bi bi-x-circle me-1"></i>Cancel
         </button>
       </div>`;

function renderOrders() {
  const countOf = (status) => orders.filter(o => o.status === status).length;

  document.getElementById('totalOrders').innerText     = orders.length;
  document.getElementById('pendingOrders').innerText   = countOf('Pending');
  document.getElementById('deliveredOrders').innerText = countOf('Delivered');
  document.getElementById('cancelledOrders').innerText = countOf('Cancelled');

  const tbody = document.getElementById('orderTableBody');

  if (!orders.length) {
    tbody.innerHTML = `<tr><td colspan="10" class="text-center py-4 text-muted">No orders available</td></tr>`;
    return;
  }

  tbody.innerHTML = orders.map((o, i) => `
    <tr>
      <td>${i + 1}</td>
      <td><span class="badge bg-secondary">#${o.id}</span></td>
      <td class="fw-semibold">${o.full_name || '-'}</td>
      <td>${o.phone || '-'}</td>
      <td>${o.address || '-'}</td>
      <td>
        <div>${o.city || '-'}</div>
        <small class="text-muted">${o.pincode || ''}</small>
      </td>
      <td class="fw-semibold">₹${o.total_price || 0}</td>
      <td><span class="badge bg-dark"><i class="bi bi-person-badge me-1"></i>${o.partner_name || '-'}</span></td>
      <td>${statusBadge(o.status)}</td>
      <td>${orderActions(o)}</td>
    </tr>`).join('');
}

// ── Status Updates ────────────────────────────────────────────────────────────

async function updateOrderStatus(id, body) {
  try {
    const res = await apiFetch(`${DELIVER_API}${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(body)
    });
    res.ok ? fetchOrders() : alert('Failed to update order');
  } catch (err) {
    console.error(err);
    alert('Something went wrong');
  }
}

async function markDelivered(id) {
  if (!confirm('Mark this order as Delivered?')) return;
  updateOrderStatus(id, { status: 'Delivered' });
}

// ── Cancel Modal ──────────────────────────────────────────────────────────────

function openCancelModal(id) {
  cancelTargetId = id;
  document.getElementById('cancelReason').value = '';
  hide('cancelReasonError');
  cancelModalInstance = new bootstrap.Modal(document.getElementById('cancelModal'));
  cancelModalInstance.show();
}

async function confirmCancel() {
  const reason = document.getElementById('cancelReason').value.trim();
  if (!reason) return show('cancelReasonError');
  hide('cancelReasonError');

  await updateOrderStatus(cancelTargetId, { status: 'Cancelled', cancel_reason: reason });
  cancelModalInstance.hide();
}

// ── Logout ────────────────────────────────────────────────────────────────────

function logout() {
  ['access', 'refresh'].forEach(k => localStorage.removeItem(k));
  window.location.href = '/login/';
}

// ── Init ──────────────────────────────────────────────────────────────────────

checkDeliveryAccess();