// server.js
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const port = 3000;

// --- 1. Database Initialization ---
const dbPath = path.join(__dirname, 'cafe_diem.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Could not connect to database:', err.message);
    } else {
        console.log('Connected to the SQLite database.');
        
        // Create the orders table with the 'order_code' column for user tracking
        db.run(`CREATE TABLE IF NOT EXISTS orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            order_code TEXT NOT NULL UNIQUE, 
            order_time TEXT NOT NULL,
            items TEXT NOT NULL,
            total REAL NOT NULL,
            status TEXT NOT NULL
        )`, (err) => {
            if (err) {
                console.error('Error creating table:', err.message);
            } else {
                console.log('Orders table ready with order_code column.');
            }
        });
    }
});

// --- 2. Middleware ---
// To parse JSON data sent in the body of requests (from the client-side JS)
app.use(express.json()); 
// Serve static files (HTML, CSS, JS) from the 'public' folder
app.use(express.static(path.join(__dirname, 'public')));

// --- 3. Routes ---

// Default route for the homepage
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API route to submit an order
app.post('/submit-order', (req, res) => {
    // We expect 'orderCode', 'items', and 'total' from the client-side script.js
    const { items, total, orderCode } = req.body; 
    
    if (!items || !total || !orderCode) {
        return res.status(400).json({ error: 'Missing required order data (items, total, or order code).' });
    }

    const orderTime = new Date().toISOString();
    const itemsJson = JSON.stringify(items); // Store array of items as a string
    const status = 'Pending';

    // SQL statement modified to insert 'order_code'
    const sql = `INSERT INTO orders (order_code, order_time, items, total, status) VALUES (?, ?, ?, ?, ?)`;

    db.run(sql, [orderCode, orderTime, itemsJson, total, status], function(err) {
        if (err) {
            console.error('Database insertion error:', err.message);
            
            // Check for unique constraint violation for the order code
            if (err.message.includes('UNIQUE constraint failed')) {
                 return res.status(409).json({ success: false, message: 'Order code collision, please try again.' });
            }
            return res.status(500).json({ success: false, message: 'Failed to place order.' });
        }
        
        // Return the custom order code to the client for display
        res.status(201).json({ 
            success: true, 
            message: 'Order placed successfully!', 
            orderId: this.lastID,
            orderCode: orderCode 
        });
    });
});

// Start the server
app.listen(port, () => {
    console.log(`☕ Cafe Diem server is running at http://localhost:${port}`);
});