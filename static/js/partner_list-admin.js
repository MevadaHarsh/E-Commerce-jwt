/* ---------- AUTH HEADER ---------- */
function apiHeaders() {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('access')}`
  };
}

/* ========================================
   PENDING PARTNERS
   ======================================== */
const API_PENDING_PARTNER = '/api/Pendingpartner/';
let partners = [];

async function fetchPartners() {
  try {
    const res = await fetch(API_PENDING_PARTNER, { headers: apiHeaders() });
    const data = await res.json();
    partners = Array.isArray(data) ? data : (data.results || []);
    renderPartners(partners);
  } catch (err) {
    console.error(err);
    // alert("Failed to fetch partners");
  }
}

function renderPartners(list) {
  document.getElementById('partnerCount').innerText = `Showing ${list.length} partners`;
  const tbody = document.getElementById('partnerTableBody');
  if (!list.length) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-muted">No pending partners found</td></tr>`;
    return;
  }
  tbody.innerHTML = list.map((p, i) => `
    <tr>
      <td>${i + 1}</td>
      <td>${p.name || '-'}</td>
      <td>${p.email || '-'}</td>
      <td>${p.phone || '-'}</td>
      <td><span class="badge bg-warning text-dark">Pending</span></td>
      <td class="text-center">
        <button class="btn btn-sm btn-info text-white" onclick="viewPartner(${p.id})">
          <i class="bi bi-eye"></i>
        </button>
        <button class="btn btn-sm btn-success" onclick="updatePartnerStatus(${p.id}, true)">
          <i class="bi bi-check-lg"></i>
        </button>
        <button class="btn btn-sm btn-danger" onclick="updatePartnerStatus(${p.id}, false)">
          <i class="bi bi-x-lg"></i>
        </button>
      </td>
    </tr>
  `).join('');
}

function filterPartners() {
  const q = document.getElementById('searchInput').value.toLowerCase();
  const filtered = partners.filter(p =>
    (p.name || '').toLowerCase().includes(q) ||
    (p.email || '').toLowerCase().includes(q) ||
    (p.phone || '').toLowerCase().includes(q)
  );
  renderPartners(filtered);
}

function viewPartner(id) {
  const p = partners.find(x => x.id === id);
  if (!p) return;
  document.getElementById('v_name').innerText  = p.name  || '-';
  document.getElementById('v_email').innerText = p.email || '-';
  document.getElementById('v_phone').innerText = p.phone || '-';
  document.getElementById('v_status').innerHTML = `<span class="badge bg-warning text-dark">Pending</span>`;
  new bootstrap.Modal(document.getElementById('viewPartnerModal')).show();
}

async function updatePartnerStatus(id, accept) {
  if (!confirm(`Are you sure you want to ${accept ? 'accept' : 'reject'} this partner?`)) return;
  try {
    const res = await fetch(API_PENDING_PARTNER + id + '/', {
      method: 'PATCH',
      headers: apiHeaders(),
      body: JSON.stringify({ is_approved: accept })
    });
    const data = await res.json();
    if (res.ok) {
      alert(data.message);
      partners = partners.filter(p => p.id !== id);
      renderPartners(partners);
    } else {
      alert(data.message || 'Action failed');
    }
  } catch (err) {
    console.error(err);
    alert('Something went wrong');
  }
}

/* ========================================
   DELIVERY PARTNERS
   ======================================== */
const API_DELIVERY_PARTNERS = '/api/delivery-partners/';

let deliveryPartners = [];
let nextPage = null;
let previousPage = null;

async function fetchDeliveryPartners(url = API_DELIVERY_PARTNERS) {
  try {
    const res = await fetch(url, {
      headers: apiHeaders()
    });

    const data = await res.json();

    // pagination data
    nextPage = data.next;
    previousPage = data.previous;

    // actual records
    deliveryPartners = data.results || [];

    renderDeliveryPartners(deliveryPartners);

    // update pagination buttons
    updatePaginationButtons();

  } catch (err) {
    console.error(err);
  }
}

function renderDeliveryPartners(list) {

  document.getElementById('dpCount').innerText =
    `Showing ${list.length} partners`;

  const tbody = document.getElementById('dpTableBody');

  if (!list.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="4" class="text-center py-4 text-muted">
          No delivery partners found
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = list.map((p, i) => `
    <tr>
      <td>${i + 1}</td>
      <td>${p.username || '-'}</td>
      <td>${p.user || '-'}</td>
      <td>
        <span class="badge ${p.is_available ? 'bg-success' : 'bg-secondary'}">
          ${p.is_available ? 'Available' : 'Unavailable'}
        </span>
      </td>
    </tr>
  `).join('');
}

function updatePaginationButtons() {

  document.getElementById('prevBtn').disabled = !previousPage;

  document.getElementById('nextBtn').disabled = !nextPage;
}

function nextPageData() {
  if (nextPage) {
    fetchDeliveryPartners(nextPage);
  }
}

function previousPageData() {
  if (previousPage) {
    fetchDeliveryPartners(previousPage);
  }
}

function filterDeliveryPartners() {

  const q = document.getElementById('dpSearchInput')
    .value
    .toLowerCase();

  const filtered = deliveryPartners.filter(p =>
    (p.username || '').toLowerCase().includes(q) ||
    String(p.user).includes(q)
  );

  renderDeliveryPartners(filtered);
}

// first load
fetchDeliveryPartners();

/* ---------- INIT ---------- */
fetchPartners();
fetchDeliveryPartners();