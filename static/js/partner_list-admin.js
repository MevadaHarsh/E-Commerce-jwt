const apiHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${localStorage.getItem('access')}`
});

const apiFetch   = (url, options = {}) => fetch(url, { ...options, headers: apiHeaders() });
const normalise  = (data) => Array.isArray(data) ? data : data.results || [];
const emptyRow   = (cols, msg) => `<tr><td colspan="${cols}" class="text-center py-4 text-muted">${msg}</td></tr>`;

// ── Pending Partners ──────────────────────────────────────────────────────────

const API_PENDING_PARTNER  = '/api/Pendingpartner/';
const API_DELIVERY_PARTNERS = '/api/delivery-partners/';

let partners         = [];
let deliveryPartners = [];

async function fetchPartners() {
  try {
    const data = await apiFetch(API_PENDING_PARTNER).then(r => r.json());
    partners   = normalise(data);
    renderPartners(partners);
  } catch (err) { console.error(err); }
}

function renderPartners(list) {
  document.getElementById('partnerCount').innerText = `Showing ${list.length} partners`;
  document.getElementById('partnerTableBody').innerHTML = list.length
    ? list.map((p, i) => `
        <tr>
          <td>${i + 1}</td>
          <td>${p.name  || '-'}</td>
          <td>${p.email || '-'}</td>
          <td>${p.phone || '-'}</td>
          <td><span class="badge bg-warning text-dark">Pending</span></td>
          <td class="text-center">
            <button class="btn btn-sm btn-info text-white" onclick="viewPartner(${p.id})"><i class="bi bi-eye"></i></button>
            <button class="btn btn-sm btn-success" onclick="updatePartnerStatus(${p.id}, true)"><i class="bi bi-check-lg"></i></button>
            <button class="btn btn-sm btn-danger"  onclick="updatePartnerStatus(${p.id}, false)"><i class="bi bi-x-lg"></i></button>
          </td>
        </tr>`).join('')
    : emptyRow(6, 'No pending partners found');
}

function filterPartners() {
  const q = document.getElementById('searchInput').value.toLowerCase();
  renderPartners(partners.filter(p =>
    ['name', 'email', 'phone'].some(k => (p[k] || '').toLowerCase().includes(q))
  ));
}

function viewPartner(id) {
  const p = partners.find(x => x.id === id);
  if (!p) return;
  ['name', 'email', 'phone'].forEach(k => document.getElementById(`v_${k}`).innerText = p[k] || '-');
  document.getElementById('v_status').innerHTML = `<span class="badge bg-warning text-dark">Pending</span>`;
  new bootstrap.Modal(document.getElementById('viewPartnerModal')).show();
}

async function updatePartnerStatus(id, accept) {
  if (!confirm(`Are you sure you want to ${accept ? 'accept' : 'reject'} this partner?`)) return;
  try {
    const res  = await apiFetch(`${API_PENDING_PARTNER}${id}/`, { method: 'PATCH', body: JSON.stringify({ is_approved: accept }) });
    const data = await res.json();
    if (res.ok) {
      alert(data.message);
      partners = partners.filter(p => p.id !== id);
      renderPartners(partners);
    } else {
      alert(data.message || 'Action failed');
    }
  } catch (err) { console.error(err); alert('Something went wrong'); }
}

// ── Delivery Partners ─────────────────────────────────────────────────────────

async function fetchDeliveryPartners() {
  try {
    const data   = await apiFetch(API_DELIVERY_PARTNERS).then(r => r.json());
    deliveryPartners = normalise(data);
    renderDeliveryPartners(deliveryPartners);
  } catch (err) { console.error(err); }
}

function renderDeliveryPartners(list) {
  document.getElementById('dpCount').innerText = `Showing ${list.length} partners`;
  document.getElementById('dpTableBody').innerHTML = list.length
    ? list.map((p, i) => `
        <tr>
          <td>${i + 1}</td>
          <td>${p.username || '-'}</td>
          <td>${p.user    || '-'}</td>
          <td>
            <span class="badge ${p.is_available ? 'bg-success' : 'bg-secondary'}">
              <i class="bi bi-circle-fill me-1" style="font-size:.5rem;vertical-align:middle;"></i>
              ${p.is_available ? 'Available' : 'Unavailable'}
            </span>
          </td>
        </tr>`).join('')
    : emptyRow(4, 'No delivery partners found');
}

function filterDeliveryPartners() {
  const q = document.getElementById('dpSearchInput').value.toLowerCase();
  renderDeliveryPartners(deliveryPartners.filter(p =>
    (p.username || '').toLowerCase().includes(q) || String(p.user).includes(q)
  ));
}

// ── Init ──────────────────────────────────────────────────────────────────────

fetchPartners();
fetchDeliveryPartners();