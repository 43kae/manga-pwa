require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors'); // Import CORS

const app = express();
const port = process.env.PORT || 3000;

app.use(cors()); //Enable CORS

//PostgreSQL connection
const pool = new Pool({
    user: process.env.DB_USER,
    host: 'localhost',
    database: process.env.DB_NAME,
    password: process.env.DB_PASS,
    port: 5432,
});

//Test DB connection
pool.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.error('Database connection error:', err);
    } else {
        console.log('Database connected:', res.rows[0]);
    }
});

//Simple API Endpoint
app.get('/', (req, res) => {
    res.json('Manga PWA Backend is Running');
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
