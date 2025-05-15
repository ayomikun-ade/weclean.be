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
  return { hello: "world" };
});

//ADMIN ENDPOINTS

app.get("/api/customers", (req, res) => {
  const sql = `SELECT c.*, COUNT(b.booking_id) AS total_sessions FROM customers c LEFT JOIN bookings b ON c.id = b.customer_id GROUP BY c.id;`;
  db.query(sql, (err, results) => {
    if (err) {
      console.error(`Error from database, ${err.message}`);
      res.status(500).json("database query error", err.message);
      return;
    }
    return res.status(200).json(results);
  });
});

app.get("/api/staffs", (req, res) => {
  const sql = `SELECT st.*, COUNT(b.booking_id) AS total_sessions FROM staff st LEFT JOIN bookings b ON st.staff_id = b.staff_id GROUP BY st.staff_id;`;
  db.query(sql, (err, results) => {
    if (err) {
      console.error(`Error from database, ${err.message}`);
      res.status(500).json("database query error", err.message);
      return;
    }
    return res.status(200).json(results);
  });
});

app.get("/api/bookings", (req, res) => {
  const sql = `SELECT b.*, s.service_name FROM bookings b JOIN services s ON b.service_id = s.service_id;`;
  db.query(sql, (err, results) => {
    if (err) {
      console.error(`Error from database, ${err.message}`);
      res.status(500).json("database query error", err.message);
      return;
    }
    return res.status(200).json(results);
  });
});

app.get("/api/services", (req, res) => {
  const sql = `SELECT * from services`;
  db.query(sql, (err, results) => {
    if (err) {
      console.error(`Error from database, ${err.message}`);
      res.status(500).json("database query error", err.message);
      return;
    }
    return res.status(200).json(results);
  });
});

app.post("/api/add-staff", (req, res) => {
  const { id, name, email, phone, password } = req.body;

  const sql = `INSERT INTO staff (staff_id, name, email, phone, password) VALUES (?,?,?,?,?)`;
  db.query(sql, [id, name, email, phone, password], (err, results) => {
    if (err) {
      if (err.code === "ER_DUP_ENTRY") {
        // console.error(`Duplicate email error: ${err.message}`);
        return res.status(400).json({ message: "Staff already exists" });
      } else {
        // Handle other database errors
        console.error(`Database error: ${err.message}`);
        res
          .status(500)
          .json({ message: "database query error", error: err.message });
      }
      return;
    }
    return res.status(201).json(results);
  });
});

app.post("/api/add-service", (req, res) => {
  const { name, description, price } = req.body;

  const sql = `INSERT INTO services (service_name, service_description, price) VALUES (?,?,?)`;
  db.query(sql, [name, description, price], (err, results) => {
    if (err) {
      if (err.code === "ER_DUP_ENTRY") {
        // console.error(`Duplicate email error: ${err.message}`);
        return res.status(400).json({ message: "Staff already exists" });
      } else {
        // Handle other database errors
        console.error(`Database error: ${err.message}`);
        res
          .status(500)
          .json({ message: "database query error", error: err.message });
      }
      return;
    }
    return res.status(201).json(results);
  });
});

app.post("/api/admin-login", (req, res) => {
  // console.log(req.body);
  const { id, password } = req.body;

  const sql = `SELECT * FROM admins WHERE admin_id = ?  `;
  db.query(sql, [id], (err, results) => {
    if (err) {
      console.log(err);
      res.status(500).json({ message: "Error fetching email data" });
      return;
    }
    if (results.length === 0) {
      res.status(401).json({ message: "Invalid email or password" });
      return;
    }
    if (password === results[0].password) {
      // console.log(results[0]);
      res.status(200).json(results[0]);
    } else {
      res.status(401).json({ message: "Invalid Credentials" });
    }
  });
});

app.post("/api/delete-staff", (req, res) => {
  const { id } = req.body;
  // console.log(id);
  const sql = `DELETE FROM staff WHERE staff_id = ?`;
  db.query(sql, [id], (err, results) => {
    if (err) {
      console.log(err);
      res.status(500).json({ message: "Error deleting staff" });
      return;
    }
    // console.log(results);
    res.status(200).json(results);
  });
});

