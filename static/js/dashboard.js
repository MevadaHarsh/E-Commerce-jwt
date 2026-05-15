const API_PRODUCTS = '/api/product/';
const API_CATEGORY = '/api/category/';

let products   = [];
let categories = [];

// ── Helpers ───────────────────────────────────────────────────────────────────

const getToken  = () => localStorage.getItem("access");
const isLoggedIn = () => !!getToken();

const authFetch = (url, options = {}) =>
  fetch(url, {
    ...options,
    headers: {
      "Authorization": `Bearer ${getToken()}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

const toINR = (n) => `₹${Number(n).toLocaleString("en-IN")}`;

const normalise = (data) => Array.isArray(data) ? data : data.results || [];

// ── Auth UI ───────────────────────────────────────────────────────────────────

function checkAuthUI() {
  const loggedIn = isLoggedIn();
  document.getElementById("loginBtn").style.display    = loggedIn ? "none"  : "block";
  document.getElementById("registerBtn").style.display = loggedIn ? "none"  : "block";
  document.getElementById("logoutBtn").style.display   = loggedIn ? "block" : "none";
}

function logout() {
  ["access", "refresh"].forEach(k => localStorage.removeItem(k));
  location.reload();
}

function toggleCartButtons() {
  const display = isLoggedIn() ? "block" : "none";
  document.querySelectorAll(".add-to-cart-btn")
    .forEach(btn => btn.style.display = display);
}

// ── Categories ────────────────────────────────────────────────────────────────

async function loadCategories() {
  try {
    categories = normalise(await fetch(API_CATEGORY).then(r => r.json()));
    renderCategories();
  } catch (err) {
    console.error("Category error:", err);
  }
}

const getCategoryName = (id) => categories.find(c => c.id === id)?.name ?? "Unknown";

function renderCategories() {
  const container = document.getElementById("categoryContainer");
  container.innerHTML = categories.length
    ? categories.map(cat => `
        <div class="col-6 col-md-3">
          <div class="category-box bg-white shadow-sm rounded-4 p-4 text-center h-100"
               onclick="openCategory(${cat.id})">
            <i class="bi bi-grid fs-1 text-primary"></i>
            <h6 class="fw-bold text-dark mt-3">${cat.name}</h6>
            <small class="text-muted d-block">${cat.desc || ""}</small>
          </div>
        </div>`).join("")
    : `<div class="text-center text-muted py-3">No categories found</div>`;
}

const openCategory = (id) => window.location.href = `/category-user?category=${id}`;

// ── Products ──────────────────────────────────────────────────────────────────

async function loadProducts() {
  try {
    products = normalise(await fetch(API_PRODUCTS).then(r => r.json()));
    renderProducts(products);
  } catch (err) {
    console.error("Product error:", err);
  }
}

function renderProducts(list) {
  const container = document.getElementById("productContainer");
  container.innerHTML = list.length
    ? list.map(p => `
        <div class="col-md-6 col-lg-3">
          <div class="card shadow-sm rounded-4 h-100">
            <div class="card-body d-flex flex-column">
              <span class="badge bg-secondary mb-2 align-self-start">${getCategoryName(p.category)}</span>
              <h6 class="fw-bold">${p.name}</h6>
              <p class="text-muted small mb-2">Stock: ${p.stock} • ${p.is_available ? "Available" : "Out of stock"}</p>
              <div class="mt-auto">
                <div class="fw-bold text-success mb-2">${toINR(p.price)}</div>
                <button onclick="addToCart(${p.id})"
                  class="btn btn-warning w-100 fw-semibold add-to-cart-btn ${!p.is_available ? 'disabled' : ''}">
                  Add To Cart
                </button>
              </div>
            </div>
          </div>
        </div>`).join("")
    : `<div class="text-center text-muted py-5">No products found</div>`;

  toggleCartButtons();
}

function filterProducts() {
  const q = document.getElementById("searchInput").value.toLowerCase();
  renderProducts(products.filter(p => p.name.toLowerCase().includes(q)));
}

// ── Cart ──────────────────────────────────────────────────────────────────────

async function addToCart(productId) {
  if (!getToken()) return alert("Please login first");

  try {
    const res  = await authFetch(`/api/add_to_cart/${productId}/`, { method: "POST" });
    const data = await res.json();
    res.ok ? (alert("Product added to cart"), loadCart()) : alert(data.detail || "Error adding to cart");
  } catch (err) {
    console.error(err);
  }
}

async function loadCart() {
  if (!getToken()) return;

  try {
    const data     = normalise(await authFetch('/api/cart/').then(r => r.json()));
    const count    = data.reduce((s, i) => s + i.quantity, 0);
    const total    = data.reduce((s, i) => s + Number(i.product.price) * i.quantity, 0);

    document.getElementById("cartItems").innerHTML = data.length
      ? data.map(item => `
          <div class="border rounded-3 p-3 mb-3">
            <h6 class="fw-bold mb-1">${item.product.name}</h6>
            <p class="mb-1 text-muted">Qty: ${item.quantity}</p>
            <div class="fw-bold text-success">${toINR(item.product.price)}</div>
          </div>`).join("")
      : "<p class='text-muted'>Cart is empty</p>";

    document.getElementById("cartCount").innerText  = count;
    document.getElementById("cartTotal").innerText  = toINR(total);
  } catch (err) {
    console.error(err);
  }
}

// ── Init ──────────────────────────────────────────────────────────────────────

async function init() {
  checkAuthUI();
  await loadCategories();
  await loadProducts();
  await loadCart();
  toggleCartButtons();
}

init();