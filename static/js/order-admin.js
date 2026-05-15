const getToken = () => localStorage.getItem("access");

const formatDate = (d) => d ? new Date(d).toLocaleString() : "-";

const normalise = (data) => Array.isArray(data) ? data : data.results || [];

const row = (col, content = "N/A") => `<td>${content}</td>`;

// ── Templates ─────────────────────────────────────────────────────────────────

const itemHtml = (item) =>
  `<div class="small text-muted">• ${item.product_name} (x${item.quantity}) - ₹${item.total_price}</div>`;

const orderRow = (order) => `
  <tr>
    <td><b>#${order.id}</b><div class="mt-2">${(order.order_items || []).map(itemHtml).join("")}</div></td>
    <td>${order.full_name   || "N/A"}</td>
    <td><b>₹${order.total_price || 0}</b></td>
    <td>${order.city        || "N/A"}</td>
    <td>${formatDate(order.created_at)}</td>
    <td>${order.status      || "N/A"}</td>
    <td>${order.partner_name  || "N/A"}</td>
    <td>${order.cancel_reason || "N/A"}</td>
  </tr>`;

const msgRow = (msg, cls) =>
  `<tr><td colspan="5" class="text-center ${cls}">${msg}</td></tr>`;

// ── Load Orders ───────────────────────────────────────────────────────────────

async function loadOrders() {
  const res  = await fetch("/api/checkout-view/", {
    headers: { "Authorization": `Bearer ${getToken()}`, "Content-Type": "application/json" }
  });
  const data = await res.json();
  const container = document.getElementById("orderBody");

  if (!res.ok) return container.innerHTML = msgRow(data.detail || "Failed to load orders", "text-danger");

  const orders = normalise(data);
  container.innerHTML = orders.length
    ? orders.map(orderRow).join("")
    : msgRow("No orders found", "text-muted");
}

loadOrders();