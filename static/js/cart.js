let cartItems = [];

function getToken() {
  return localStorage.getItem("access");
}

document.getElementById("checkoutBtn").addEventListener("click", async () => {

  const token = getToken();

  const res = await fetch('/api/cart/', {
    headers: {
      "Authorization": `Bearer ${token}`
    }
  });

  const data = await res.json();

  // Check cart is empty
  if (!data.cart_item || data.cart_item.length === 0) {
    alert("Your cart is empty");
    return;
  }

  // Go to checkout page
  window.location.href = "/checkout/";

});

function checkLogin() {
  const token = getToken();

  if (!token) {
    // Redirect to login page
    window.location.href = "/login/";
  }
}

// Run check when page loads
checkLogin();

/* LOAD CART */
async function loadCart() {

  const token = getToken();

  const res = await fetch('/api/cart/', {
    headers: {
      "Authorization": `Bearer ${token}`
    }
  });

  const data = await res.json();

  cartItems = data.cart_item || [];

  renderCart();
}

/* GET PRODUCT */
async function getProduct(id) {

  const token = getToken();

  const res = await fetch(`/api/product/${id}/`, {
    headers: {
      "Authorization": `Bearer ${token}`
    }
  });

  return await res.json();
}

/* INCREASE */
async function increaseQty(productId) {

  const token = getToken();

  const res = await fetch(`/api/increase/${productId}/`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    }
  });

  const data = await res.json();

  const msgBox = document.getElementById(`msg-${productId}`);

  if (res.ok) {

    if (msgBox) msgBox.innerText = "";
    loadCart();

  } else {

    if (msgBox) msgBox.innerText = data.message || "Out of stock ❌";

    setTimeout(() => {
      if (msgBox) msgBox.innerText = "";
    }, 2500);
  }
}

/* DECREASE */
async function decreaseQty(productId) {

  const token = getToken();

  const res = await fetch(`/api/decrease/${productId}/`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    }
  });

  const data = await res.json();

  if (res.ok) {
    loadCart();
  } else {
    alert(data.message || "Cannot decrease quantity");
  }
}

/* RENDER CART */
async function renderCart() {

  const container = document.getElementById("cartBody");
  container.innerHTML = "";

  let subtotal = 0;

  for (let item of cartItems) {

    const product = await getProduct(item.Product);
    if (!product) continue;

    const total = product.price * item.quantity;
    subtotal += total;

    container.innerHTML += `
      <tr>

        <td>
          <b>${product.name}</b><br>
          <small class="text-muted">ID: ${item.Product}</small>

          <!-- ITEM LEVEL MESSAGE -->
          <div id="msg-${item.Product}" class="text-danger small"></div>
        </td>

        <td>₹${product.price}</td>

        <td>
          <div class="qty-box">

            <button class="qty-btn"
              onclick="decreaseQty(${item.Product})">
              -
            </button>

            <input class="qty-input" value="${item.quantity}" readonly/>

            <button class="qty-btn"
              onclick="increaseQty(${item.Product})">
              +
            </button>

          </div>
        </td>

        <td>₹${total}</td>

        <td>
          <button class="btn btn-sm btn-danger">
            <i class="bi bi-trash"></i>
          </button>
        </td>

      </tr>
    `;
  }

  document.getElementById("subtotal").innerText = "₹" + subtotal;
  document.getElementById("total").innerText = "₹" + subtotal;
}



loadCart();