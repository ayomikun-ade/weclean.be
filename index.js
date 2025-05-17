const express = require("express");
const cors = require("cors");
const db = require("./dbConfig");
const bodyParser = require("body-parser");

const app = express();

app.use(
  cors({
    origin: "http://localhost:5173", // Front-end URL
    methods: ["GET", "POST"],
  })
);

app.use(bodyParser.json());

app.use(express.json());

require("dotenv").config();

const PORT = process.env.PORT || 8000;

//test endpoint
app.get("/", (req, res) => {
  res.send("Test endpoint is working!");
});

// ADMIN ENDPOINTS
// admin login endpoint
app.post("/api/admin-login", async (req, res) => {
  const { id, password } = req.body;

  const sql = `SELECT * FROM admins WHERE admin_id = $1`;
  try {
    const result = await db.query(sql, [id]);
    if (result.rows.length === 0) {
      return res.status(401).json({ message: "Invalid email or password" });
    }
    const admin = result.rows[0];
    if (password === admin.password) {
      res.status(200).json(admin);
    } else {
      res.status(401).json({ message: "Invalid Credentials" });
    }
  } catch (err) {
    console.error("Database error:", err);
    res.status(500).json({ message: "Error fetching admin data" });
  }
});

// get all customer details
app.get("/api/customers", async (req, res) => {
  const sql = `
    SELECT 
      c.*, 
      COUNT(b.booking_id) AS total_sessions 
    FROM customers c 
    LEFT JOIN bookings b ON c.id = b.customer_id 
    GROUP BY c.id;
  `;

  try {
    const result = await db.query(sql);
    res.status(200).json(result.rows);
  } catch (err) {
    console.error(`Error from database: ${err.message}`);
    res
      .status(500)
      .json({ message: "Database query error", error: err.message });
  }
});

// get all staff details
app.get("/api/staffs", async (req, res) => {
  const sql = `SELECT st.*, COUNT(b.booking_id) AS total_sessions FROM staff st LEFT JOIN bookings b ON st.staff_id = b.staff_id GROUP BY st.staff_id;`;
  try {
    const result = await db.query(sql);
    res.status(200).json(result.rows);
  } catch (err) {
    console.error(`Error from database: ${err.message}`);
    res
      .status(500)
      .json({ message: "Database query error", error: err.message });
  }
});

// get all services
app.get("/api/services", async (req, res) => {
  const sql = `SELECT * from services`;
  try {
    const result = await db.query(sql);
    res.status(200).json(result.rows);
  } catch (err) {
    console.error(`Error from database: ${err.message}`);
    res
      .status(500)
      .json({ message: "Database query error", error: err.message });
  }
});

// get all bookings
app.get("/api/bookings", async (req, res) => {
  const sql = `SELECT b.*, s.service_name FROM bookings b JOIN services s ON b.service_id = s.service_id;`;
  try {
    const result = await db.query(sql);
    res.status(200).json(result.rows);
  } catch (err) {
    console.error(`Error from database: ${err.message}`);
    res
      .status(500)
      .json({ message: "Database query error", error: err.message });
  }
});

// add a staff
app.post("/api/add-staff", async (req, res) => {
  const { id, name, email, phone, password } = req.body;

  const sql = `
    INSERT INTO staff (staff_id, name, email, phone, password)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *;
  `;

  try {
    const result = await db.query(sql, [id, name, email, phone, password]);
    return res.status(201).json(result.rows[0]); // return inserted staff
  } catch (err) {
    if (err.code === "23505") {
      // PostgreSQL unique violation error
      return res.status(400).json({ message: "Staff already exists" });
    } else {
      console.error(`Database error: ${err.message}`);
      return res.status(500).json({
        message: "Database query error",
        error: err.message,
      });
    }
  }
});

//add a new service
app.post("/api/add-service", async (req, res) => {
  const { name, description, price } = req.body;

  const sql = `INSERT INTO services (service_name, service_description, price) VALUES ($1,$2,$3) RETURNING *`;
  try {
    const result = await db.query(sql, [name, description, price]);
    return res.status(201).json(result.rows[0]); // return inserted staff
  } catch (err) {
    if (err.code === "23505") {
      // PostgreSQL unique violation error
      return res.status(400).json({ message: "Service already exists" });
    } else {
      console.error(`Database error: ${err.message}`);
      return res.status(500).json({
        message: "Database query error",
        error: err.message,
      });
    }
  }
});

