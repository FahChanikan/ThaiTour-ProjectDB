const express = require('express');
const router = express.Router();
const db = require('../db');

// Login Page
router.get('/login', (req, res) => {
  res.render('user/login-user', { error: null });
});

// Handle Login
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  const query = 'SELECT * FROM Users WHERE email = ? AND password = ?';
  db.query(query, [email, password], (err, results) => {
    if (err) return res.send('Database error');
    if (results.length === 0) {
      return res.render('user/login-user', { error: 'Invalid email or password' });
    }

    req.session.user = results[0];
    res.redirect('/user/dashboard');
  });
});

// Dashboard
router.get('/dashboard', (req, res) => {
  if (!req.session.user) return res.redirect('/user/login');
  res.render('user/dashboard', { user: req.session.user });
});

// Tourist Spots
router.get('/spots', (req, res) => {
  db.query('SELECT * FROM TouristSpots', (err, spots) => {
    if (err) throw err;
    res.render('user/tourist-spots', { spots });
  });
});

// Booking Form
router.get('/book/:spot_id', (req, res) => {
  const spot_id = req.params.spot_id;

  db.query('SELECT * FROM TouristSpots WHERE spot_id = ?', [spot_id], (err, spotResults) => {
    if (err) throw err;
    if (spotResults.length === 0) return res.send('Tourist spot not found');

    db.query('SELECT * FROM Guides', (err, guides) => {
      if (err) throw err;

      res.render('user/booking', {
        spot: spotResults[0],
        guides: guides
      });
    });
  });
});

// Submit Booking
router.post('/book', (req, res) => {
  const { spot_id, guide_id, booking_date, number_of_people } = req.body;
  const user_id = req.session.user?.user_id;

  if (!user_id) return res.redirect('/user/login');

  const query = `
    INSERT INTO Bookings (user_id, guide_id, spot_id, booking_date, number_of_people)
    VALUES (?, ?, ?, ?, ?)
  `;
  db.query(query, [user_id, guide_id, spot_id, booking_date, number_of_people], (err) => {
    if (err) throw err;
    res.redirect('/user/bookings');
  });
});

// View My Bookings
router.get('/bookings', (req, res) => {
  const userId = req.session.user?.user_id;
  if (!userId) return res.redirect('/user/login');

  const query = `
    SELECT b.*, t.spot_name, g.full_name AS guide_name
    FROM Bookings b
    JOIN TouristSpots t ON b.spot_id = t.spot_id
    JOIN Guides g ON b.guide_id = g.guide_id
    WHERE b.user_id = ?
    ORDER BY b.booking_date DESC
  `;
  db.query(query, [userId], (err, bookings) => {
    if (err) throw err;
    res.render('user/booking-list', { bookings });
  });
});

// View All Guides with avg rating
router.get('/guides', (req, res) => {
  const sql = `
    SELECT g.*, ROUND(AVG(r.rating), 1) AS avg_rating
    FROM Guides g
    LEFT JOIN Bookings b ON g.guide_id = b.guide_id
    LEFT JOIN Ratings r ON r.booking_id = b.booking_id
    GROUP BY g.guide_id
  `;
  db.query(sql, (err, guides) => {
    if (err) throw err;
    res.render('user/guides', { guides });
  });
});


// Show all guides regardless of booking
router.get('/ratings', (req, res) => {
  db.query('SELECT guide_id, full_name FROM Guides', (err, guides) => {
    if (err) throw err;
    res.render('user/rating', { guides });
  });
});


// Submit Rating
router.post('/ratings/add', (req, res) => {
  const { guide_id, rating, comment } = req.body;
  const user_id = req.session.user?.user_id;
  if (!user_id) return res.redirect('/user/login');

  const query = `
    INSERT INTO Ratings (booking_id, rating, comment)
    VALUES (
      (SELECT booking_id FROM Bookings 
       WHERE user_id = ? AND guide_id = ? 
       ORDER BY booking_date DESC LIMIT 1),
      ?, ?
    )
  `;
  db.query(query, [user_id, guide_id, rating, comment], (err) => {
    if (err) return res.send('Cannot rate. Booking not found.');
    res.redirect('/user/ratings');
  });
});
// GET: Register Page
router.get('/register', (req, res) => {
  res.render('user/register', { error: null });
});

// POST: Register Submission
// POST: Register Submission
router.post('/register', (req, res) => {
  const { full_name, email, password, phone } = req.body;

  db.query('SELECT * FROM Users WHERE email = ?', [email], (err, results) => {
    if (err) return res.send('Database error');
    if (results.length > 0) {
      return res.render('user/register', { error: 'Email already exists' });
    }

    db.query('INSERT INTO Users (full_name, email, password, phone) VALUES (?, ?, ?, ?)',
      [full_name, email, password, phone],
      (err) => {
        if (err) return res.send('Insert error');
        res.redirect('/user/login');
      });
  });
});


// Logout
router.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/user/login');
});

module.exports = router;
