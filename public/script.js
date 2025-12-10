// public/script.js

// --- DATA: Menu Items ---
const menuItems = [
    { id: 1, name: "Carpe Diem Latte", desc: "Our signature espresso with steamed milk and a hint of vanilla bean.", price: 4.95, category: "coffee", img: "https://images.unsplash.com/photo-1570968992193-96a2930fa818?auto=format&fit=crop&w=600&q=80" },
    { id: 2, name: "Nitro Cold Brew", desc: "Slow-steeped for 20 hours, infused with nitrogen for a creamy texture.", price: 5.25, category: "coffee", img: "https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=600&q=80" },
    { id: 3, name: "Americano", desc: "Espresso shots topped with hot water create a light layer of crema.", price: 3.45, category: "coffee", img: "https://images.unsplash.com/photo-1551030173-122f3f33266e?auto=format&fit=crop&w=600&q=80" },
    { id: 4, name: "Double Chocolate Muffin", desc: "Rich dark chocolate muffin with semi-sweet chocolate chips.", price: 3.25, category: "food", img: "https://images.unsplash.com/photo-1607958996333-41aef7caefaa?auto=format&fit=crop&w=600&q=80" },
    { id: 5, name: "Almond Croissant", desc: "Buttery, flaky pastry filled with sweet almond cream.", price: 4.15, category: "food", img: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80" },
    { id: 6, name: "Avocado Toast", desc: "Sourdough toast topped with smashed avocado, chili flakes, and olive oil.", price: 6.50, category: "food", img: "https://images.unsplash.com/photo-1588137372308-15f75323ca8d?auto=format&fit=crop&w=600&q=80" }
];

let cart = [];

// --- HELPER FUNCTION: Generate Random 6-Digit Order Code ---
function generateOrderCode() {
    // Generates a number between 100000 and 999999
    return Math.floor(100000 + Math.random() * 900000).toString();
}


// --- FUNCTION: Render Menu on Page Load ---
function renderMenu() {
    const coffeeContainer = document.getElementById('coffee-grid');
    const foodContainer = document.getElementById('food-grid');

    menuItems.forEach(item => {
        const card = `
            <div class="product-card">
                <div class="card-img-container">
                    <img src="${item.img}" alt="${item.name}">
                </div>
                <div class="card-body">
                    <h3 class="card-title">${item.name}</h3>
                    <p class="card-desc">${item.desc}</p>
                    <div class="card-footer">
                        <span class="price">$${item.price.toFixed(2)}</span>
                        <button class="add-btn" onclick="addToCart(${item.id})">Add</button>
                    </div>
                </div>
            </div>
        `;
        
        if(item.category === 'coffee') coffeeContainer.innerHTML += card;
        else foodContainer.innerHTML += card;
    });
}

// --- FUNCTION: Cart Management ---
function addToCart(id) {
    const item = menuItems.find(p => p.id === id);
    if (item) {
        cart.push(item);
        updateCartUI();
        document.getElementById('cart-sidebar').classList.add('open');
        document.getElementById('overlay').classList.add('active');
    }
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
        container.innerHTML = '<p style="text-align:center; margin-top: 2rem; color:#666;">Cart empty.</p>';
        return;
    }

    cart.forEach((item, index) => {
        container.innerHTML += `
            <div class="cart-item">
                <div class="cart-item-info">
                    <h4>${item.name}</h4>
                    <span>$${item.price.toFixed(2)}</span>
                </div>
                <button class="remove-item" onclick="removeFromCart(${index})">Remove</button>
            </div>
        `;
    });
}

// --- FUNCTION: Toggle Sidebar Visibility ---
function toggleCart() {
    document.getElementById('cart-sidebar').classList.toggle('open');
    document.getElementById('overlay').classList.toggle('active');
}

// --- FUNCTION: Checkout (Sends Data to Node Server) ---
async function checkout() {
    if(cart.length === 0) {
        alert("Your cart is empty!");
        return;
    }

    const total = cart.reduce((sum, item) => sum + item.price, 0).toFixed(2);
    
    // Generate the unique code
    const orderCode = generateOrderCode();

    // Prepare the order data to send to the Node server, including the new code
    const orderData = {
        orderCode: orderCode,
        items: cart.map(item => ({ name: item.name, price: item.price })),
        total: parseFloat(total)
    };

    try {
        const response = await fetch('/submit-order', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(orderData)
        });

        const result = await response.json();

        if (response.ok) {
            // Display the order code prominently to the user
            alert(`✅ Order Placed! Your Code is: ${result.orderCode}\n\nTotal: $${orderData.total}\n\nPlease present this code at the pickup counter.`);
            cart = [];
            updateCartUI();
            toggleCart();
        } else {
            alert(`Failed to place order. Error: ${result.message || 'Server error.'}`);
        }

    } catch (error) {
        console.error('Checkout failed:', error);
        alert('Could not connect to the server. Please ensure Node.js is running.');
    }
}

// --- INITIALIZATION ---
renderMenu();