app.post("/api/delete-service", (req, res) => {
  const { id } = req.body;
  // console.log(req.body);
  const sql = `DELETE FROM services WHERE service_id = ?`;
  db.query(sql, [id], (err, results) => {
    if (err) {
      console.log(err);
      res.status(500).json({ message: "Error deleting service" });
      return;
    }
    // console.log(results);
    res.status(200).json(results);
  });
});

// REGISTRATION AND LOGIN ENDPOINTS FOR CUSTOMER

app.post("/api/register", (req, res) => {
  const { fname, lname, email, phone, cpassword } = req.body;

  const sql = `INSERT INTO customers (fname, lname, email, phone, cpassword) VALUES (?,?,?,?,?)`;
  db.query(sql, [fname, lname, email, phone, cpassword], (err, results) => {
    if (err) {
      if (err.code === "ER_DUP_ENTRY") {
        // console.error(`Duplicate email error: ${err.message}`);
        return res.status(400).json({ message: "Email already exists" });
      } else {
        // Handle other database errors
        console.error(`Database error: ${err.message}`);
        res
          .status(500)
          .json({ message: "database query error", error: err.message });
      }
      return;
    }
    return res.status(201).json(results);
  });
});

app.post("/api/login", (req, res) => {
  // console.log(req.body);
  const { email, password } = req.body;

  const sql = `SELECT * FROM customers WHERE email = ?  `;

  db.query(sql, [email], (err, results) => {
    // console.log(results);
    if (err) {
      console.log(err);
      res.status(500).json({ message: "Error fetching email data" });
      return;
    }
    if (results.length === 0) {
      res.status(401).json({ message: "Invalid email or password" });
      return;
    }
    if (password === results[0].cpassword) {
      // console.log(results);
      res.status(200).json(results[0]);
    } else {
      res.status(401).json({ message: "Invalid Credentials" });
    }
    // res.status(200).json({
    //   message: "successful login",
    //   results,
    // });
  });
});

//ALL ENDPOINTS FOR CUSTOMER

app.post("/api/get-user", (req, res) => {
  const { email } = req.body;
  // console.log(email);
  const sql = `SELECT * FROM customers WHERE email = ?`;
  db.query(sql, [email], (err, results) => {
    if (err) {
      console.log(err);
      res.status(500).json({ message: "Error fetching email data" });
      return;
    }
    res.status(200).json(results[0]);
  });
});

app.get("/api/get-services", (req, res) => {
  const sql = `SELECT * FROM services`;
  db.query(sql, (err, results) => {
    if (err) {
      console.log(err);
      res.status(500).json({ message: "Error fetching services" });
      return;
    }
    // console.log(results);
    res.status(200).json(results);
  });
});

app.post("/api/book-session", (req, res) => {
  // console.log(req.body);
  const { customer_id, date, time, service_name, location } = req.body;
  const sql = `SELECT service_id FROM services WHERE service_name = ?`;
  db.query(sql, [service_name], (err, results) => {
    if (err) {
      console.log(err);
      res.status(500).json({ message: "Error fetching service data" });
      return;
    }
    const service_id = results[0].service_id;

    const query = `INSERT INTO bookings (customer_id, service_id, booking_date, booking_time, location) VALUES (?,?,?,?,?)`;
    db.query(
      query,
      [customer_id, service_id, date, time, location],
      (err, results) => {
        if (err) {
          console.log(err);
          res.status(500).json({ message: "Error creating booking session" });
          return;
        }
        // console.log(results);
        return res.status(201).json(results);
      }
    );
  });
});