// delete a staff
app.post("/api/delete-staff", async (req, res) => {
  const { id } = req.body;

  const sql = `DELETE FROM staff WHERE staff_id = $1 RETURNING *;`;
  try {
    const result = await db.query(sql, [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Staff not found" });
    }
    res.status(200).json({
      message: "Staff deleted successfully",
      deleted: result.rows[0],
    });
  } catch (err) {
    console.error("Error deleting staff:", err.message);
    res
      .status(500)
      .json({ message: "Error deleting staff", error: err.message });
  }
});

// delete a service
app.post("/api/delete-service", async (req, res) => {
  const { id } = req.body;

  const sql = `DELETE FROM services WHERE service_id = $1 RETURNING *`;
  try {
    const result = await db.query(sql, [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Service not found" });
    }
    res.status(200).json({
      message: "Service deleted successfully",
      deleted: result.rows[0],
    });
  } catch (err) {
    console.error("Error deleting Service:", err.message);
    res
      .status(500)
      .json({ message: "Error deleting Service", error: err.message });
  }
});

// ALL CUSTOMER ENDPOINTS
// Customer registration
app.post("/api/register", async (req, res) => {
  const { fname, lname, email, phone, cpassword } = req.body;

  const sql = `
    INSERT INTO customers (fname, lname, email, phone, cpassword)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *;
  `;
  try {
    const result = await db.query(sql, [fname, lname, email, phone, cpassword]);
    return res.status(201).json({
      message: "Customer registered successfully",
      customer: result.rows[0],
    });
  } catch (err) {
    if (err.code === "23505") {
      return res.status(400).json({ message: "Email already exists" });
    } else {
      console.error(`Database error: ${err.message}`);
      return res.status(500).json({
        message: "Database query error",
        error: err.message,
      });
    }
  }
});

// customer login
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;

  const sql = `SELECT * FROM customers WHERE email = $1  `;
  try {
    const result = await db.query(sql, [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ message: "Invalid email or password" });
    }
    const customer = result.rows[0];
    if (password === customer.cpassword) {
      res.status(200).json(customer);
    } else {
      res.status(401).json({ message: "Invalid Credentials" });
    }
  } catch (err) {
    console.error("Database error:", err);
    res.status(500).json({ message: "Error fetching customer data" });
  }
});

