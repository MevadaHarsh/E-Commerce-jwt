const API_PRODUCTS = '/api/product/';
const API_CATEGORY = '/api/category/';

let products = [];
let categories = [];

/* ---------- AUTH HEADER ---------- */
function apiHeaders() {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('access')}`
  };
}

/* ---------- FETCH CATEGORIES ---------- */
async function fetchCategories() {

  const res = await fetch(API_CATEGORY, { headers: apiHeaders() });
  const data = await res.json();

  categories = Array.isArray(data) ? data : data.results;

  loadCategoryDropdowns();
}

/* ---------- LOAD DROPDOWNS ---------- */
function loadCategoryDropdowns() {

  const add = document.getElementById('newProdCat');
  const edit = document.getElementById('editProdCat');
  const filter = document.getElementById('prodCatFilter');

  add.innerHTML = '<option value="">Select</option>';
  edit.innerHTML = '';
  filter.innerHTML = '<option value="">All Categories</option>';

  categories.forEach(c => {

    add.innerHTML += `<option value="${c.id}">${c.name}</option>`;
    edit.innerHTML += `<option value="${c.id}">${c.name}</option>`;
    filter.innerHTML += `<option value="${c.id}">${c.name}</option>`;
  });
}

/* ---------- STOCK INLINE UPDATE ---------- */
async function updateStock(id, value) {

  const stock = Number(value); // ✔ FIX

  if (!Number.isFinite(stock)) return;

  const res = await fetch(API_PRODUCTS + id + '/', {
    method: 'PATCH',
    headers: apiHeaders(),
    body: JSON.stringify({ stock: value })
  });

  if (res.ok) {
    fetchProducts();
  } else {
    alert("Stock update failed");
  }
}

/* ---------- RENDER PRODUCTS ---------- */
function renderProducts(list) {

  document.getElementById('prodCount').innerText =
    `Showing ${list.length}`;

  const tbody = document.getElementById('prodTableBody');

  tbody.innerHTML = list.map((p, i) => `
    <tr>
      <td>${i + 1}</td>
      <td>${p.name}</td>
      <td>${getCategoryName(p.category)}</td>
      <td>₹${p.price}</td>

      <!-- INLINE STOCK -->
      <td>
        <input type="number"
               value="${p.stock}"
               class="form-control form-control-sm"
               style="width:90px"
               onchange="updateStock(${p.id}, this.value)">
      </td>

      <td>
        <span class="badge ${p.is_available ? 'bg-success' : 'bg-danger'}">
          ${p.is_available ? 'Active' : 'Inactive'}
        </span>
      </td>

      <td class="text-center">
        <button class="btn btn-sm btn-warning" onclick="openEditProd(${p.id})">
          <i class="bi bi-pencil"></i>
        </button>

        <button class="btn btn-sm btn-danger" onclick="openDeleteProd(${p.id})">
          <i class="bi bi-trash"></i>
        </button>
      </td>
    </tr>
  `).join('');
}

/* ---------- CATEGORY NAME ---------- */
function getCategoryName(id) {
  const c = categories.find(x => x.id == id);
  return c ? c.name : 'Unknown';
}

/* ---------- FETCH PRODUCTS ---------- */
async function fetchProducts() {

  const res = await fetch(API_PRODUCTS, { headers: apiHeaders() });
  products = await res.json();

  renderProducts(products);
}

/* ---------- OPEN EDIT ---------- */
function openEditProd(id) {

  const p = products.find(x => x.id === id);
  if (!p) return;

  document.getElementById('editProdId').value = p.id;
  document.getElementById('editProdName').value = p.name;
  document.getElementById('editProdCat').value = p.category;
  document.getElementById('editProdPrice').value = p.price;

  new bootstrap.Modal(
    document.getElementById('editProductModal')
  ).show();
}

/* ---------- SAVE EDIT ---------- */
async function saveProductEdit() {

  const id = document.getElementById('editProdId').value;

  const body = {
    name: document.getElementById('editProdName').value,
    category: document.getElementById('editProdCat').value,
    price: document.getElementById('editProdPrice').value,
  };

  const res = await fetch(API_PRODUCTS + id + '/', {
    method: 'PATCH',
    headers: apiHeaders(),
    body: JSON.stringify(body)
  });

  if (res.ok) {

    bootstrap.Modal.getInstance(
      document.getElementById('editProductModal')
    ).hide();

    fetchProducts();

  } else {
    alert("Update failed");
  }
}

/* ---------- DELETE ---------- */
function openDeleteProd(id) {
  document.getElementById('deleteProdId').value = id;

  new bootstrap.Modal(
    document.getElementById('deleteProdModal')
  ).show();
}

async function confirmDeleteProd() {

  const id = document.getElementById('deleteProdId').value;

  const res = await fetch(API_PRODUCTS + id + '/', {
    method: 'DELETE',
    headers: apiHeaders()
  });

  if (res.ok) {

    // close modal
    const modalEl = document.getElementById('deleteProdModal');
    const modal = bootstrap.Modal.getInstance(modalEl);
    modal.hide();

    fetchProducts();
  }
}

async function addProduct() {

  const body = {
    name: document.getElementById('newProdName').value,
    category: document.getElementById('newProdCat').value,
    price: document.getElementById('newProdPrice').value,
    stock: document.getElementById('newProdStock').value,
  };

  // basic validation
  if (!body.name || !body.category || !body.price || !body.stock) {
    alert("Please fill all fields");
    return;
  }

  const res = await fetch(API_PRODUCTS, {
    method: "POST",
    headers: apiHeaders(),
    body: JSON.stringify(body)
  });

  if (res.ok) {

    // close modal
    bootstrap.Modal.getInstance(
      document.getElementById('addProductModal')
    ).hide();

    // clear fields
    document.getElementById('newProdName').value = "";
    document.getElementById('newProdPrice').value = "";
    document.getElementById('newProdStock').value = "";
    document.getElementById('newProdCat').value = "";

    fetchProducts(); // refresh table

  } else {

    const err = await res.json();
    alert(err.message || "Add product failed ❌");
  }
}

/* ---------- INIT ---------- */
fetchCategories();
fetchProducts();