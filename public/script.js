// public/script.js
const menuItems = [
    { id: 1, name: "Carpe Diem Latte", desc: "Signature espresso with vanilla bean.", price: 4.95, category: "coffee", img: "https://images.unsplash.com/photo-1570968992193-96a2930fa818?w=600" },
    { id: 2, name: "Nitro Cold Brew", desc: "Velvet textured, slow-steeped coffee.", price: 5.25, category: "coffee", img: "https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=600" },
    { id: 3, name: "Americano", desc: "Espresso shots topped with hot water.", price: 3.45, category: "coffee", img: "https://images.unsplash.com/photo-1551030173-122f3f33266e?w=600" },
    { id: 4, name: "Double Choc Muffin", desc: "Dark chocolate with chocolate chips.", price: 3.25, category: "food", img: "https://images.unsplash.com/photo-1607958996333-41aef7caefaa?w=600" },
    { id: 5, name: "Almond Croissant", desc: "Flaky pastry with almond cream.", price: 4.15, category: "food", img: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600" },
    { id: 6, name: "Avocado Toast", desc: "Sourdough with smashed avocado.", price: 6.50, category: "food", img: "https://images.unsplash.com/photo-1588137372308-15f75323ca8d?w=600" }
];

let cart = [];

function renderMenu() {
    const coffeeContainer = document.getElementById('coffee-grid');
    const foodContainer = document.getElementById('food-grid');

    menuItems.forEach(item => {
        const card = `
            <div class="product-card">
                <div class="card-img-container"><img src="${item.img}" alt="${item.name}"></div>
                <div class="card-body">
                    <h3 class="card-title">${item.name}</h3>
                    <p class="card-desc">${item.desc}</p>
                    <div class="card-footer">
                        <span class="price">$${item.price.toFixed(2)}</span>
                        <button class="add-btn" onclick="addToCart(${item.id})">Add</button>
                    </div>
                </div>
            </div>`;
        
        if(item.category === 'coffee') coffeeContainer.innerHTML += card;
        else foodContainer.innerHTML += card;
    });
}

function addToCart(id) {
    const item = menuItems.find(p => p.id === id);
    cart.push(item);
    updateCartUI();
    document.getElementById('cart-sidebar').classList.add('open');
    document.getElementById('overlay').classList.add('active');
}

function removeFromCart(index) {
    cart.splice(index, 1);
    updateCartUI();
}

function updateCartUI() {
    const container = document.getElementById('cart-items-container');
    const count = document.getElementById('cart-count');
    const totalEl = document.getElementById('cart-total');

    count.innerText = cart.length;
    const total = cart.reduce((sum, item) => sum + item.price, 0);
    totalEl.innerText = '$' + total.toFixed(2);

    container.innerHTML = '';
    if (cart.length === 0) {
        container.innerHTML = '<p style="text-align:center; margin-top:2rem; color:#666;">Cart empty.</p>';
        return;
    }

    cart.forEach((item, index) => {
        container.innerHTML += `
            <div class="cart-item">
                <div><h4>${item.name}</h4><span>$${item.price.toFixed(2)}</span></div>
                <button class="remove-item" onclick="removeFromCart(${index})">Remove</button>
            </div>`;
    });
}

function toggleCart() {
    document.getElementById('cart-sidebar').classList.toggle('open');
    document.getElementById('overlay').classList.toggle('active');
}

function checkout() {
    if(cart.length === 0) return alert("Cart is empty!");
    alert("Order Received! (Demo Only)");
    cart = [];
    updateCartUI();
    toggleCart();
}

renderMenu();