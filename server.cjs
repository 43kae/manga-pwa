require('dotenv').config();
const express = require('express');
const session = require('express-session');
const { Pool } = require('pg');
const cors = require('cors'); // Import CORS
const passport = require('passport');
const { transformWithEsbuild } = require('vite');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

const app = express();
const port = process.env.PORT || 3000;

app.use(cors({ origin: 'http://localhost:5173', credentials: true })); //Enable CORS
app.use(express.json());

//PostgreSQL connection
const pool = new Pool({
    user: process.env.DB_USER,
    host: 'localhost',
    database: process.env.DB_NAME,
    password: process.env.DB_PASS,
    port: 5432,
});

//Session Setup
app.use(session({
    secret: 'your_secret_key',
    resave: false,
    saveUninitialized: true
}));

// Initalize Passport
app.use(passport.initialize());
app.use(passport.session());

// Google OAuth Strategy
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/auth/google/callback"
}, async (accessToken, refreshToken, profile, done) => {
    try {
        const { id, displayName, emails, photos } = profile;
        const email = emails[0].value;
        const avatar = photos[0].value;

        //Check if user exists
        const existingUser = await pool.query(
            'SEELCT * FROM users WHERE google_id = $1',
            [id]
        );

        let user;
        if (existingUser.rows.length > 0) {
            user = existingUser.rows[0];
        } else {
            // Insert new user
            const newUser = await pool.query(
                'INSERT INTO users (google_id, name, email, avatar) VALUES ($1, $2, $3, $4) RETURNING *',
                [id, displayName, email, avatar]
            );
            user = newUser.rows[0];
        }
        return done(null, user);
    } catch (error) {
        console.error('Error handling authentication:', error);
        return done(error, null);
    }
}));

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
        done(null, user.rows[0]);
    } catch (error) {
        done(error, null);
    }
});

// Google Login Route
app.get('/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/' }),
    (req, res) => {
        res.redirect('http://localhost:5173/dashboard');
    }
);

//Logout Route
app.get('/logout', (req, res) => {
    req.logout(err => {
        if (err) console.error(err);
        res.redirect('/');
    });
});

// Get Logged-in User
app.get('/api/user', (req, res) => {
    if (req.isAuthenticated()) {
        res.json(req.user);
    } else {
        res.status(401).json({ error: 'Not logged in' });
    }
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});


//Test DB connection
// pool.query('SELECT NOW()', (err, res) => {
//     if (err) {
//         console.error('Database connection error:', err);
//     } else {
//         console.log('Database connected:', res.rows[0]);
//     }
// });


