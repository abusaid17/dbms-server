const express = require('express');
const mysql = require('mysql');
const cors = require('cors');
const path = require('path');


const app = express();

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// ✅ CORS Middleware - Ensure correct CORS setup
app.use(
    cors({
        origin: "http://localhost:5173", // Allow frontend domain
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"], // Ensure OPTIONS is included
        allowedHeaders: ["Content-Type", "Authorization"], // Specify allowed headers
        credentials: true, // Allow credentials if needed
    })
);

// ✅ Manually set headers for better compatibility
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "http://localhost:5173");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");

    // ✅ Handle preflight requests (important for DELETE requests)
    if (req.method === "OPTIONS") {
        return res.sendStatus(204); // No Content status for preflight
    }

    next();
});




const PORT = process.env.PORT || 5001;

const DB = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'TalentLinkDB'

});


// Connect to MySQL
DB.connect((err) => {
    if (err) {
        console.error("Database connection failed:", err);
        return;
    }
    console.log("Connected to MySQL");
});

// API Route to Add User
app.post("/add_user", (req, res) => {
    const sql =
        "INSERT INTO OpenWork (`id`, `name`, `email`, `age`, `gender`) VALUES (?, ?, ?, ?, ?)";
    const values = [req.body.id, req.body.name, req.body.email, req.body.age, req.body.gender];
    console.log(values);
    // Execute query
    DB.query(sql, values, (err, result) => {
        if (err) {
            console.error("Error inserting data:", err);
            return res.status(500).json({ message: "Database error", error: err });
        }
        return res.status(201).json({
            success: "Student added successfully",
            insertedId: result.insertId, // Return inserted ID
        });
    });
});

// DB.query('SELECT * FROM OpenWork', (err, result) => {
//     if(err) {
//         console.log(err);
//     } else {
//         console.log(result);
//     }
// });

// API Route to Get All Users
app.get("/get_users", (req, res) => {
    const sql = "SELECT * FROM OpenWork";

    DB.query(sql, (err, results) => {
        if (err) {
            console.error("Error fetching data:", err);
            return res.status(500).json({ message: "Database error", error: err });
        }
        return res.status(200).json(results);
    });
});

//get by :id
app.get("/get_user/:id", (req, res) => {
    const sql = "SELECT * FROM OpenWork WHERE id = ?";
    const values = [req.params.id];

    DB.query(sql, values, (err, result) => {
        if (err) {
            console.error("Error fetching user:", err);
            return res.status(500).json({ message: "Database error", error: err });
        }
        if (result.length === 0) {
            return res.status(404).json({ message: "User not found" });
        }
        return res.status(200).json(result[0]); // Return only the first matched user
    });
});




// Update user info
app.put("/update/:id", (req, res) => {
    const sql = `UPDATE OpenWork SET name = ?, email = ?, age = ?, gender = ? WHERE id = ?`;
    const values = [req.body.name, req.body.email, req.body.age, req.body.gender, req.params.id];

    DB.query(sql, values, (err, result) => {
        if (err) {
            console.error("Error updating user:", err);
            return res.status(500).json({ message: "Error inside server", error: err });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "User not found" });
        }
        return res.status(200).json({ success: "User updated successfully", updatedId: req.params.id });
    });
});








// API Route to Delete a User by ID
app.delete("/delete_user/:id", (req, res) => {
    const sql = "DELETE FROM OpenWork WHERE id = ?";
    const id = req.params.id; // Extract ID from URL params
    console.log("id :  ", id);
    DB.query(sql, [id], (err, result) => {
        if (err) return res.json({ message: "Database error", error: err });

        return res.json(result);
    });
});





app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});