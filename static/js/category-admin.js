const API = "/api/category/";

let allCategories = [];

function apiHeaders() {

let token = localStorage.getItem("access");

return {
    "Content-Type": "application/json",
    "Authorization": "Bearer " + token
};
}

function showAlert(message, type="danger") {

const alertBox = document.getElementById("global-alert");

alertBox.className = "alert alert-" + type;

alertBox.innerHTML = message;

alertBox.classList.remove("d-none");

setTimeout(() => {
    alertBox.classList.add("d-none");
}, 3000);
}

async function fetchCategories() {

try {

    const response = await fetch(API, {
    method: "GET",
    headers: apiHeaders()
    });

    if(response.status === 401){

    showAlert("Unauthorized. Please login again.");

    window.location.href = "/login/";

    return;
    }

    const data = await response.json();

    allCategories = data;

    renderCategories(data);

}

catch(error){

    console.log(error);

    showAlert("Failed to load categories.");
}
}

function renderCategories(categories){

const table = document.getElementById("categoryTable");

if(categories.length === 0){

    table.innerHTML = `
    <tr>
        <td colspan="6" class="text-center py-5">
        No Categories Found
        </td>
    </tr>
    `;

    return;
}

table.innerHTML = categories.map(cat => `

    <tr>

    <td>${cat.id}</td>

    <td class="fw-semibold">
        ${cat.name}
    </td>

    <td>
        ${cat.desc || '-'}
    </td>

    <td>

        ${
        cat.is_active
        ?
        `<span class="badge badge-active">Active</span>`
        :
        `<span class="badge badge-inactive">Inactive</span>`
        }

    </td>

    <td>
        ${new Date(cat.created_at).toLocaleString()}
    </td>

    <td class="text-center">

        <button class="btn btn-sm btn-outline-danger"
                onclick="deleteCategory(${cat.id})">

        <i class="bi bi-trash"></i>

        </button>

    </td>

    </tr>

`).join("");
}

async function addCategory(){

const name = document.getElementById("catName").value.trim();

const desc = document.getElementById("catDesc").value.trim();

const is_active =
    document.getElementById("catStatus").value === "true";

if(!name){

    showAlert("Category name is required.");

    return;
}

try{

    const response = await fetch(API, {

    method: "POST",

    headers: apiHeaders(),

    body: JSON.stringify({
        name,
        desc,
        is_active
    })

    });

    const data = await response.json();

    if(response.ok){

    showAlert("Category added successfully.", "success");

    bootstrap.Modal.getInstance(
        document.getElementById("addModal")
    ).hide();

    document.getElementById("catName").value = "";
    document.getElementById("catDesc").value = "";

    fetchCategories();

    }

    else{

    showAlert(data.detail || "Failed to add category.");
    }

}

catch(error){

    console.log(error);

    showAlert("Network error.");
}
}

async function deleteCategory(id){

if(!confirm("Delete this category?")) return;

try{

    const response = await fetch(API + id + "/", {

    method: "DELETE",

    headers: apiHeaders()

    });

    if(response.ok){

    showAlert("Category deleted.", "success");

    fetchCategories();
    }

    else{

    showAlert("Delete failed.");
    }

}

catch(error){

    console.log(error);

    showAlert("Network error.");
}
}

function filterCategories(){

const search =
    document.getElementById("searchInput")
    .value
    .toLowerCase();

const status =
    document.getElementById("statusFilter").value;

const filtered = allCategories.filter(cat => {

    const matchesSearch =
    cat.name.toLowerCase().includes(search)
    ||
    (cat.desc || "").toLowerCase().includes(search);

    const matchesStatus =
    status === ""
    ||
    String(cat.is_active) === status;

    return matchesSearch && matchesStatus;
});

renderCategories(filtered);
}

function logoutUser(){

localStorage.removeItem("access");
localStorage.removeItem("refresh");
localStorage.removeItem("role");
}

fetchCategories();