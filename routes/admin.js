const express = require('express');
const router = express.Router();
const db = require('../db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Set up multer for image upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'public/uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

/* ----------------- AUTH ------------------ */

// Admin Login Page
router.get('/login', (req, res) => {
  res.render('admin/login', { error: null });
});

//  Admin Login
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  db.query('SELECT * FROM Admins WHERE email = ? AND password = ?', [email, password], (err, results) => {
    if (err) return res.send('Database error');
    if (results.length === 0) {
      return res.render('admin/login', { error: 'Invalid email or password' });
    }
    req.session.admin = results[0];
    res.redirect('/admin/dashboard');
  });
});

// Logout
router.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/admin/login');
});

/* ----------------- DASHBOARD ------------------ */

router.get('/dashboard', (req, res) => {
  if (!req.session.admin) return res.redirect('/admin/login');
  res.render('admin/dashboard', { admin: req.session.admin });
});

/* ----------------- TOURIST SPOTS ------------------ */

// Manage Tourist Spots Page
router.get('/spots', (req, res) => {
  db.query('SELECT * FROM TouristSpots', (err, spots) => {
    if (err) throw err;
    res.render('admin/manage-spots', { spots });
  });
});

//  Add Tourist Spot with image
router.post('/spots/add', upload.single('image'), (req, res) => {
  const { spot_name, location, date, price } = req.body;
  const image_path = req.file ? req.file.filename : null;

  const query = `
    INSERT INTO TouristSpots (spot_name, location, date, price, image_path)
    VALUES (?, ?, ?, ?, ?)
  `;
  db.query(query, [spot_name, location, date, price, image_path], (err) => {
    if (err) throw err;
    res.redirect('/admin/spots');
  });
});

// Delete Spot (with image deletion)
router.post('/spots/delete/:id', (req, res) => {
  const spotId = req.params.id;

  db.query('SELECT image_path FROM TouristSpots WHERE spot_id = ?', [spotId], (err, results) => {
    if (err) throw err;

    const imageFile = results[0]?.image_path;
    if (imageFile) {
      const filePath = path.join(__dirname, '../public/uploads', imageFile);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    db.query('DELETE FROM TouristSpots WHERE spot_id = ?', [spotId], (err) => {
      if (err) throw err;
      res.redirect('/admin/spots');
    });
  });
});

/* ----------------- GUIDES ------------------ */

// Manage Guides Page
router.get('/guides', (req, res) => {
  db.query('SELECT * FROM Guides', (err, guides) => {
    if (err) throw err;
    res.render('admin/manage-guides', { guides });
  });
});

// Add Guide with optional image
router.post('/guides/add', upload.single('image'), (req, res) => {
  const { full_name, phone, language_spoken } = req.body;
  const image_path = req.file ? req.file.filename : null;

  const query = `
    INSERT INTO Guides (full_name, phone, language_spoken, image_path)
    VALUES (?, ?, ?, ?)
  `;
  db.query(query, [full_name, phone, language_spoken, image_path], (err) => {
    if (err) throw err;
    res.redirect('/admin/guides');
  });
});

// Delete Guide
router.post('/guides/delete/:id', (req, res) => {
  const guideId = req.params.id;

  // Optional: ลบไฟล์รูปถ้ามี (ถ้าคุณเก็บ image_path สำหรับ guide)
  db.query('SELECT image_path FROM Guides WHERE guide_id = ?', [guideId], (err, results) => {
    if (err) throw err;

    const imageFile = results[0]?.image_path;
    if (imageFile) {
      const filePath = path.join(__dirname, '../public/uploads', imageFile);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    db.query('DELETE FROM Guides WHERE guide_id = ?', [guideId], (err) => {
      if (err) throw err;
      res.redirect('/admin/guides');
    });
  });
});

/* ----------------- USERS ------------------ */

// View User Bookings
// /routes/admin.js
router.get('/users', (req, res) => {
  const query = `
    SELECT 
      b.booking_id, b.booking_date, b.status,
      u.full_name AS user_name, u.email, u.phone,
      t.spot_name,
      g.full_name AS guide_name,
      r.rating,
      r.comment
    FROM Bookings b
    JOIN Users u ON b.user_id = u.user_id
    JOIN TouristSpots t ON b.spot_id = t.spot_id
    JOIN Guides g ON b.guide_id = g.guide_id
    LEFT JOIN Ratings r ON r.booking_id = b.booking_id
    ORDER BY b.booking_date DESC
  `;

  db.query(query, (err, results) => {
    if (err) throw err;
    res.render('admin/view-users', { bookings: results });
  });
});

// update-status
router.post('/bookings/update-status/:id', (req, res) => {
  const bookingId = req.params.id;
  const { status } = req.body;

  db.query('UPDATE Bookings SET status = ? WHERE booking_id = ?', [status, bookingId], (err) => {
    if (err) throw err;
    res.redirect('/admin/users');
  });
});


module.exports = router;
