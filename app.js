const express = require('express');
const session = require('express-session');
const path = require('path');
require('dotenv').config();

const app = express();


const db = require('./db');

// Routes
const adminRoutes = require('./routes/admin');
const userRoutes = require('./routes/user');


// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Session
app.use(session({
  secret: process.env.SESSION_SECRET || 'thai-tour-secret',
  resave: false,
  saveUninitialized: false
}));

// View Engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Route Split
app.use('/admin', adminRoutes);  
app.use('/user', userRoutes);    

app.get('/', (req, res) => {
    res.render('home');
  });
  

// Start server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