app.post("/api/get-sessions", (req, res) => {
  const { id } = req.body;
  // console.log(email);
  // const sql = `SELECT * FROM bookings WHERE customer_id = ?`;
  const sql = `SELECT b.*, s.service_name, s.price FROM bookings b JOIN services s ON b.service_id = s.service_id WHERE b.customer_id = ?`;
  db.query(sql, [id], (err, results) => {
    if (err) {
      console.log(err);
      res.status(500).json({ message: "Error fetching sessions data" });
      return;
    }
    // console.log(results);
    res.status(200).json(results);
  });
});

app.post("/api/delete-session", (req, res) => {
  const { id } = req.body;
  // console.log(id);
  const sql = `DELETE FROM bookings WHERE booking_id = ?`;
  db.query(sql, [id], (err, results) => {
    if (err) {
      console.log(err);
      res.status(500).json({ message: "Error deleting sessions data" });
      return;
    }
    // console.log(results);
    res.status(200).json(results);
  });
});

//ALL ENDPOINTS FOR STAFF

app.get("/api/get-all-sessions", (req, res) => {
  // const sql = `SELECT * FROM bookings`;
  const sql = `SELECT b.*,s.service_name,c.fname,c.lname
              FROM bookings b
              JOIN services s ON b.service_id = s.service_id
              JOIN customers c ON b.customer_id = c.id;
`;
  db.query(sql, (err, results) => {
    if (err) {
      console.log(err);
      res.status(500).json({ message: "Error getting sessions data" });
      return;
    }
    // console.log(results);
    res.status(200).json(results);
  });
});

app.post("/api/staff-login", (req, res) => {
  // console.log(req.body);
  const { id, password } = req.body;

  const sql = `SELECT * FROM staff WHERE staff_id = ?  `;
  db.query(sql, [id], (err, results) => {
    if (err) {
      console.log(err);
      res.status(500).json({ message: "Error fetching email data" });
      return;
    }
    if (results.length === 0) {
      res.status(401).json({ message: "Invalid email or password" });
      return;
    }
    if (password === results[0].password) {
      // console.log(results[0]);
      res.status(200).json(results[0]);
    } else {
      res.status(401).json({ message: "Invalid Credentials" });
    }
  });
});

app.post("/api/accept-session", (req, res) => {
  const { id, staff_id } = req.body;
  // console.log(req.body);
  const sql = `UPDATE bookings SET acceptance_status=1, staff_id=? WHERE booking_id = ?`;
  db.query(sql, [staff_id, id], (err, results) => {
    if (err) {
      console.log(err);
      res.status(500).json({ message: "Error accepting session." });
      return;
    }
    res.status(200).json(results);
  });
});

app.post("/api/get-staff", (req, res) => {
  const { email } = req.body;
  // console.log(email);
  const sql = `SELECT * FROM staff WHERE email = ?`;
  db.query(sql, [email], (err, results) => {
    if (err) {
      console.log(err);
      res.status(500).json({ message: "Error fetching email data" });
      return;
    }
    res.status(200).json(results[0]);
  });
});

app.post("/api/complete-session", (req, res) => {
  const { id } = req.body;
  // console.log(req.body);
  const sql = `UPDATE bookings SET session_status=1 WHERE booking_id = ?`;
  db.query(sql, [id], (err, results) => {
    if (err) {
      console.log(err);
      res.status(500).json({ message: "Error accepting session." });
      return;
    }
    res.status(200).json(results);
  });
});

app.post("/api/get-staff-sessions", (req, res) => {
  const { email } = req.body;
  // console.log(email);
  const sql = `SELECT 
    b.*,
    s.service_name,
    s.price,
    c.fname, c.lname,
    st.email
FROM bookings b
JOIN services s ON b.service_id = s.service_id
JOIN customers c ON b.customer_id = c.id
JOIN staff st ON b.staff_id = st.staff_id
WHERE st.email = ?;
;
`;
  db.query(sql, [email], (err, results) => {
    if (err) {
      console.log(err);
      res.status(500).json({ message: "Error getting sessions data" });
      return;
    }
    // console.log(results);
    res.status(200).json(results);
  });
});

app.listen(PORT, () => {
  console.log(`Listening on PORT ${PORT}`);
});