// get user credentials
app.post("/api/get-user", async (req, res) => {
  const { email } = req.body;

  const sql = `SELECT * FROM customers WHERE email = $1`;
  try {
    const result = await db.query(sql, [email]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error("Error fetching email data:", err.message);
    res
      .status(500)
      .json({ message: "Error fetching email data", error: err.message });
  }
});

// get all services
app.get("/api/get-services", async (req, res) => {
  const sql = `SELECT * FROM services`;

  try {
    const result = await db.query(sql);
    res.status(200).json(result.rows);
  } catch (err) {
    console.error("Error fetching services:", err.message);
    res
      .status(500)
      .json({ message: "Error fetching services", error: err.message });
  }
});

// book a session
app.post("/api/book-session", async (req, res) => {
  const { customer_id, date, time, service_name, location } = req.body;

  try {
    // Step 1: Get service_id based on service_name
    const serviceQuery = `SELECT service_id FROM services WHERE service_name = $1`;
    const serviceResult = await db.query(serviceQuery, [service_name]);
    if (serviceResult.rows.length === 0) {
      return res.status(404).json({ message: "Service not found" });
    }
    const service_id = serviceResult.rows[0].service_id;

    // Step 2: Insert booking
    const insertQuery = `
      INSERT INTO bookings (customer_id, service_id, booking_date, booking_time, location)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
    `;
    const bookingResult = await db.query(insertQuery, [
      customer_id,
      service_id,
      date,
      time,
      location,
    ]);
    res.status(201).json({
      message: "Booking session created successfully",
      booking: bookingResult.rows[0],
    });
  } catch (err) {
    console.error("Error creating booking session:", err.message);
    res.status(500).json({
      message: "Error creating booking session",
      error: err.message,
    });
  }
});

// get user sessions
app.post("/api/get-sessions", async (req, res) => {
  const { id } = req.body;

  const sql = `
    SELECT 
      b.*, 
      s.service_name, 
      s.price 
    FROM bookings b 
    JOIN services s ON b.service_id = s.service_id 
    WHERE b.customer_id = $1
    ORDER BY b.booking_date DESC, b.booking_time DESC;
  `;
  try {
    const result = await db.query(sql, [id]);
    res.status(200).json(result.rows);
  } catch (err) {
    console.error("Error fetching sessions data:", err.message);
    res
      .status(500)
      .json({ message: "Error fetching sessions data", error: err.message });
  }
});

// delete a cleaning session
app.post("/api/delete-session", async (req, res) => {
  const { id } = req.body;

  const sql = `DELETE FROM bookings WHERE booking_id = $1 RETURNING *;`;
  try {
    const result = await db.query(sql, [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Session not found" });
    }
    res.status(200).json({
      message: "Session deleted successfully",
      deleted: result.rows[0],
    });
  } catch (err) {
    console.error("Error deleting session:", err.message);
    res.status(500).json({
      message: "Error deleting session data",
      error: err.message,
    });
  }
});

// ALL STAFF ENDPOINTS
// staff login
app.post("/api/staff-login", async (req, res) => {
  const { id, password } = req.body;

  const sql = `SELECT * FROM staff WHERE staff_id = $1`;
  try {
    const result = await db.query(sql, [id]);
    if (result.rows.length === 0) {
      return res.status(401).json({ message: "Invalid ID or password" });
    }
    const staff = result.rows[0];
    if (password === staff.password) {
      return res.status(200).json(staff);
    } else {
      return res.status(401).json({ message: "Invalid Credentials" });
    }
  } catch (err) {
    console.error("Error fetching staff data:", err.message);
    res.status(500).json({
      message: "Error fetching staff data",
      error: err.message,
    });
  }
});

// get all customer session
app.get("/api/get-all-sessions", async (req, res) => {
  const sql = `
    SELECT b.*, s.service_name, c.fname, c.lname
    FROM bookings b
    JOIN services s ON b.service_id = s.service_id
    JOIN customers c ON b.customer_id = c.id;
  `;

  try {
    const result = await db.query(sql);
    res.status(200).json(result.rows);
  } catch (err) {
    console.error("Error getting sessions data:", err.message);
    res
      .status(500)
      .json({ message: "Error getting sessions data", error: err.message });
  }
});

// get staff details
app.post("/api/get-staff", async (req, res) => {
  const { email } = req.body;

  const sql = `SELECT * FROM staff WHERE email = $1`;

  try {
    const result = await db.query(sql, [email]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Staff not found" });
    }

    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error("Error fetching staff data:", err.message);
    res
      .status(500)
      .json({ message: "Error fetching staff data", error: err.message });
  }
});

// accept a session
app.post("/api/accept-session", async (req, res) => {
  const { id, staff_id } = req.body;

  const sql = `
    UPDATE bookings 
    SET acceptance_status = TRUE, staff_id = $1 
    WHERE booking_id = $2
    RETURNING *;
  `;

  try {
    const result = await db.query(sql, [staff_id, id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Booking not found" });
    }

    res.status(200).json({
      message: "Session accepted successfully",
      updated: result.rows[0],
    });
  } catch (err) {
    console.error("Error accepting session:", err.message);
    res
      .status(500)
      .json({ message: "Error accepting session", error: err.message });
  }
});

// complete a session
app.post("/api/complete-session", async (req, res) => {
  const { id } = req.body;

  const sql = `
    UPDATE bookings 
    SET session_status = TRUE 
    WHERE booking_id = $1
    RETURNING *;
  `;

  try {
    const result = await db.query(sql, [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Booking not found" });
    }

    res.status(200).json({
      message: "Session marked as completed",
      updated: result.rows[0],
    });
  } catch (err) {
    console.error("Error updating session:", err.message);
    res
      .status(500)
      .json({ message: "Error completing session", error: err.message });
  }
});

// get all staff sessions
app.post("/api/get-staff-sessions", async (req, res) => {
  const { email } = req.body;

  const sql = `
    SELECT 
      b.*,
      s.service_name,
      s.price,
      c.fname, 
      c.lname,
      st.email
    FROM bookings b
    JOIN services s ON b.service_id = s.service_id
    JOIN customers c ON b.customer_id = c.id
    JOIN staff st ON b.staff_id = st.staff_id
    WHERE st.email = $1;
  `;

  try {
    const result = await db.query(sql, [email]);

    res.status(200).json(result.rows);
  } catch (err) {
    console.error("Error getting sessions data:", err.message);
    res.status(500).json({
      message: "Error getting sessions data",
      error: err.message,
    });
  }
});

app.listen(PORT, () => {
  console.log(`Listening on PORT ${PORT}`);
});
