let cartItems = [];

// ── Helpers ──────────────────────────────────────────────────────────────────

const getToken = () => localStorage.getItem("access");

const authFetch = (url, options = {}) =>
  fetch(url, {
    ...options,
    headers: {
      "Authorization": `Bearer ${getToken()}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

// ── Auth ─────────────────────────────────────────────────────────────────────

function checkLogin() {
  if (!getToken()) window.location.href = "/login/";
}

checkLogin();

// ── Cart API ─────────────────────────────────────────────────────────────────

const fetchCart    = ()   => authFetch("/api/cart/").then(r => r.json());
const fetchProduct = (id) => authFetch(`/api/product/${id}/`).then(r => r.json());

async function updateQty(productId, action) {
  const res  = await authFetch(`/api/${action}/${productId}/`, { method: "POST" });
  const data = await res.json();

  if (res.ok) {
    loadCart();
  } else {
    if (action === "increase") {
      const msgBox = document.getElementById(`msg-${productId}`);
      if (msgBox) {
        msgBox.innerText = data.message || "Out of stock ❌";
        setTimeout(() => (msgBox.innerText = ""), 2500);
      }
    } else {
      alert(data.message || "Cannot decrease quantity");
    }
  }
}

const increaseQty = (id) => updateQty(id, "increase");
const decreaseQty = (id) => updateQty(id, "decrease");

// ── Render ────────────────────────────────────────────────────────────────────

function cartRow(product, item) {
  const total = product.price * item.quantity;
  return { html: `
    <tr>
      <td>
        <b>${product.name}</b><br>
        <small class="text-muted">ID: ${item.Product}</small>
        <div id="msg-${item.Product}" class="text-danger small"></div>
      </td>
      <td>₹${product.price}</td>
      <td>
        <div class="qty-box">
          <button class="qty-btn" onclick="decreaseQty(${item.Product})">-</button>
          <input  class="qty-input" value="${item.quantity}" readonly />
          <button class="qty-btn" onclick="increaseQty(${item.Product})">+</button>
        </div>
      </td>
      <td>₹${total}</td>
      <td>
        <button class="btn btn-sm btn-danger">
          <i class="bi bi-trash"></i>
        </button>
      </td>
    </tr>`, total };
}

async function renderCart() {
  const container = document.getElementById("cartBody");
  container.innerHTML = "";

  let subtotal = 0;

  for (const item of cartItems) {
    const product = await fetchProduct(item.Product);
    if (!product) continue;

    const { html, total } = cartRow(product, item);
    container.innerHTML += html;
    subtotal += total;
  }

  document.getElementById("subtotal").innerText = `₹${subtotal}`;
  document.getElementById("total").innerText     = `₹${subtotal}`;
}

// ── Load ──────────────────────────────────────────────────────────────────────

async function loadCart() {
  const data = await fetchCart();
  cartItems  = data.cart_item || [];
  renderCart();
}

// ── Checkout ──────────────────────────────────────────────────────────────────

document.getElementById("checkoutBtn").addEventListener("click", async () => {
  const data = await fetchCart();
  if (!data.cart_item?.length) return alert("Your cart is empty");
  window.location.href = "/checkout/";
});

loadCart();