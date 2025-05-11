CREATE DATABASE ThaiTour;
USE ThaiTour;

-- USERS (นักท่องเที่ยว)
CREATE TABLE Users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100),
    email VARCHAR(100) UNIQUE,
    password VARCHAR(255),
    phone VARCHAR(20)
);

-- ADMINS (ผู้ดูแลระบบ)
CREATE TABLE Admins (
    admin_id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(100) UNIQUE,
    password VARCHAR(255)
);

-- TOURIST SPOTS (สถานที่ท่องเที่ยว)
CREATE TABLE TouristSpots (
    spot_id INT AUTO_INCREMENT PRIMARY KEY,
    spot_name VARCHAR(100),
    location VARCHAR(100),
    date DATE,
    price DECIMAL(10, 2),
    image_path VARCHAR(255)
);

-- GUIDES (ไกด์นำเที่ยว)
CREATE TABLE Guides (
    guide_id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100),
    phone VARCHAR(20),
    language_spoken VARCHAR(100)
);

-- BOOKINGS (การจอง)
CREATE TABLE Bookings (
    booking_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    guide_id INT,
    spot_id INT,
    booking_date DATE,
    number_of_people INT,
    status ENUM('booked', 'cancelled', 'completed') DEFAULT 'booked',
    FOREIGN KEY (user_id) REFERENCES Users(user_id),
    FOREIGN KEY (guide_id) REFERENCES Guides(guide_id),
    FOREIGN KEY (spot_id) REFERENCES TouristSpots(spot_id)
);

-- RATINGS (การให้คะแนน)
CREATE TABLE Ratings (
    rating_id INT AUTO_INCREMENT PRIMARY KEY,
    booking_id INT,
    rating INT CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    FOREIGN KEY (booking_id) REFERENCES Bookings(booking_id)
);
