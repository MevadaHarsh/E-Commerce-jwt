const API_PRODUCTS = '/api/product/';
const API_CATEGORY = '/api/category/';

let products   = [];
let categories = [];

// ── Helpers ───────────────────────────────────────────────────────────────────

const apiHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${localStorage.getItem('access')}`
});

const apiFetch      = (url, options = {}) => fetch(url, { ...options, headers: apiHeaders() });
const $             = (id) => document.getElementById(id);
const getVal        = (id) => $(id).value;
const getCategoryName = (id) => categories.find(x => x.id == id)?.name ?? 'Unknown';
const getModal      = (id) => bootstrap.Modal.getInstance($(id));
const showModal     = (id) => new bootstrap.Modal($(id)).show();
const hideModal     = (id) => getModal(id).hide();

// ── Categories ────────────────────────────────────────────────────────────────

async function fetchCategories() {
  const data = await apiFetch(API_CATEGORY).then(r => r.json());
  categories = Array.isArray(data) ? data : data.results;
  loadCategoryDropdowns();
}

function loadCategoryDropdowns() {
  const options = categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('');

  $('newProdCat').innerHTML  = `<option value="">Select</option>${options}`;
  $('editProdCat').innerHTML = options;
  $('prodCatFilter').innerHTML = `<option value="">All Categories</option>${options}`;
}

// ── Products ──────────────────────────────────────────────────────────────────

async function fetchProducts() {
  products = await apiFetch(API_PRODUCTS).then(r => r.json());
  renderProducts(products);
}

function renderProducts(list) {
  $('prodCount').innerText = `Showing ${list.length}`;
  $('prodTableBody').innerHTML = list.map((p, i) => `
    <tr>
      <td>${i + 1}</td>
      <td>${p.name}</td>
      <td>${getCategoryName(p.category)}</td>
      <td>₹${p.price}</td>
      <td>
        <input type="number" value="${p.stock}" class="form-control form-control-sm"
               style="width:90px" onchange="updateStock(${p.id}, this.value)">
      </td>
      <td>
        <span class="badge ${p.is_available ? 'bg-success' : 'bg-danger'}">
          ${p.is_available ? 'Active' : 'Inactive'}
        </span>
      </td>
      <td class="text-center">
        <button class="btn btn-sm btn-warning" onclick="openEditProd(${p.id})"><i class="bi bi-pencil"></i></button>
        <button class="btn btn-sm btn-danger"  onclick="openDeleteProd(${p.id})"><i class="bi bi-trash"></i></button>
      </td>
    </tr>`).join('');
}

// ── Stock ─────────────────────────────────────────────────────────────────────

async function updateStock(id, value) {
  const stock = Number(value);
  if (!Number.isFinite(stock)) return;
  const res = await apiFetch(`${API_PRODUCTS}${id}/`, { method: 'PATCH', body: JSON.stringify({ stock: value }) });
  res.ok ? fetchProducts() : alert("Stock update failed");
}

// ── Add ───────────────────────────────────────────────────────────────────────

async function addProduct() {
  const body = {
    name     : getVal('newProdName'),
    category : getVal('newProdCat'),
    price    : getVal('newProdPrice'),
    stock    : getVal('newProdStock'),
  };

  if (Object.values(body).some(v => !v)) return alert("Please fill all fields");

  const res = await apiFetch(API_PRODUCTS, { method: 'POST', body: JSON.stringify(body) });
  if (res.ok) {
    hideModal('addProductModal');
    ['newProdName', 'newProdPrice', 'newProdStock', 'newProdCat'].forEach(id => $(id).value = '');
    fetchProducts();
  } else {
    const err = await res.json();
    alert(err.message || "Add product failed ❌");
  }
}

// ── Edit ──────────────────────────────────────────────────────────────────────

function openEditProd(id) {
  const p = products.find(x => x.id === id);
  if (!p) return;
  ['editProdId', 'editProdName', 'editProdCat', 'editProdPrice']
    .forEach(field => $(field).value = p[field.replace('editProd', '').toLowerCase()]);
  showModal('editProductModal');
}

async function saveProductEdit() {
  const id   = getVal('editProdId');
  const body = {
    name     : getVal('editProdName'),
    category : getVal('editProdCat'),
    price    : getVal('editProdPrice'),
  };
  const res = await apiFetch(`${API_PRODUCTS}${id}/`, { method: 'PATCH', body: JSON.stringify(body) });
  res.ok ? (hideModal('editProductModal'), fetchProducts()) : alert("Update failed");
}

// ── Delete ────────────────────────────────────────────────────────────────────

function openDeleteProd(id) {
  $('deleteProdId').value = id;
  showModal('deleteProdModal');
}

async function confirmDeleteProd() {
  const res = await apiFetch(`${API_PRODUCTS}${getVal('deleteProdId')}/`, { method: 'DELETE' });
  if (res.ok) { hideModal('deleteProdModal'); fetchProducts(); }
}

// ── Init ──────────────────────────────────────────────────────────────────────

fetchCategories();
fetchProducts();