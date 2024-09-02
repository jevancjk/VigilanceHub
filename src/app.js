const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql');
const cors = require('cors');
const bcrypt = require('bcrypt');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const path = require('path');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
// const authController = require('./controllers/authController')
// const axios = require('axios');
// const pool = require('./db');

const app = express();
const port = 3000;
//const port = 3306;

const corsSession = {
    origin: 'http://127.0.0.1:5500', // MUST point to frontend
    credentials: true,
};

app.use(cors(corsSession));

app.use(bodyParser.json());

// Change these credentials if your password or database name is different in MySQL Workbench in your local machine
const pool = mysql.createPool({
    connectionLimit: 10,
    host: 'localhost',
    user: 'root',
    password: 'Password4291',
    database: 'vigilancehub'
});

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    auth: {
        user: 'vigillancehub.help@gmail.com',
        pass: 'tbhb iwwv iwws gbbq'
    }
});

// Session management
const sessionStore = new MySQLStore({}, pool);

app.use(session({
    key: 'login_session',
    secret: '2kBiHWJxajgjYisdTo+aYJB9KbwwL3dZYPTEIht0KaI=',
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
        // maxAge: 259200000 // 3 days
        // maxAge: 60000
        maxAge: 7200000 // 2 hours
    }
}));

app.use((req, res, next) => {
    // ensure that user cannot click Backspace to go back to authenticated pages
    const noCachePages = ['../public/html/index_home.html', '../misc_html/logout.html'];

    if (noCachePages.includes(req.url)) {
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
    }
    
    next();
});

// Check if user is authenticated
const isAuthenticated = (req, res, next) => {
    if (!req.session.userID) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    next();
};

app.get('/checkAuth', (req, res) => {
    console.log('Session:', req.session);
    if (req.session.userID) {
        res.json({ authenticated: true });
    } else {
        res.status(401).json({ authenticated: false });
    }
});

// app.post('/register', async (req, res) => {
//     const { username, email, password } = req.body;
//     try {
//         const hashedPassword = await bcrypt.hash(password, 10);
//         const sql = "INSERT INTO users (username, email, password) VALUES (?, ?, ?)";
//         pool.query(sql, [username, email, hashedPassword], async (err, results) => {
//             if (err) {
//                 console.error(err);
//                 res.status(500).json({ success: false, message: 'Failed to register. Database error' });
//                 return;
//             }

//             function sendMail(to, sub, msg) {
//                 transporter.sendMail({
//                     to: to,
//                     subject: sub,
//                     html: msg
//                 }, (error, info) => {
//                     if (error) {
//                         console.error('Error sending email: ', error);
//                         res.status(500).json({ success: false, message: 'Failed to send confirmation email. Server error' });
//                         return;
//                     }
//                     console.log('Email sent successfully to ' + email);
//                     console.log('Details: ' + info.response + '\n');
//                 });
//             }

//             sendMail(email,'Registered','You have registered an account with VigilanceHub');
//             res.json({ success: true, message: 'Credentials accepted. Please check your email to confirm your registration.' });

//         });
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ success: false, message: 'Failed to register. Server error' });
//     }
// });

