function getToken() {
  return localStorage.getItem("access");
}

async function loadOrders() {

  const token = getToken();

  const res = await fetch("/api/checkout-view/", {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    }
  });

  const data = await res.json();

  console.log("API RESPONSE:", data); // 🔥 DEBUG

  const container = document.getElementById("orderBody");
  container.innerHTML = "";

  if (!res.ok) {
    container.innerHTML = `
      <tr>
        <td colspan="5" class="text-danger text-center">
          ${data.detail || "Failed to load orders"}
        </td>
      </tr>
    `;
    return;
  }

  // 🔥 handle both array & paginated response
  const orders = Array.isArray(data) ? data : (data.results || []);

  if (orders.length === 0) {
    container.innerHTML = `
      <tr>
        <td colspan="5" class="text-center text-muted">
          No orders found
        </td>
      </tr>
    `;
    return;
  }

  orders.forEach(order => {

    let itemsHTML = "";

    (order.order_items || []).forEach(item => {
      itemsHTML += `
        <div class="small text-muted">
          • ${item.product_name} (x${item.quantity}) - ₹${item.total_price}
        </div>
      `;
    });

    container.innerHTML += `
      <tr>

        <td>
          <b>#${order.id}</b>
          <div class="mt-2">
            ${itemsHTML}
          </div>
        </td>

        <td>${order.full_name || "N/A"}</td>

        <td><b>₹${order.total_price || 0}</b></td>

        <td>${order.city || "N/A"}</td>

        <td>${formatDate(order.created_at)}</td>

        <td>${order.status || "N/A"}</td>

        <td>${order.partner_name || "N/A"}</td>

        <td>${order.cancel_reason || "N/A"}</td>

      </tr>
    `;
  });
}

/* STATUS COLOR */
function getStatusColor(status) {

  if (!status) return "secondary";

  status = status.toLowerCase();

  if (status === "pending") return "warning";
  if (status === "completed") return "success";
  if (status === "cancelled") return "danger";

  return "secondary";
}

/* FORMAT DATE */
function formatDate(dateStr) {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleString();
}

loadOrders();