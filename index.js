const express = require('express');
const mysql = require('mysql');
const cors = require('cors');
const path = require('path');


const app = express();

app.use(express.static(path.join(__dirname, 'public')));
app.use(cors());
app.use(express.json());

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


// API Route to Delete a User by ID
app.delete("/delete_user/:id", (req, res) => {
    const sql = "DELETE FROM student_details WHERE id = ?";
    const values = [req.params.id]; // Extract ID from URL params

    DB.query(sql, values, (err, result) => {
        if (err) {
            console.error("Error deleting data:", err);
            return res.status(500).json({ message: "Database error", error: err });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Student not found" });
        }
        return res.status(200).json({
            success: "Student deleted successfully",
            deletedId: req.params.id,
        });
    });
});





app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});