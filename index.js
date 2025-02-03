const express = require('express');
const mysql = require('mysql');
require('dotenv').config();
const bcrypt = require('bcryptjs');
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
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});
// Connect to MySQL
DB.connect((err) => {
    if (err) {
        console.error("Database connection failed:", err);
        return;
    }
    console.log("Connected to MySQL");
});




// User Registration API
app.post('/register', async (req, res) => {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    const sql = 'INSERT INTO Users (Username, Email, Password) VALUES (?, ?, ?)';
    DB.query(sql, [username, email, hashedPassword], (err, result) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ message: 'User registered successfully' });
    });
});
// User Login API
app.post('/login', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    const sql = 'SELECT * FROM Users WHERE Email = ?';
    DB.query(sql, [email], async (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Database error', details: err.message });
        }
        if (results.length === 0) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const user = results[0];

        // Compare the hashed password
        const isMatch = await bcrypt.compare(password, user.Password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Prepare the response data
        const responseData = {
            message: 'Login successful',
            user: {
                id: user.Regi_ID,
                username: user.Username,
                email: user.Email
            }
        };

        // Print the response data to the console
        console.log("Response data sent:", responseData);

        // Send the user data (excluding password)
        res.json(responseData);
    });
});





// API Route to Add User for create Routes
app.post("/add_user", (req, res) => {
    const sql =
        "INSERT INTO OpenWork (`name`, `email`, `age`, `gender`) VALUES ( ?, ?, ?, ?)";
    const values = [req.body.name, req.body.email, req.body.age, req.body.gender];

    DB.query(sql, values, (err, result) => {
        if (err) {
            console.error("Error inserting data:", err);

            // Check if error is due to duplicate email
            if (err.code === "ER_DUP_ENTRY") {
                return res.status(400).json({
                    message: "Email already exists. Please use a different email.",
                    error: err,
                });
            }

            return res.status(500).json({
                message: "Database error",
                error: err,
            });
        }

        return res.status(201).json({
            success: "User added successfully",
            insertedId: result.insertId,
        });
    });
});

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
//get by :id for openWork table create user
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









