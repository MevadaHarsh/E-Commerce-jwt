const API = "/api/category/";

let allCategories = [];

// ── Helpers ───────────────────────────────────────────────────────────────────

const getToken  = () => localStorage.getItem("access");
const apiHeaders = () => ({
  "Content-Type": "application/json",
  "Authorization": `Bearer ${getToken()}`,
});

function apiFetch(url, options = {}) {
  return fetch(url, { ...options, headers: apiHeaders() });
}

function showAlert(message, type = "danger") {
  const alertBox = document.getElementById("global-alert");
  alertBox.className = `alert alert-${type}`;
  alertBox.innerHTML = message;
  alertBox.classList.remove("d-none");
  setTimeout(() => alertBox.classList.add("d-none"), 3000);
}

// ── Render ────────────────────────────────────────────────────────────────────

const badgeHtml = (isActive) => isActive
  ? `<span class="badge badge-active">Active</span>`
  : `<span class="badge badge-inactive">Inactive</span>`;

const categoryRow = (cat) => `
  <tr>
    <td>${cat.id}</td>
    <td class="fw-semibold">${cat.name}</td>
    <td>${cat.desc || '-'}</td>
    <td>${badgeHtml(cat.is_active)}</td>
    <td>${new Date(cat.created_at).toLocaleString()}</td>
    <td class="text-center">
      <button class="btn btn-sm btn-outline-danger" onclick="deleteCategory(${cat.id})">
        <i class="bi bi-trash"></i>
      </button>
    </td>
  </tr>`;

function renderCategories(categories) {
  const table = document.getElementById("categoryTable");
  table.innerHTML = categories.length
    ? categories.map(categoryRow).join("")
    : `<tr><td colspan="6" class="text-center py-5">No Categories Found</td></tr>`;
}

// ── API Calls ─────────────────────────────────────────────────────────────────

async function fetchCategories() {
  try {
    const res = await apiFetch(API);

    if (res.status === 401) {
      showAlert("Unauthorized. Please login again.");
      return window.location.href = "/login/";
    }

    allCategories = await res.json();
    renderCategories(allCategories);

  } catch {
    showAlert("Failed to load categories.");
  }
}

async function addCategory() {
  const name      = document.getElementById("catName").value.trim();
  const desc      = document.getElementById("catDesc").value.trim();
  const is_active = document.getElementById("catStatus").value === "true";

  if (!name) return showAlert("Category name is required.");

  try {
    const res  = await apiFetch(API, { method: "POST", body: JSON.stringify({ name, desc, is_active }) });
    const data = await res.json();

    if (res.ok) {
      showAlert("Category added successfully.", "success");
      bootstrap.Modal.getInstance(document.getElementById("addModal")).hide();
      document.getElementById("catName").value = "";
      document.getElementById("catDesc").value = "";
      fetchCategories();
    } else {
      showAlert(data.detail || "Failed to add category.");
    }

  } catch {
    showAlert("Network error.");
  }
}

async function deleteCategory(id) {
  if (!confirm("Delete this category?")) return;

  try {
    const res = await apiFetch(`${API}${id}/`, { method: "DELETE" });
    res.ok
      ? (showAlert("Category deleted.", "success"), fetchCategories())
      : showAlert("Delete failed.");

  } catch {
    showAlert("Network error.");
  }
}

// ── Filter & Auth ─────────────────────────────────────────────────────────────

function filterCategories() {
  const search = document.getElementById("searchInput").value.toLowerCase();
  const status = document.getElementById("statusFilter").value;

  const filtered = allCategories.filter(cat =>
    (cat.name.toLowerCase().includes(search) || (cat.desc || "").toLowerCase().includes(search)) &&
    (status === "" || String(cat.is_active) === status)
  );

  renderCategories(filtered);
}

function logoutUser() {
  ["access", "refresh", "role"].forEach(k => localStorage.removeItem(k));
}

fetchCategories();