app.post('/register', async (req, res) => {
    const { username, email, password } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const sql = "INSERT INTO users (username, email, password, emailConfirmed) VALUES (?, ?, ?, 0)"; // Added confirmed field
        pool.query(sql, [username, email, hashedPassword], async (err, results) => {
            if (err) {
                console.error(err);
                res.status(500).json({ success: false, message: 'Failed to register. Database error' });
                return;
            }

            // Generate a confirmation token and link
            const token = crypto.randomBytes(20).toString('hex');
            const confirmationLink = `http://127.0.0.1:3000/confirm/${token}`; // activate email confirm route with token

            // Save token to MySQL database
            const tokenSql = "UPDATE users SET confirmationToken = ? WHERE email = ?";
            pool.query(tokenSql, [token, email], (err) => {
                if (err) {
                    console.error('Error saving token:', err);
                    res.status(500).json({ success: false, message: 'Failed to save confirmation token. Server error' });
                    return;
                }

                const message = `
                    <p>You are registering an account with VigilanceHub. Please click the link below to confirm:</p>
                    <a href="${confirmationLink}">Confirm your registration</a>
                `;
                transporter.sendMail({
                    from: 'vigillancehub.help@gmail.com',
                    to: email,
                    subject: 'Confirm Your Registration',
                    html: message
                }, (error, info) => {
                    if (error) {
                        console.error('Error sending email: ', error);
                        res.status(500).json({ success: false, message: 'Failed to send confirmation email. Server error' });
                        return;
                    }
                    console.log('Email sent successfully to ' + email);
                    console.log('Details: ' + info.response + '\n');
                });

                res.json({ success: true, message: 'Credentials accepted. Please check your email to confirm your registration.' });
            });
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Failed to register. Server error' });
    }
});

// Handle email confirmation
app.get('/confirm/:token', (req, res) => {
    const { token } = req.params;

    // Verify token and update user's confirmation status
    const sql = "UPDATE users SET emailConfirmed = 1 WHERE confirmationToken = ?";
    pool.query(sql, [token], (err, results) => {
        if (err) {
            console.error(err);
            res.status(500).send('Error confirming registration.');
            return;
        }
        if (results.affectedRows > 0) {
            // Redirect to Registration Success page
            setTimeout(() => {
                res.redirect('http://127.0.0.1:5500/misc_html/registration_success.html');
            }, 1500);
        } else {
            res.status(400).send('Invalid or expired token.');
        }
    });
});

app.post('/login', (req, res) => {
    const { credential, password } = req.body;

    // check if username or email matches any entry in the database
    const sql = "SELECT * FROM users WHERE username = ? OR email = ?";
    pool.query(sql, [credential, credential], async (err, results) => {
        if (err) {
            console.error(err);
            res.status(500).json({ success: false, message: 'Server error' });
            return;
        }
        
        if (results.length === 0) {
            res.json({ success: false, message: 'Incorrect email/username or password' });
            return;
        }

        const user = results[0];
        const match = await bcrypt.compare(password, user.password);
        
        if (!match) {
            res.json({ success: false, message: 'Incorrect email/username or password' });
            return;
        }

        if (user.emailConfirmed === 0) {
            res.json({ success: false, message: 'Please check your email to confirm registration before logging in.' });
            return;
        }

        req.session.userID = user.userID;
        req.session.username = user.username;
        console.log('Session after login:', req.session); // Debugging log

        res.json({ success: true, username: user.username, message: 'Login success' });
    });
});

app.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Failed to logout' });
        }
        res.clearCookie('login_session', {
            path: '/', 
            httpOnly: true, 
            secure: false, 
            sameSite: 'lax'
        });
        res.json({ success: true, message: 'Logged out successfully' });
    });
});

// app.post('/logout', (req, res) => {
//     req.logOut();
//     res.status(200).clearCookie('login_session', {
//       path: '/'
//     });
//     req.session.destroy((err) => {
//       res.redirect('/');
//     });
//   });

app.get('/users', (req, res) => {
    const sql = "SELECT * FROM users";
    pool.query(sql, (err, results) => {
        if (err) {
            console.error(err);
            res.status(500).send('Database error');
            return;
        }
        res.json(results);
    });
});

// Serve static files
app.use(express.static(path.join(__dirname, '../public')));

// Serve protected files with authentication
// app.use('/auth_pages', isAuthenticated, express.static(path.join(__dirname, 'auth_pages')));
// app.use('/Topics', isAuthenticated, express.static(path.join(__dirname, 'Topics')));
app.get('/auth_pages/*', isAuthenticated, (req, res) => {
    const filePath = path.join(__dirname, '../auth_pages', req.params[0]);
    res.sendFile(filePath);
});

app.get('/Topics/*', isAuthenticated, (req, res) => {
    const filePath = path.join(__dirname, '../topics', req.params[0]);
    res.sendFile(filePath);
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}\n` );
});
