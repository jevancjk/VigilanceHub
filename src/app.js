/* BACKEND app.js ROUTES LINE GUIDE (to nearest ten) (UPDATE if new routes are added)
Connect to database, SMTP email transporter, Create session: 40-70
Run the backend, Check authentication: 70-100
Register, Email confirmation: 100-210
Login, Forgot/Reset password, Logout: 210-350
Profile, Edit Profile, Delete account: 350-630
Forum posts/comments functions: 640-710
Quiz functions: 720-870
*/

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
const fs = require('fs');
const csvParser = require('csv-parser');

const app = express();
const port = 3000;

const corsSession = {
    origin: 'http://127.0.0.1:5500', // must point to frontend to ensure backend and frontend can communicate
    credentials: true,
};

app.use(cors(corsSession));

app.use(bodyParser.json());

// for static files from /public
app.use(express.static(path.join(__dirname, '../public')));

// use Axios from 'node_modules' folder for most backend routes/paths
app.use('/js', express.static(path.join(__dirname, '../node_modules/axios/dist')));

// Edit credentials if your password or database name is different in MySQL Workbench in your local machine
const pool = mysql.createPool({
    connectionLimit: 10,
    host: 'localhost',
    user: 'root',
    password: 'Password4291',
    database: 'vigilancehub'
});

// Edit credentials if you are using a different email address for sending emails
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    auth: {
        user: 'vigillancehub.help@gmail.com',
        pass: 'tbhb iwwv iwws gbbq'
    }
});

// Create session. Edit variables if you plan to change
const sessionStore = new MySQLStore({}, pool);
app.use(session({
    key: 'login_session',
    secret: '2kBiHWJxajgjYisdTo+aYJB9KbwwL3dZYPTEIht0KaI=',
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 43200000 // 12 hours
    }
}));

// to indicate that port 3000 is open whenever `node src/app.js` is run
app.listen(port, () => {
    console.log(`Server running on http://127.0.0.1:${port}\n` );
});

// Check if user is authenticated (for files in 'auth_pages' folder)
const isAuthenticated = (req, res, next) => {
    if (!req.session.userID) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    next();
};

// For pages which require authentication
app.get('/auth_pages/*', isAuthenticated, (req, res) => {
    const filePath = path.join(__dirname, '/auth_pages', req.params[0]);
    res.sendFile(filePath);
});

// used in checkAuth.js
app.get('/checkAuth', (req, res) => {
    console.log(req.session);
    if (req.session.userID) {
        res.json({ authenticated: true, userID: req.session.userID, username: req.session.username });
    } else {
        res.status(401).json({ authenticated: false });
    }
});

