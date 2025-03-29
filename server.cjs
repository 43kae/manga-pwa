require('dotenv').config();
const express = require('express');
const session = require('express-session');
const { Pool } = require('pg');
const cors = require('cors'); // Import CORS
const passport = require('passport');
const { transformWithEsbuild } = require('vite');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const jwt = require('jsonwebtoken');
const pgSession = require('connect-pg-simple')(session);

const app = express();
const port = process.env.PORT || 3000;

app.use(cors({ origin: 'http://localhost:5173', credentials: true })); //Enable CORS
app.use(express.json());

// Session Setup
// app.use(session({
//     secret: 'your_secret_key',
//     resave: false,
//     saveUninitialized: false
// }));


//PostgreSQL connection
const pool = new Pool({
    user: process.env.DB_USER,
    host: 'localhost',
    database: process.env.DB_NAME,
    password: process.env.DB_PASS,
    port: 5432,
});

// Set up sessions
app.use(session({
    store: new pgSession({
        pool: pool, // Use your PostgreSQL pool
        tableName: 'session', // Creates a 'session' table if it doesn’t exist
        createTableIfMissing: true // Auto-create if missing
    }),
    secret: process.env.SESSION_SECRET || 'your_secret_key',
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 24 * 60 * 60 * 1000, // 1 day
        httpOnly: false, // Set to false to check in DevTools
        sameSite: 'lax'
    }
}));

// Initalize Passport
app.use(passport.initialize());
app.use(passport.session());


// Google OAuth Strategy
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/auth/google/callback",
    scope: ["profile", "email"]
}, async (accessToken, refreshToken, profile, done) => {
    try {
        const { id, displayName, emails, photos } = profile;
        const email = emails[0].value;
        const avatar = photos[0].value;

        //Check if user exists
        // const existingUser = await pool.query(
        //     'SELECT * FROM users WHERE google_id = $1',
        //     [id]
        // );

        let user = await pool.query('SELECT * FROM users WHERE google_id = $1', [id]);
        if (user.rows.length === 0) {
            // Insert new user
            const newUser = await pool.query(
                'INSERT INTO users (google_id, name, email, avatar) VALUES ($1, $2, $3, $4) RETURNING *',
                [id, displayName, email, avatar]
            );
            user = newUser;
        }

        user = user.rows[0];

        // Generate JWT
        const token = jwt.sign(
            { id: user.id, name: user.name, email: user.email, avatar: user.avatar },
            process.env.JWT_SECRET,
            { expiresIn: '7d' } //Token expires in 7 days
        );

        return done(null, { user, token });
    } catch (error) {
        console.error('Error handling authentication:', error);
        return done(error, null);
    }
}));

// Passport Serializer
passport.serializeUser((user, done) => {
    console.log("Serializing user:", user); // Debugging
    done(null, user.user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const result = await pool.query("SELECT * FROM users WHERE id = $1", [id]);
        if (result.rows.length > 0) {
            done(null, result.rows[0]); // Return user object
        } else {
            done(null, false); // No user found
        }
    } catch (err) {
        done(err);
    }
});

// Google Login Route
app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

//Google Callback Route (now returns JWT)
app.get('/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/' }),
    (req, res) => {
        const token = req.user.token;
        res.redirect(`http://localhost:5173/dashboard?token=${token}`);
    }
);

//Middleware to verify JWT
const authenticateJWT = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Access Denied' });

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res, status(403).json({ error: 'Invalid token' });
        req.user = user;
        next();
    });
};

// Protected Route to Get Logged-in User Info
app.get('/api/user', authenticateJWT, (req, res) => {
    res.json(req.user);
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});

//Logout Route
// app.get('/logout', (req, res) => {
//     req.logout(err => {
//         if (err) console.error(err);
//         res.redirect('/');
//     });
// });

//Test DB connection
// pool.query('SELECT NOW()', (err, res) => {
//     if (err) {
//         console.error('Database connection error:', err);
//     } else {
//         console.log('Database connected:', res.rows[0]);
//     }
// });


