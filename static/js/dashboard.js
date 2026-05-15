const API_PRODUCTS = '/api/product/';
const API_CATEGORY = '/api/category/';

let products = [];
let categories = [];
let cart = [];

/* ---------------- AUTH ---------------- */

function isLoggedIn() {
  return !!localStorage.getItem("access");
}

function checkAuthUI() {
  const token = isLoggedIn();

  document.getElementById("loginBtn").style.display = token ? "none" : "block";
  document.getElementById("registerBtn").style.display = token ? "none" : "block";
  document.getElementById("logoutBtn").style.display = token ? "block" : "none";
}

function logout() {
  localStorage.removeItem("access");
  localStorage.removeItem("refresh");
  location.reload();
}

/* ---------------- CART BUTTON VISIBILITY ---------------- */

function toggleCartButtons() {
  const buttons = document.querySelectorAll(".add-to-cart-btn");
  const token = isLoggedIn();

  buttons.forEach(btn => {
    btn.style.display = token ? "block" : "none";
  });
}

/* ---------------- FETCH CATEGORIES ---------------- */

async function loadCategories() {
  try {
    const res = await fetch(API_CATEGORY);
    const data = await res.json();

    categories = Array.isArray(data) ? data : data.results || [];

    renderCategories();
  } catch (err) {
    console.log("Category error:", err);
  }
}

/* ---------------- FETCH PRODUCTS ---------------- */

async function loadProducts() {
  try {
    const res = await fetch(API_PRODUCTS);
    const data = await res.json();

    products = Array.isArray(data) ? data : data.results || [];

    renderProducts(products);
  } catch (err) {
    console.log("Product error:", err);
  }
}

/* ---------------- CATEGORY NAME ---------------- */

function getCategoryName(id) {
  const cat = categories.find(c => c.id === id);
  return cat ? cat.name : "Unknown";
}

/* ---------------- RENDER CATEGORIES ---------------- */

function renderCategories() {

  const container = document.getElementById("categoryContainer");

  if (!categories.length) {

    container.innerHTML = `
      <div class="text-center text-muted py-3">
        No categories found
      </div>
    `;

    return;
  }

  container.innerHTML = categories.map(cat => `

    <div class="col-6 col-md-3">

      <div
        class="category-box bg-white shadow-sm rounded-4 p-4 text-center h-100"
        onclick="openCategory(${cat.id})"
      >

        <i class="bi bi-grid fs-1 text-primary"></i>

        <h6 class="fw-bold text-dark mt-3">
          ${cat.name}
        </h6>

        <small class="text-muted d-block">
          ${cat.desc || ""}
        </small>

      </div>

    </div>

  `).join("");
}

function openCategory(categoryId) {

  window.location.href =
    `/category-user?category=${categoryId}`;

}

/* ---------------- RENDER PRODUCTS ---------------- */

function renderProducts(list) {
  const container = document.getElementById("productContainer");

  if (!list.length) {
    container.innerHTML = `
      <div class="text-center text-muted py-5">
        No products found
      </div>
    `;
    return;
  }

  container.innerHTML = list.map(p => `
    <div class="col-md-6 col-lg-3">

      <div class="card shadow-sm rounded-4 h-100">

        <div class="card-body d-flex flex-column">

          <span class="badge bg-secondary mb-2 align-self-start">
            ${getCategoryName(p.category)}
          </span>

          <h6 class="fw-bold">${p.name}</h6>

          <p class="text-muted small mb-2">
            Stock: ${p.stock} • 
            ${p.is_available ? "Available" : "Out of stock"}
          </p>

          <div class="mt-auto">

            <div class="fw-bold text-success mb-2">
              ₹${Number(p.price).toLocaleString("en-IN")}
            </div>

            <button
  onclick="addToCart(${p.id})"
  class="btn btn-warning w-100 fw-semibold add-to-cart-btn ${!p.is_available ? 'disabled' : ''}"
>
  Add To Cart
</button>

          </div>

        </div>

      </div>

    </div>
  `).join("");

  toggleCartButtons();
}

/* ---------------- SEARCH ---------------- */

function filterProducts() {
  const q = document.getElementById("searchInput").value.toLowerCase();

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(q)
  );

  renderProducts(filtered);
}


/* ---------------- ADD TO CART API ---------------- */

async function addToCart(productId) {

  const token = localStorage.getItem("access");

  if (!token) {

    alert("Please login first");

    return;
  }

  try {

    const response = await fetch(
      `/api/add_to_cart/${productId}/`,
      {
        method: "POST",

        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      }
    );



    const data = await response.json();

    console.log(data);

    if (response.ok) {

      alert("Product added to cart");

      loadCart();

    } else {

      alert(data.detail || "Error adding to cart");

    }

  }

  catch(error){

    console.log(error);

  }

}




/* ---------------- LOAD CART ---------------- */

async function loadCart() {

  const token = localStorage.getItem("access");

  if (!token) return;

  try {

    const response = await fetch(
      '/api/cart/',
      {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      }
    );

    const data = await response.json();

    console.log(data);

    const cartItems = document.getElementById("cartItems");

    const cartCount = document.getElementById("cartCount");

    let html = "";

    let total = 0;

    let count = 0;

    const cartData = Array.isArray(data)
      ? data
      : data.results || [];

    cartData.forEach(item => {

      count += item.quantity;

      total += Number(item.product.price) * item.quantity;

      html += `

        <div class="border rounded-3 p-3 mb-3">

          <h6 class="fw-bold mb-1">
            ${item.product.name}
          </h6>

          <p class="mb-1 text-muted">
            Qty: ${item.quantity}
          </p>

          <div class="fw-bold text-success">
            ₹${Number(item.product.price).toLocaleString("en-IN")}
          </div>

        </div>

      `;

    });

    cartItems.innerHTML =
      html || "<p class='text-muted'>Cart is empty</p>";

    cartCount.innerText = count;

    document.getElementById("cartTotal").innerText =
      `₹${total.toLocaleString("en-IN")}`;

  }

  catch(error){

    console.log(error);

  }

}



/* ---------------- INIT ---------------- */

async function init() {

  checkAuthUI();

  await loadCategories();

  await loadProducts();

  await loadCart();

  toggleCartButtons();

}

init();