// used in register.js
app.post('/register', async (req, res) => {
    const { username, email, password } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const sql = "INSERT INTO users (username, email, password, emailConfirmed) VALUES (?, ?, ?, 0)";
        pool.query(sql, [username, email, hashedPassword], async (err, results) => {
            if (err) {
                console.error(err);
                res.status(500).json({ success: false, message: 'Failed to register. Database error' });
                return;
            }

            // generate a 20-byte confirmation token and link
            const token = crypto.randomBytes(20).toString('hex');
            const confirmationLink = `http://127.0.0.1:3000/confirm/${token}`; // activate email confirm route with token

            const tokenExpiry = new Date();
            tokenExpiry.setMinutes(tokenExpiry.getMinutes() + 10);

            // save confirmation token to database
            const tokenSql = "UPDATE users SET confirmationToken = ?, tokenExpiry = ? WHERE email = ?";
            pool.query(tokenSql, [token, tokenExpiry, email], (err) => {
                if (err) {
                    console.error('Error saving token:', err);
                    res.status(500).json({ success: false, message: 'Failed to save confirmation token. Server error' });
                    return;
                }

                const message = `
                    <p>You are registering an account with VigilanceHub. Please click the link below to confirm your registration within 10 minutes:</p>
                    <a href="${confirmationLink}">Confirm your registration</a>
                `;
                transporter.sendMail({
                    from: 'vigillancehub.help@gmail.com',
                    to: email,
                    subject: 'VigilanceHub Confirm Registration',
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

// used in backend /register
app.get('/confirm/:token', (req, res) => {
    const { token } = req.params;

    // get token details from database
    const sql = "SELECT emailConfirmed, tokenExpiry FROM users WHERE confirmationToken = ?";
    pool.query(sql, [token], (err, results) => {
        if (err) {
            console.error(err);
            res.status(500).send('Error confirming registration.');
            return;
        }
        
        if (results.length === 0) {
            res.status(400).send('Invalid or expired token.');
            return;
        }

        const user = results[0];
        const currentDate = new Date();
        if (currentDate > new Date(user.tokenExpiry)) {
            // if token expired, delete row from database
            pool.query("DELETE FROM users WHERE confirmationToken = ?", [token], (err) => {
                if (err) {
                    console.error('Error deleting expired token:', err);
                    res.status(500).send('Error processing expired token.');
                    return;
                }
                setTimeout(() => {
                    res.redirect('http://127.0.0.1:5500/misc_html/registration_expired.html');
                }, 1500);
            });
            return;
        }

        // if valid token, delete value of confirmation token and token expiry date
        const updateSql = "UPDATE users SET emailConfirmed = 1, confirmationToken = NULL, tokenExpiry = NULL WHERE confirmationToken = ?";
        pool.query(updateSql, [token], (err) => {
            if (err) {
                console.error(err);
                res.status(500).send('Error confirming registration.');
                return;
            }
            setTimeout(() => {
                res.redirect('http://127.0.0.1:5500/misc_html/registration_success.html');
            }, 1500);
        });
    });
});

// used in login.js
app.post('/login', (req, res) => {
    const { credential, password } = req.body;

    // check if username or email matches any entry in database
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
        res.json({ success: true, userID: user.userID, username: user.username, message: 'Login success' });
    });
});

// used in reset_password.js
app.post('/forgot-password', (req, res) => {
    const { email } = req.body;

    const token = crypto.randomBytes(20).toString('hex');
    const resetLink = `http://127.0.0.1:3000/reset-password/${token}`;
    const tokenExpiry = new Date();
    tokenExpiry.setMinutes(tokenExpiry.getMinutes() + 10);

    const sql = "UPDATE users SET confirmationToken = ?, tokenExpiry = ? WHERE email = ?";
    pool.query(sql, [token, tokenExpiry, email], (err, results) => {
        if (err || results.affectedRows === 0) {
            console.error('Error saving reset token:', err);
            return res.status(500).json({ success: false, message: 'Failed to process request. Please try again.' });
        }

        const message = `
            <p>You are requesting to reset your password. Please click the link below to do so within 10 minutes:</p>
            <a href="${resetLink}">Reset Password</a>
        `;
        transporter.sendMail({
            from: 'vigillancehub.help@gmail.com',
            to: email,
            subject: 'VigilanceHub Password Reset',
            html: message,
        }, (error, info) => {
            if (error) {
                console.error('Error sending email:', error);
                return res.status(500).json({ success: false, message: 'Failed to send reset email.' });
            }
            res.json({ success: true, message: 'An email has been sent with instructions to reset your password. Please follow the instructions within 10 minutes.' });
        });
    });
});

app.get('/reset-password/:token', (req, res) => {
    // Redirect to reset_password.html when email link is clicked
    const { token } = req.params;
    setTimeout(() => {
        res.redirect(`http://127.0.0.1:5500/misc_html/reset_password.html?token=${token}`);   
    }, 1000);
    return;
});

app.post('/reset-password/:token', async (req, res) => {
    const { token } = req.params;
    const { newPassword } = req.body;

    const sql = "SELECT tokenExpiry FROM users WHERE confirmationToken = ?";
    pool.query(sql, [token], async (err, results) => {
        if (err || results.length === 0) {
            return res.status(400).json({ success: false, message: 'Invalid or expired link.' });
        }

        const currentDate = new Date();
        if (currentDate > new Date(results[0].tokenExpiry)) {
            // delete token to prevent SQL injection
            const resetExpiredSql = "UPDATE users SET confirmationToken = NULL, tokenExpiry = NULL WHERE confirmationToken = ?";
            pool.query(resetExpiredSql, [token], (resetErr) => {
                if (resetErr) {
                    console.error('Error deleting expired token:', resetErr);
                    return res.status(500).json({ success: false, message: 'Failed to process expired token.' });
                }
                return res.status(400).json({ success: false, message: 'Reset link expired.' });
            });
            return;
        }
       
        try {
            const hashedPassword = await bcrypt.hash(newPassword, 10);
            const updateSql = "UPDATE users SET password = ?, confirmationToken = NULL, tokenExpiry = NULL WHERE confirmationToken = ?";
            pool.query(updateSql, [hashedPassword, token], (err) => {
                if (err) {
                    console.error('Error updating password:', err);
                    return res.status(500).json({ success: false, message: 'Failed to reset password.' });
                }
                res.json({ success: true, message: 'Password reset successfully.' });
            });
        } catch (error) {
            console.error('Error hashing password:', error);
            return res.status(500).json({ success: false, message: 'Server error occurred.' });
        }
    });
});

// used in logout.js
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

// used in profile.js
app.get('/user-details', (req, res) => {
    const userID = req.session.userID;

    if (!userID) {
        return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    const dispAvatarQuery = 'SELECT avatar FROM users WHERE userID = ?';
    const dispPostsQuery = `SELECT postID, postTitle, postDate FROM posts WHERE userID = ? ORDER BY postDate DESC`;

    // Get user's avatar first
    pool.query(dispAvatarQuery, [userID], (err, avatarResults) => {
        if (err) {
            console.error('Error querying avatar:', err);
            return res.status(500).json({ success: false, message: 'Server error' });
        }

        if (avatarResults.length > 0) {
            const avatar = avatarResults[0].avatar || null;

            // Get the user's posts after getting avatar
            pool.query(dispPostsQuery, [userID], (err, postsResults) => {
                if (err) {
                    console.error('Error querying posts:', err);
                    return res.status(500).json({ success: false, message: 'Server error' });
                }

                res.json({
                    success: true,
                    avatar,
                    posts: postsResults // display both avatar and posts on profile.html
                });
            });
        } else {
            res.status(400).json({ success: false, message: 'User not found' });
        }
    });
});

// used in profile.js and training.js
app.get('/user-scores', (req, res) => {
    const username = req.query.username;

    if (!username) {
        return res.status(400).json({ error: 'Username is required' });
    }

    const sql = `SELECT pre_training, topic1, topic2, topic3, topic4, topic5, topic6, topic7, topic8, post_training
                 FROM users WHERE username = ?`;

    pool.query(sql, [username], (err, results) => {
        if (err) {
            console.error('Error fetching user scores:', err);
            return res.status(500).json({ error: 'Failed to fetch user scores' });
        }

        if (results.length > 0) {
            return res.json(results[0]); // Send the scores as the response
        } else {
            return res.status(404).json({ error: 'User not found' });
        }
    });
});

// used in edit_profile.js
app.get('/profile', (req, res) => {
    const userID = req.session.userID;

    if (!userID) {
        return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    const sqlGetProfile = 'SELECT username, avatar FROM users WHERE userID = ?';
    pool.query(sqlGetProfile, [userID], (err, results) => {
        if (err) {
            console.error('Error fetching profile:', err);
            return res.status(500).json({ success: false, message: 'Server error' });
        }

        if (results.length === 0) {
            return res.status(404).json({ success: false, message: 'Profile not found' });
        }

        // Send the user's profile details to the frontend
        const { username, avatar } = results[0];
        res.json({ success: true, username, avatar });
    });
});

app.post('/check-password', (req, res) => {
    const userID = req.session.userID;
    const { currentPassword } = req.body;

    if (!userID) {
        return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    const sqlCheckPassword = 'SELECT password FROM users WHERE userID = ?';
    pool.query(sqlCheckPassword, [userID], async (err, results) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Server error' });
        }

        if (results.length === 0) {
            return res.status(400).json({ success: false, message: 'User not found' });
        }

        // Verify current password
        const match = await bcrypt.compare(currentPassword, results[0].password);
        if (match) {
            res.json({ success: true });
        } else {
            res.status(400).json({ success: false, message: 'Incorrect password' });
        }
    });
});

app.post('/edit-profile', (req, res) => {
    const userID = req.session.userID;
    // const { currentPassword, newUsername, newPassword, chooseAvatar } = req.body;
    const { currentPassword, newUsername, newPassword } = req.body;

    if (!userID) {
        return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    // Validate old password
    const sqlCheckPassword = 'SELECT password FROM users WHERE userID = ?';
    pool.query(sqlCheckPassword, [userID], async (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ success: false, message: 'Server error' });
        }

        if (results.length === 0) {
            return res.status(400).json({ success: false, message: 'User not found' });
        }

        const match = await bcrypt.compare(currentPassword, results[0].password);
        if (!match) {
            return res.status(400).json({ success: false, message: 'Incorrect password' });
        }

        // Update username, password, and/or avatar
        let updates = [];
        let values = [];

        if (newUsername) {
            updates.push('username = ?');
            values.push(newUsername);
        }

        if (newPassword) {
            const hashedPassword = await bcrypt.hash(newPassword, 10);
            updates.push('password = ?');
            values.push(hashedPassword);
        }

        const chooseAvatar = req.body.avatar;
        if (chooseAvatar) {
            const avatarPath = chooseAvatar ? `${chooseAvatar}` : null;
            updates.push('avatar = ?');
            values.push(avatarPath);
        }

        if (updates.length > 0) {
            const sqlUpdate = `UPDATE users SET ${updates.join(', ')} WHERE userID = ?`;
            values.push(userID);

            pool.query(sqlUpdate, values, (err, results) => {
                if (err) {
                    console.error(err);
                    return res.status(500).json({ success: false, message: 'Error updating profile' });
                }

                // Change uploader of forum post/comment to the new username if needed
                if (newUsername) {
                    const updatePostsSQL = `UPDATE posts SET username = ? WHERE userID = ?`;
                    const updateCommentsSQL = `UPDATE comments SET username = ? WHERE userID = ?`;

                    pool.query(updatePostsSQL, [newUsername, userID], (err, results) => {
                        if (err) {
                            console.error(err);
                            return res.status(500).json({ success: false, message: 'Post update failed' });
                        }

                        pool.query(updateCommentsSQL, [newUsername, userID], (err, results) => {
                            if (err) {
                                console.error(err);
                                return res.status(500).json({ success: false, message: 'Comment update failed' });
                            }

                            res.json({ success: true, message: 'Profile updated' });
                        });
                    });
                } else {
                    res.json({ success: true, message: 'Profile updated' });
                }
            });
        } else {
            res.status(400).json({ success: false, message: 'No updates provided' });
        }
    });
});

app.post('/delete-account', (req, res) => {
    const userID = req.session.userID;

    if (!userID) {
        return res.status(401).json({ success: false, message: 'Not logged in' });
    }

    // Get a connection from pool
    pool.getConnection((err, connection) => {
        if (err) {
            console.error('Error getting connection from pool:', err);
            return res.status(500).json({ success: false, message: 'Failed to get database connection' });
        }

        connection.beginTransaction((err) => {
            if (err) {
                console.error('Error starting transaction:', err);
                connection.release(); // after each query, release connection to avoid connection leaks
                return res.status(500).json({ success: false, message: 'Failed to start transaction' });
            }

            const deleteUserComments = 'DELETE FROM comments WHERE userID = ?';
            connection.query(deleteUserComments, [userID], (err, result) => {
                if (err) {
                    return connection.rollback(() => {
                        connection.release();
                        console.error('Error deleting comments:', err);
                        return res.status(500).json({ success: false, message: 'Failed to delete comments' });
                    });
                }

                const deleteUserPosts = 'DELETE FROM posts WHERE userID = ?';
                connection.query(deleteUserPosts, [userID], (err, result) => {
                    if (err) {
                        return connection.rollback(() => {
                            connection.release(); 
                            console.error('Error deleting posts:', err);
                            return res.status(500).json({ success: false, message: 'Failed to delete posts' });
                        });
                    }

                    const deleteUser = 'DELETE FROM users WHERE userID = ?';
                    connection.query(deleteUser, [userID], (err, result) => {
                        if (err) {
                            return connection.rollback(() => {
                                connection.release();
                                console.error('Error deleting user:', err);
                                return res.status(500).json({ success: false, message: 'Failed to delete user' });
                            });
                        }

                        connection.commit((err) => {
                            if (err) {
                                return connection.rollback(() => {
                                    connection.release(); 
                                    console.error('Error committing transaction:', err);
                                    return res.status(500).json({ success: false, message: 'Failed to complete transaction' });
                                });
                            }

                            // destroy session upon successful deletion of user
                            req.session.destroy((err) => {
                                if (err) {
                                    connection.release();
                                    console.error('Error destroying session:', err);
                                    return res.status(500).json({ success: false, message: 'Failed to log out' });
                                }
                                
                                // delete cookie ID and value
                                res.clearCookie('login_session');
                                connection.release();
                                return res.json({ success: true, message: 'Account deleted successfully' });
                            });
                        });
                    });
                });
            });
        });
    });
});

// used in forum.js
app.post('/posts', (req, res) => {
    const userID = req.session.userID;
    const username = req.session.username;
    console.log(req.session);
    
    const { postTitle, postText } = req.body;

    const sql = 'INSERT INTO posts (userID, username, postTitle, postText) VALUES (?, ?, ?, ?)';
    pool.query(sql, [userID, username, postTitle, postText], (error, results) => {
        if (error) throw error;
        res.status(201).send({ postID: results.insertId });
    });
});

// Display posts on forum.html, with latest posts on top
app.get('/posts', (req, res) => {
    const sql = 'SELECT * FROM posts ORDER BY postID DESC';
    pool.query(sql, (error, results) => {
        if (error) throw error;
        res.send(results);
    });
});

// Open an existing post
app.get('/posts/:postID', (req, res) => {
    const { postID } = req.params;
    const sql = 'SELECT * FROM posts WHERE postID = ?';
    pool.query(sql, [postID], (error, results) => {
        if (error) throw error;
        res.send(results[0]);
    });
});

// Comment on an existing post
app.post('/posts/:postID/comments', (req, res) => {
    const { postID } = req.params;
    const { commentText } = req.body;
    const userID = req.session.userID;
    const username = req.session.username;

    const sql = 'INSERT INTO comments (postID, userID, username, commentText) VALUES (?, ?, ?, ?)';
    pool.query(sql, [postID, userID, username, commentText], (error, results) => {
        if (error) throw error;
        res.status(201).send({ commentID: results.insertId });
    });
});

// Get comments for a specific post
app.get('/posts/:postID/comments', (req, res) => {
    const { postID } = req.params;
    const sql = 'SELECT * FROM comments WHERE postID = ?';
    pool.query(sql, [postID], (error, results) => {
        if (error) throw error;
        res.send(results);
    });
});

// (display latest comments on user's posts on homepage) used in index_userLogin.js
app.get('/user/:userID/latest-updates', (req, res) => {
    const { userID } = req.params;

    const sql = `
        SELECT c.commentID, c.postID, c.username, p.postTitle, c.commentDate 
        FROM comments c
        JOIN posts p ON c.postID = p.postID
        WHERE p.userID = ? AND c.userID != ?
        ORDER BY c.commentDate DESC LIMIT 3;
    `;

    pool.query(sql, [userID, userID], (error, results) => {
        if (error) {
            console.error('Error fetching latest updates:', error);
            res.status(500).json({ error: 'Error fetching latest updates' });
        } else {
            res.json(results);
        }
    });
});

// used in quiz.js
app.get('/quiz-questions', (req, res) => {
    const quizName = req.query.quiz;
    const userID = req.session.userID; // Assume user ID is stored in session

    if (!quizName) {
        return res.status(400).json({ error: "Quiz name not provided" });
    }

    // Database query to check user's quiz completion status
    const query = 'SELECT pre_training, topic1, topic2, topic3, topic4, topic5, topic6, topic7, topic8, post_training FROM users WHERE userID = ?';
    pool.query(query, [userID], (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }

        const quizStatus = results[0];
        if (!quizStatus) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (quizName === 'pre_training' && !quizStatus.pre_training) {
            // Allow access for pre_training quiz
        } 
        // if pre_training is not attempted and user tries to access topic1-8 quiz
        else if (quizName.startsWith('topic') && !quizStatus.pre_training) {
            return res.status(401).json({ error: 'Complete Pre-Training quiz first.' });
        } 
        // if not all topic quizzes have been attempted
        else if (quizName === 'post_training' && 
                  (!quizStatus.topic1 || !quizStatus.topic2 || !quizStatus.topic3 || !quizStatus.topic4 ||
                   !quizStatus.topic5 || !quizStatus.topic6 || !quizStatus.topic7 || !quizStatus.topic8)) {
            return res.status(401).json({ error: 'Complete all topic quizzes to unlock Post-Training quiz.' });
        }

        // load the quiz questions
        const csvFilePath = path.join(__dirname, `../public/quiz_csv/${quizName}.csv`);
        const questions = [];
        fs.createReadStream(csvFilePath)
            .pipe(csvParser())
            .on('data', (row) => {
                questions.push(row);
            })
            .on('end', () => {
                res.json({ questions });
            })
            .on('error', (error) => {
                res.status(500).json({ error: 'Failed to load quiz questions' });
            });
    });
});

app.post('/submit-quiz', (req, res) => {
    const { quizName, answers } = req.body;

    if (!quizName || !answers) {
        return res.status(400).json({ error: "Quiz name or answers not provided" });
    }

    const csvFilePath = path.join(__dirname, `../public/quiz_csv/${quizName}.csv`);
    const correctAnswers = [];
    let score = 0;

    // Read the CSV to check answers
    fs.createReadStream(csvFilePath)
        .pipe(csvParser())
        .on('data', (row) => {
            correctAnswers.push(row.correctAnswer); // collect correct answers from CSV file
        })
        .on('end', () => {
            // Compare user's answers with the correct answers
            answers.forEach((answer, index) => {
                if (answer === correctAnswers[index]) {
                    score++;
                }
            });
            
            res.json({ score, total: correctAnswers.length });
        })
        .on('error', (error) => {
            res.status(500).json({ error: 'Error in evaluating quiz' });
        });
});

app.post('/update-score', (req, res) => {
    const { quizName, username, score } = req.body;

    console.log('\nNew quiz result!')
    console.log(username + ' has scored ' + score + ' in ' + quizName + '\n');
    
    // Check if all required data is present
    if (!username || !quizName || score === undefined) {
        return res.status(400).json({ error: 'Username, Quiz name, or score not provided' });
    }

    const quizColumn = quizName;

    // Check if latest score is higher or lower than current score
    const checkCurrentScore = `SELECT ?? FROM users WHERE username = ?`;
    const currentParams = [quizColumn, username];
    
    pool.query(checkCurrentScore, currentParams, (err, results) => {
        if (err) {
            console.error('Error checking current score:', err);
            return res.status(500).json({ error: 'Failed to check current score' });
        }

        if (results.length === 0) {
            return res.status(404).json({ message: 'No user found to update' });
        }

        const currentScore = results[0][quizColumn];

        if (currentScore === null || score > currentScore) {
            // Update score if the new score is higher
            const updateSql = `UPDATE users SET ?? = ? WHERE username = ?`;
            const updateParams = [quizColumn, score, username];

            pool.query(updateSql, updateParams, (err, result) => {
                if (err) {
                    console.error('Error updating score in database:', err);
                    return res.status(500).json({ error: 'Failed to update score' });
                }

                if (result.affectedRows > 0) {
                    res.json({ message: 'Score updated successfully' });
                } else {
                    res.status(404).json({ message: 'No user found to update' });
                }
            });
        } else {
            return res.json({ message: 'Score not updated as it is not higher than old score' });
        }
    });
});

// (display quiz scores on homepage) used in index_userLogin.js
app.get('/user/:userID/quiz-homepage', (req, res) => {
    const { userID } = req.params;
    
    const sql = `
        SELECT topic1, topic2, topic3, topic4, topic5, topic6, topic7, topic8 
        FROM users WHERE userID = ?`;
    
    pool.query(sql, [userID], (error, results) => {
        if (error) {
            console.error('Error fetching quiz status:', error);
            res.status(500).json({ error: 'Error fetching quiz status' });
        } else {
            res.json(results[0]);
        }
    });
});
