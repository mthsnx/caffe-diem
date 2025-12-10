// server.js
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const axios = require('axios'); // NY: For å kalle Vipps API

const app = express();
const port = 3000;

// --- ⚠️ VIPPS KONFIGURASJON (ERSTATT MED DINE NØKLER) ⚠️ ---
// Disse må hentes fra din Vipps-utviklerportal
const VIPPS_CLIENT_ID = 'YOUR_VIPPS_CLIENT_ID';
const VIPPS_CLIENT_SECRET = 'YOUR_VIPPS_CLIENT_SECRET';
const VIPPS_SUBSCRIPTION_KEY = 'YOUR_VIPPS_SUBSCRIPTION_KEY'; 
const VIPPS_API_URL = 'https://apitest.vipps.no/ecomm/v2/payments'; // Test miljø URL
const CALLBACK_URL = 'http://localhost:3000/vipps-callback'; // Må være ekstern for Vipps i prod.

// --- 1. Database Initialization (Uendret) ---
const dbPath = path.join(__dirname, 'cafe_diem.db');
const db = new sqlite3.Database(dbPath, (err) => {
    // ... (Samme databaseinitialiseringskode som før)
    if (err) {
        console.error('Could not connect to database:', err.message);
    } else {
        console.log('Connected to the SQLite database.');
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
app.use(express.json()); 
app.use(express.static(path.join(__dirname, 'public')));

// --- 3. Vipps API Token Henter (Forenklet) ---
// I et produksjonsmiljø må du cache dette tokenet og oppdatere det ved utløp.
async function getVippsAccessToken() {
    try {
        const tokenResponse = await axios.post(
            'https://apitest.vipps.no/accesstoken/get',
            {},
            {
                headers: {
                    'client_id': VIPPS_CLIENT_ID,
                    'client_secret': VIPPS_CLIENT_SECRET,
                    'Ocp-Apim-Subscription-Key': VIPPS_SUBSCRIPTION_KEY,
                }
            }
        );
        return tokenResponse.data.access_token;
    } catch (error) {
        console.error('Vipps Token Error:', error.response ? error.response.data : error.message);
        return null;
    }
}


// --- 4. Ny API Rute for å starte Vipps-betaling ---
app.post('/start-vipps-payment', async (req, res) => {
    const { orderCode, total } = req.body;
    
    if (!orderCode || !total) {
        return res.status(400).json({ success: false, message: 'Missing order code or total.' });
    }

    const accessToken = await getVippsAccessToken();
    if (!accessToken) {
        return res.status(500).json({ success: false, message: 'Failed to get Vipps access token.' });
    }

    // Vipps Transaksjonsdata
    const vippsPayload = {
        merchantInfo: {
            merchantSerialNumber: "YOUR_MERCHANT_SN", // Erstatt med ditt SN
            callbackUrl: CALLBACK_URL,
            fallBack: `http://localhost:3000/?orderCode=${orderCode}&status=failed`, // Fallback for feil
            isApp: false, // true hvis du bruker Vipps i en egen app
        },
        transaction: {
            orderId: orderCode, // Bruk den unike koden som Vipps OrderId
            amount: Math.round(total * 100), // Beløp i øre
            transactionText: `Cafe Diem Order ${orderCode}`,
            skipLandingPage: false // Gå direkte til Vipps
        },
        customerInfo: {
            mobileNumber: "" // Kan legges til hvis du har telefonnummeret
        }
    };
    
    try {
        const vippsResponse = await axios.post(VIPPS_API_URL, vippsPayload, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`,
                'Ocp-Apim-Subscription-Key': VIPPS_SUBSCRIPTION_KEY,
                'client_id': VIPPS_CLIENT_ID,
                'X-Vipps-System-Name': 'CafeDiemNodeApp' // Valgfritt
            }
        });
        
        // Returner Vipps sin redirect URL til klienten (script.js)
        res.json({
            success: true,
            vippsUrl: vippsResponse.data.url // URL for å sende brukeren til Vipps
        });

    } catch (error) {
        console.error('Vipps Init Error:', error.response ? error.response.data : error.message);
        res.status(500).json({ success: false, message: 'Vipps payment initialization failed.' });
    }
});


// --- 5. Vipps Callback Rute (Simulert) ---
// Dette er ruten Vipps kaller når betalingen er godkjent/feilet.
app.post('/vipps-callback', (req, res) => {
    const { orderId, transactionId, transactionSummary } = req.body;
    console.log(`Vipps Callback mottatt for Order ID: ${orderId}`);
    
    // Her må du sjekke transaksjonsstatus (f.eks. transactionSummary.status === "SALE")
    // og deretter oppdatere ordren i din egen database:
    
    // db.run(`UPDATE orders SET status = 'Paid' WHERE order_code = ?`, [orderId], ...);
    
    // Vipps forventer en 200 OK
    res.status(200).send();
});


// --- 6. Original 'submit-order' rute (Endret for å bare lagre data, ikke betaling) ---
// Denne brukes nå kun for å lagre ordren i databasen før Vipps-betalingen starter
app.post('/submit-order', (req, res) => {
    const { items, total, orderCode } = req.body; 
    
    // ... (Validation og datalagring som før)
    if (!items || !total || !orderCode) {
        return res.status(400).json({ error: 'Missing required order data.' });
    }

    const orderTime = new Date().toISOString();
    const itemsJson = JSON.stringify(items);
    // Vi setter statusen til 'Vipps_Pending' eller 'Initialized'
    const status = 'Vipps_Pending'; 

    const sql = `INSERT INTO orders (order_code, order_time, items, total, status) VALUES (?, ?, ?, ?, ?)`;

    db.run(sql, [orderCode, orderTime, itemsJson, total, status], function(err) {
        if (err) {
            console.error('Database insertion error:', err.message);
            return res.status(500).json({ success: false, message: 'Failed to initialize order in DB.' });
        }
        
        res.status(201).json({ 
            success: true, 
            message: 'Order initialized successfully!', 
            orderCode: orderCode 
        });
    });
});


// Start the server
app.listen(port, () => {
    console.log(`☕ Cafe Diem server is running at http://localhost:${port}`);
});