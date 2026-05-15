const PRODUCT_API = "/api/product/";
const CATEGORY_API = "/api/category/";
const CART_API = "/api/cart/";

const token      = localStorage.getItem("access");
const categoryId = new URLSearchParams(window.location.search).get("category");

let categories = [];
let products   = [];

// ── Helpers ───────────────────────────────────────────────────────────────────

const authHeaders = () => ({
  "Content-Type": "application/json",
  "Authorization": `Bearer ${token}`,
});

const apiFetch = (url, options = {}) =>
  fetch(url, { ...options, headers: authHeaders() });

const getCategoryName = (id) =>
  categories.find(c => c.id == id)?.name ?? "Unknown";

// ── Categories ────────────────────────────────────────────────────────────────

async function loadCategories() {
  try {
    categories = await fetch(CATEGORY_API).then(r => r.json());
    renderCategoryDropdown();
  } catch (err) {
    console.error(err);
  }
}

function renderCategoryDropdown() {
  const select = document.getElementById("categorySelect");

  select.innerHTML += categories
    .map(cat => `<option value="${cat.id}">${cat.name}</option>`)
    .join("");

  if (categoryId) {
    select.value = categoryId;
    const current = categories.find(c => c.id == categoryId);
    if (current) document.getElementById("categoryTitle").innerText = current.name;
  }
}

document.getElementById("categorySelect").addEventListener("change", function () {
  window.location.href = this.value
    ? `/category-user?category=${this.value}`
    : `/category-user`;
});

// ── Products ──────────────────────────────────────────────────────────────────

async function loadProducts() {
  try {
    const url = categoryId ? `${PRODUCT_API}?category=${categoryId}` : PRODUCT_API;
    products = await fetch(url).then(r => r.json());
    renderProducts(products);
  } catch (err) {
    console.error(err);
  }
}

const productCard = (p) => `
  <div class="col-md-6 col-lg-3">
    <div class="card product-card shadow-sm rounded-4 h-100">
      <div class="card-body d-flex flex-column">
        <span class="badge bg-secondary mb-2 align-self-start">${getCategoryName(p.category)}</span>
        <h6 class="fw-bold">${p.name}</h6>
        <p class="text-muted small mb-2">Stock: ${p.stock} • ${p.is_available ? "Available" : "Out of stock"}</p>
        <div class="mt-auto">
          <div class="fw-bold text-success mb-2">₹${Number(p.price).toLocaleString("en-IN")}</div>
          <button class="btn btn-warning w-100 fw-semibold" onclick="addToCart(${p.id})" ${!p.is_available ? "disabled" : ""}>
            Add To Cart
          </button>
        </div>
      </div>
    </div>
  </div>`;

function renderProducts(list) {
  document.getElementById("productContainer").innerHTML = list.length
    ? list.map(productCard).join("")
    : `<div class="text-center text-muted py-5">No products found</div>`;
}

function filterProducts() {
  const q = document.getElementById("searchInput").value.toLowerCase();
  renderProducts(products.filter(p => p.name.toLowerCase().includes(q)));
}

// ── Cart ──────────────────────────────────────────────────────────────────────

async function addToCart(product_id) {
  if (!token) return alert("Please Login First");

  try {
    const res  = await apiFetch(`/api/add_to_cart/${product_id}/`, { method: "POST" });
    const data = await res.json();
    res.ok ? (alert("Product Added To Cart"), loadCart()) : alert(data.detail || "Something went wrong");
  } catch (err) {
    console.error(err);
  }
}

const cartItemHtml = (item) => `
  <div class="border rounded-3 p-3 mb-3">
    <h6 class="fw-bold mb-1">${item.Product_name}</h6>
    <p class="mb-1 text-muted">Quantity: ${item.quantity}</p>
    <div class="fw-semibold text-success">₹${item.price}</div>
  </div>`;

async function loadCart() {
  if (!token) return;

  try {
    const data = await apiFetch(CART_API).then(r => r.json());

    const count    = data.reduce((sum, i) => sum + i.quantity, 0);
    const subtotal = data.reduce((sum, i) => sum + i.quantity * i.price, 0);

    document.getElementById("cartItems").innerHTML   = data.length ? data.map(cartItemHtml).join("") : "<p>No items in cart</p>";
    document.getElementById("cartCount").innerText   = count;
    document.getElementById("subtotal").innerText    = `₹${subtotal.toLocaleString("en-IN")}`;
  } catch (err) {
    console.error(err);
  }
}

// ── Init ──────────────────────────────────────────────────────────────────────

async function init() {
  await loadCategories();
  await loadProducts();
  await loadCart();
}

init();