// CRUD For JobOpportunity Table
app.post("/add_job", (req, res) => {
    const sql = `
        INSERT INTO JobOpportunities 
        (Company_Name, JobType, JobName, Location, Joining_Post, Salary, Apply_Last_Date, JoinDate, TimeDuration, AboutJob, RequiredSkills, AboutCompany, NumberOfOpenings) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const values = [
        req.body.companyName,
        req.body.jobType,
        req.body.jobName,
        req.body.location,
        req.body.Joining_Post,
        req.body.salary,
        req.body.applyLastDate,
        req.body.joinDate,
        req.body.timeDuration,
        req.body.aboutJob,
        req.body.requiredSkills,
        req.body.aboutCompany,
        req.body.numberOfOpenings
    ];
    console.log("post",values);

    // Execute query
    DB.query(sql, values, (err, result) => {
        if (err) {
            console.error("Error inserting data:", err);
            return res.status(500).json({ message: "Database error", error: err });
        }
        return res.status(201).json({
            success: "Job opportunity added successfully",
            insertedId: result.insertId, // Return inserted ID
        });
    });
});
app.get("/get_jobs", (req, res) => {
    const sql = "SELECT * FROM JobOpportunities";

    DB.query(sql, (err, results) => {
        if (err) {
            console.error("Error fetching jobs:", err);
            return res.status(500).json({ message: "Database error", error: err });
        }
        return res.status(200).json({ jobs: results });
    });
});
// Show data id wise for update operation
app.get("/get_job/:JobID", (req, res) => {
    const JobID = parseInt(req.params.JobID, 10); // Convert JobID to a number

    if (isNaN(JobID)) {
        return res.status(400).json({ error: "Invalid JobID" });
    }

    const sql = `SELECT * FROM JobOpportunities WHERE JobID = ?`;

    DB.query(sql, [JobID], (err, result) => {
        if (err) {
            console.error("Database error:", err);
            return res.status(500).json({ error: "Database error" });
        }

        if (result.length === 0) {
            return res.status(404).json({ message: "Job not found" });
        }

        res.status(200).json(result[0]); // Return the job details
    });
});
// UPDATE Job (PUT)
app.put("/update_job/:JobID", (req, res) => {
    const { JobID } = req.params;
    console.log("Received update request for Job ID:", JobID);

    const job = req.body;
    console.log("Update Data:", job);

    const sql = `UPDATE JobOpportunities SET Company_Name=?, JobType=?, JobName=?, Location=?, Joining_Post=?, Salary=?, Apply_Last_Date=?, JoinDate=?, TimeDuration=?,AboutJob=?,RequiredSkills=?,AboutCompany=?, NumberOfOpenings=? WHERE JobID=?`;

    const values = [
        req.body.Company_Name, 
        req.body.JobType, 
        req.body.JobName, 
        req.body.Location, 
        req.body.Joining_Post, 
        req.body.Salary, 
        req.body.Apply_Last_Date, 
        req.body.JoinDate, 
        req.body.TimeDuration, 
        req.body.AboutJob, 
        req.body.RequiredSkills, 
        req.body.AboutCompany, 
        req.body.NumberOfOpenings, 
        req.params.JobID
    ];

    DB.query(sql, values, (err, result) => {
        if (err) {
            console.error("Error updating job data:", err);
            return res.status(500).json({ message: "Error inside server", error: err });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "job data not found" });
        }
        return res.status(200).json({ success: "data updated successfully", updatedId: req.params.JobID });
    });
});
// DELETE Job (DELETE)
app.delete("/delete_job/:JobID", (req, res) => {
    const sql = `DELETE FROM JobOpportunities WHERE JobID=?`;
    const { JobID } = req.params;
    DB.query(sql, [JobID], (err, result) => {
        if (err) {
            console.error("Database error:", err);
            return res.status(500).json({ error: "Database error" });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Job not found" });
        }

        res.status(200).json({ message: "Job deleted successfully!" });
    });
});



















// API to fetch all job opportunities show data from backend 
app.get('/jobopportunities', (req, res) => {
    const sql = 'SELECT * FROM JobOpportunities';
    DB.query(sql, (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(results);
    });
});




// Route to get job details by jobId for view details page
app.get("/jobopportunities/:jobId", (req, res) => {
    const jobId = req.params.jobId;  // Extract jobId from the URL parameter

    const sql = "SELECT * FROM JobOpportunities WHERE JobID = ?";
    DB.query(sql, [jobId], (err, results) => {
        if (err) {
            console.log("Error fetching job details:", err.message);
            return res.status(500).json({ error: "Database error", details: err.message });
        }

        if (results.length === 0) {
            return res.status(404).json({ error: "Job not found" });
        }

        // Send the job details as a response
        res.json(results[0]);
    });
});





// POST route to insert data for create job opportunity
app.post('/viewdetails', (req, res) => {
    const {
        JobID, Company_Name, JobType, JobName, Location, Joining_Post, Salary,
        Apply_Last_Date, JoinDate, TimeDuration, AboutJob, RequiredSkills,
        AboutCompany, NumberOfOpenings
    } = req.body;

    const sql = `
        INSERT INTO ViewDetails 
        (JobID, Company_Name, JobType, JobName, Location, Joining_Post, Salary, Apply_Last_Date, JoinDate, TimeDuration, AboutJob, RequiredSkills, AboutCompany, NumberOfOpenings) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    DB.query(sql, [
        JobID, Company_Name, JobType, JobName, Location, Joining_Post, Salary,
        Apply_Last_Date, JoinDate, TimeDuration, AboutJob, RequiredSkills,
        AboutCompany, NumberOfOpenings
    ], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Database error', details: err.message });
        }
        res.status(200).json({ message: 'Job details added successfully', result });
    });
});

// API to fetch View Job Details Table Data
app.get('/ViewJobDetails', (req, res) => {
    const sql = 'SELECT * FROM JobOpportunities';
    DB.query(sql, (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(results);
    });
});






app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});