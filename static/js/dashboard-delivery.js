const PROFILE_API = '/api/user/';
const ORDERS_API  = '/api/DeliveryPartner/';
const DELIVER_API = '/api/Order-status/';

let orders = [];
let cancelTargetId      = null;
let cancelModalInstance = null;

/* ---------- AUTH ---------- */
function apiHeaders() {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('access')}`
  };
}

/* ---------- CHECK ROLE ---------- */
async function checkDeliveryAccess() {
  try {
    const res  = await fetch(PROFILE_API, { headers: apiHeaders() });
    const user = await res.json();
    if (user.role === 'Delivery') {
      document.getElementById('dashboardBox').classList.remove('d-none');
      fetchOrders();
    } else {
      document.getElementById('pendingBox').classList.remove('d-none');
    }
  } catch (err) {
    console.error(err);
    alert('Failed to load profile');
  }
}

async function fetchOrders() {
  try {

    const res  = await fetch(ORDERS_API, {
      headers: apiHeaders()
    });

    const data = await res.json();

    console.log(data);

    // API directly returns orders array
    orders = Array.isArray(data) ? data : [];

    // show partner info using first order
    if (orders.length > 0) {

      const firstOrder = orders[0];

      showPartnerInfo({
        username: firstOrder.partner_name,
        is_available: firstOrder.is_available === "True"
      });
    }

    renderOrders();

  } catch (err) {
    console.error(err);
    alert('Failed to fetch orders');
  }
}

/* ---------- SHOW PARTNER INFO IN NAVBAR ---------- */
function showPartnerInfo(partnerData) {
  const username    = partnerData.username    || 'Partner';
  const isAvailable = partnerData.is_available;
  const initials    = username.slice(0, 2).toUpperCase();

  document.getElementById('partnerAvatar').innerText   = initials;
  document.getElementById('partnerUsername').innerText = username;
  document.getElementById('partnerAvailBadge').innerHTML =
    `<span class="badge ${isAvailable ? 'bg-success' : 'bg-secondary'}" style="font-size:.65rem;">
       <i class="bi bi-circle-fill me-1" style="font-size:.4rem;vertical-align:middle;"></i>
       ${isAvailable ? 'Available' : 'Unavailable'}
     </span>`;
  document.getElementById('partnerInfo').classList.remove('d-none');
}

/* ---------- RENDER ORDERS ---------- */
function renderOrders() {
  document.getElementById('totalOrders').innerText     = orders.length;
  document.getElementById('pendingOrders').innerText   = orders.filter(o => o.status === 'Pending').length;
  document.getElementById('deliveredOrders').innerText = orders.filter(o => o.status === 'Delivered').length;
  document.getElementById('cancelledOrders').innerText = orders.filter(o => o.status === 'Cancelled').length;

  const tbody = document.getElementById('orderTableBody');

  if (!orders.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="10" class="text-center py-4 text-muted">No orders available</td>
      </tr>`;
    return;
  }

  tbody.innerHTML = orders.map((o, i) => {

    let badgeClass = 'bg-warning text-dark';
    if (o.status === 'Delivered') badgeClass = 'bg-success';
    if (o.status === 'Cancelled') badgeClass = 'bg-danger';

    const isDone  = o.status === 'Delivered' || o.status === 'Cancelled';
    const actions = isDone
      ? `<span class="text-muted">—</span>`
      : `<div class="d-flex gap-2">
           <button class="btn btn-sm btn-success" onclick="markDelivered(${o.id})">
             <i class="bi bi-check-circle me-1"></i>Delivered
           </button>
           <button class="btn btn-sm btn-outline-danger" onclick="openCancelModal(${o.id})">
             <i class="bi bi-x-circle me-1"></i>Cancel
           </button>
         </div>`;

    return `
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
        <td>
          <span class="badge bg-dark">
            <i class="bi bi-person-badge me-1"></i>${o.partner_name || '-'}
          </span>
        </td>
        <td><span class="badge ${badgeClass}">${o.status}</span></td>
        <td>${actions}</td>
      </tr>`;
  }).join('');
}

/* ---------- MARK DELIVERED ---------- */
async function markDelivered(id) {
  if (!confirm('Mark this order as Delivered?')) return;
  try {
    const res = await fetch(DELIVER_API + id + '/', {
      method: 'PATCH',
      headers: apiHeaders(),
      body: JSON.stringify({ status: 'Delivered' })
    });
    res.ok ? fetchOrders() : alert('Failed to update order');
  } catch (err) {
    console.error(err);
    alert('Something went wrong');
  }
}

/* ---------- OPEN CANCEL MODAL ---------- */
function openCancelModal(id) {
  cancelTargetId = id;
  document.getElementById('cancelReason').value = '';
  document.getElementById('cancelReasonError').classList.add('d-none');
  cancelModalInstance = new bootstrap.Modal(document.getElementById('cancelModal'));
  cancelModalInstance.show();
}

/* ---------- CONFIRM CANCEL ---------- */
async function confirmCancel() {
  const reason = document.getElementById('cancelReason').value.trim();
  if (!reason) {
    document.getElementById('cancelReasonError').classList.remove('d-none');
    return;
  }
  document.getElementById('cancelReasonError').classList.add('d-none');
  try {
    const res = await fetch(DELIVER_API + cancelTargetId + '/', {
      method: 'PATCH',
      headers: apiHeaders(),
      body: JSON.stringify({ status: 'Cancelled', cancel_reason: reason })
    });
    if (res.ok) {
      cancelModalInstance.hide();
      fetchOrders();
    } else {
      const data = await res.json();
      alert(data.message || 'Failed to cancel order');
    }
  } catch (err) {
    console.error(err);
    alert('Something went wrong');
  }
}

/* ---------- LOGOUT ---------- */
function logout() {
  localStorage.removeItem('access');
  localStorage.removeItem('refresh');
  window.location.href = '/login/';
}

/* ---------- INIT ---------- */
checkDeliveryAccess();