const express = require('express');
const app = express();
const userModel = require("./models/user");
const postModel = require("./models/post");
const cookieParser = require('cookie-parser');
const path = require('path');
const bcrypt = require('bcrypt');
const jwt = require("jsonwebtoken");

// Serve static files (e.g., HTML, CSS, JS)
app.use(express.static(path.join(__dirname,)));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'sign in.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'));
});



app.get('/profile', isLoggedIn, (req, res) => {
    const user = req.user;
    const profilePage = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>User Profile</title>
            <link rel="stylesheet" href="/profile.css">
        </head>
        <body>
            <div class="profile-container">
                <h2>Welcome to your Profile</h2>
                <div class="user-info">
                    <p><strong>Username:</strong> ${user.username}</p>
                    <p><strong>Name:</strong> ${user.name}</p>
                    <p><strong>Email:</strong> ${user.email}</p>
                    <p><strong>Age:</strong> ${user.age}</p>
                </div>
                <div class="logout">
                    <a href="/logout">Logout</a>
                </div>
            </div>
        </body>
        </html>
    `;
    res.send(profilePage);
});


// Register route
app.post('/register', async (req, res) => {
    let { name, username, age, email, password } = req.body;

    // Check if any required field is missing
    if (!email || !password || !username || !name || !age) {
        return res.status(400).send("All fields are required");
    }

    let user = await userModel.findOne({ email });
    if (user) return res.status(500).send("User already registered");

    bcrypt.genSalt(10, (err, salt) => {
        bcrypt.hash(password, salt, async (err, hash) => {
            let newUser = await userModel.create({
                username,
                name,
                email,
                age,
                password: hash,
            });

            // Create a JWT token for the new user
            let token = jwt.sign({
                email: email,
                userid: newUser._id
            }, "shhhh", { expiresIn: '1h' });

            // Set the token as a cookie
            res.cookie("token", token, { httpOnly: true });

            // Redirect to profile after successful registration
            res.redirect("/profile");
        });
    });
});

// Login route
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const user = await userModel.findOne({ username });

    if (!user) return res.status(500).send("User not found");

    bcrypt.compare(password, user.password, (err, result) => {
        if (result) {
            const token = jwt.sign({
                username: user.username,   // Include username in the token
                name: user.name,           // Include name in the token
                email: user.email,         // Include email in the token
                age: user.age,             // Include age in the token
                userid: user._id           // Include user id in the token
            }, "shhhh", { expiresIn: '1h' });

            res.cookie("token", token, { httpOnly: true });

            // Redirect to profile after successful login
            res.redirect("/profile");
        } else {
            res.status(401).send("Invalid username or password.");
        }
    });
});

// Logout route
app.get('/logout', (req, res) => {
    res.cookie("token", "", {
        httpOnly: true,
        expires: new Date(0) // Set the cookie to expire immediately
    });
    res.redirect("/login"); // Redirect to the login page after logout
});

// Middleware to check if the user is logged in
function isLoggedIn(req, res, next) {
    const token = req.cookies.token;

    if (!token) {
        return res.status(401).send("You must be logged in.");
    }

    // Verify and decode the token
    jwt.verify(token, "shhhh", (err, decoded) => {
        if (err) {
            return res.status(401).send("Invalid or expired token.");
        }

        // Attach the decoded user data to the request object
        req.user = decoded;
        next();
    });
}

// Start the server
app.listen(3000, () => {
    console.log('Server running on http://localhost:3000');
});

