const PRODUCT_API = "/api/product/";
const CATEGORY_API = "/api/category/";
const CART_API = "/api/cart/";

const token = localStorage.getItem("access");

const params = new URLSearchParams(window.location.search);

const categoryId = params.get("category");

let categories = [];
let products = [];


// ---------------- LOAD CATEGORIES ----------------

async function loadCategories() {

    try {

        const res = await fetch(CATEGORY_API);

        categories = await res.json();

        renderCategoryDropdown();

    }

    catch (err) {

        console.log(err);

    }

}


// ---------------- CATEGORY DROPDOWN ----------------

function renderCategoryDropdown() {

    const select = document.getElementById("categorySelect");

    categories.forEach(cat => {

        select.innerHTML += `

            <option value="${cat.id}">
                ${cat.name}
            </option>

        `;

    });

    if (categoryId) {

        select.value = categoryId;

        const current = categories.find(c => c.id == categoryId);

        if (current) {

            document.getElementById("categoryTitle").innerText =
                current.name;

        }

    }

}


// ---------------- CHANGE CATEGORY ----------------

document.getElementById("categorySelect")
    .addEventListener("change", function () {

        const value = this.value;

        if (value) {

            window.location.href =
                `/category-user?category=${value}`;

        }

        else {

            window.location.href =
                `/category-user`;

        }

    });


// ---------------- LOAD PRODUCTS ----------------

async function loadProducts() {

    try {

        let url = PRODUCT_API;

        if (categoryId) {

            url += `?category=${categoryId}`;

        }

        const res = await fetch(url);

        products = await res.json();

        renderProducts(products);

    }

    catch (err) {

        console.log(err);

    }

}


// ---------------- CATEGORY NAME ----------------

function getCategoryName(id) {

    const cat = categories.find(c => c.id == id);

    return cat ? cat.name : "Unknown";

}


// ---------------- RENDER PRODUCTS ----------------

function renderProducts(list) {

    const container =
        document.getElementById("productContainer");

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

            <div class="card product-card shadow-sm rounded-4 h-100">

                <div class="card-body d-flex flex-column">

                    <span class="badge bg-secondary mb-2 align-self-start">
                        ${getCategoryName(p.category)}
                    </span>

                    <h6 class="fw-bold">
                        ${p.name}
                    </h6>

                    <p class="text-muted small mb-2">

                        Stock: ${p.stock} •

                        ${p.is_available ? "Available" : "Out of stock"}

                    </p>

                    <div class="mt-auto">

                        <div class="fw-bold text-success mb-2">

                            ₹${Number(p.price).toLocaleString("en-IN")}

                        </div>

                        <button
                            class="btn btn-warning w-100 fw-semibold"
                            onclick="addToCart(${p.id})"
                            ${!p.is_available ? "disabled" : ""}
                        >

                            Add To Cart

                        </button>

                    </div>

                </div>

            </div>

        </div>

    `).join("");

}


// ---------------- SEARCH ----------------

function filterProducts() {

    const q =
        document.getElementById("searchInput")
            .value
            .toLowerCase();

    const filtered = products.filter(p =>
        p.name.toLowerCase().includes(q)
    );

    renderProducts(filtered);

}


// ---------------- ADD TO CART ----------------

async function addToCart(product_id) {

    if (!token) {

        alert("Please Login First");

        return;

    }

    try {

        const response = await fetch(
            `/api/add_to_cart/${product_id}/`,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                }
            }
        );

        const data = await response.json();

        console.log(data);

        if (response.ok) {

            alert("Product Added To Cart");

            loadCart();

        }

        else {

            alert(data.detail || "Something went wrong");

        }

    }

    catch (error) {

        console.log(error);

    }

}


// ---------------- LOAD CART ----------------

async function loadCart() {

    if (!token) {

        return;

    }

    try {

        const response = await fetch(
            CART_API,
            {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            }
        );

        const data = await response.json();

        console.log(data);

        let cartHTML = "";

        let count = 0;

        let subtotal = 0;

        data.forEach(item => {

            count += item.quantity;

            subtotal += item.quantity * item.price;

            cartHTML += `

                <div class="border rounded-3 p-3 mb-3">

                    <h6 class="fw-bold mb-1">
                        ${item.Product_name}
                    </h6>

                    <p class="mb-1 text-muted">
                        Quantity: ${item.quantity}
                    </p>

                    <div class="fw-semibold text-success">
                        ₹${item.price}
                    </div>

                </div>

            `;

        });

        document.getElementById("cartItems").innerHTML =
            cartHTML || "<p>No items in cart</p>";

        document.getElementById("cartCount").innerText =
            count;

        document.getElementById("subtotal").innerText =
            `₹${subtotal.toLocaleString("en-IN")}`;

    }

    catch(error){

        console.log(error);

    }

}


// ---------------- INIT ----------------

async function init() {

    await loadCategories();

    await loadProducts();

    await loadCart();

}

init();