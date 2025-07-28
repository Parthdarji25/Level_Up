// server.js
const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const path = require("path");  // <-- Add this line


const app = express();
app.use(cors());
app.use(express.json());

require("dotenv").config();

const SECRET_KEY = process.env.JWT_SECRET || "your-fallback-secret";

console.log("Using JWT secret:", SECRET_KEY);

// MySQL connection (update with your credentials)
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

// Middleware to authenticate JWT token for protected routes
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  if (!authHeader)
    return res.status(401).json({ error: "Authorization header missing" });

  const token = authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Token missing" });

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) return res.status(403).json({ error: "Token invalid or expired" });
    req.user = user;
    next();
  });
}

// Temporary hardcoded login endpoint
app.post("/api/login", (req, res) => {
  const { username, password } = req.body;

  if (!username || !password)
    return res
      .status(400)
      .json({ error: "Username and password are required" });

  // Hardcoded user (example)
  const hardcodedUser = {
    id: 1,
    username: "admin",
    password: "admin123#@0369", // plaintext, just for demo
  };

  if (
    username === hardcodedUser.username &&
    password === hardcodedUser.password
  ) {
    // Create JWT token, expires in 1h
    const token = jwt.sign(
      { id: hardcodedUser.id, username: hardcodedUser.username },
      SECRET_KEY,
      { expiresIn: "1h" }
    );

    return res.json({ token, username: hardcodedUser.username });
  } else {
    return res.status(401).json({ error: "Invalid credentials" });
  }
});

// Dashboard: Get total points per team (public)
app.get("/api/dashboard", (req, res) => {
  const sql = `
    SELECT t.id, t.name, t.logo_url,
      IFNULL(SUM(p.points), 0) AS total_points
    FROM teams t
    LEFT JOIN players pl ON pl.team_id = t.id
    LEFT JOIN points p ON pl.id = p.player_id
    GROUP BY t.id
    ORDER BY t.id
  `;
  db.query(sql, (err, results) => {
    if (err) return res.status(500).send(err);
    res.json(results);
  });
});

// Teams List with points (public)
app.get("/api/teams", (req, res) => {
  const sql = `
    SELECT t.*, IFNULL(SUM(p.points),0) as total_points 
    FROM teams t
    LEFT JOIN players pl ON pl.team_id = t.id
    LEFT JOIN points p ON pl.id = p.player_id
    GROUP BY t.id
    ORDER BY t.id
  `;
  db.query(sql, (err, results) => {
    if (err) return res.status(500).send(err);
    res.json(results);
  });
});

// Get team details (public)
app.get("/api/team/:id", (req, res) => {
  const teamId = req.params.id;
  const teamSql = `SELECT * FROM teams WHERE id=?`;
  db.query(teamSql, [teamId], (err, teamData) => {
    if (err) return res.status(500).send(err);

    const playerSql = `SELECT * FROM players WHERE team_id=?`;
    db.query(playerSql, [teamId], (err2, players) => {
      if (err2) return res.status(500).send(err2);

      res.json({ ...teamData[0], players });
    });
  });
});

// Get player breakdown (points by activity) (public)
app.get("/api/player/:id", (req, res) => {
  const playerId = req.params.id;
  const sql = `
    SELECT a.name as activity, p.points
    FROM points p
    JOIN activities a ON p.activity_id = a.id
    WHERE p.player_id=?
  `;
  db.query(sql, [playerId], (err, results) => {
    if (err) return res.status(500).send(err);
    res.json(results);
  });
});

// Get all activities (public)
app.get("/api/activities", (req, res) => {
  db.query("SELECT * FROM activities", (err, results) => {
    if (err) return res.status(500).send(err);
    res.json(results);
  });
});

// Get players for a team (public)
app.get("/api/players/team/:teamId", (req, res) => {
  db.query(
    "SELECT * FROM players WHERE team_id=?",
    [req.params.teamId],
    (err, results) => {
      if (err) return res.status(500).send(err);
      res.json(results);
    }
  );
});

// CRUD: Add/Update point allocation (protected)
app.post("/api/points", authenticateToken, (req, res) => {
  const { player_id, activity_id, points } = req.body;

  if (
    (typeof player_id !== "number" && typeof player_id !== "string") ||
    (typeof activity_id !== "number" && typeof activity_id !== "string") ||
    typeof points !== "number"
  ) {
    return res.status(400).json({ error: "Invalid input data" });
  }

  // Check if combination exists
  db.query(
    "SELECT * FROM points WHERE player_id=? AND activity_id=?",
    [player_id, activity_id],
    (err, found) => {
      if (err) return res.status(500).send(err);
      if (found.length > 0) {
        // Update existing record with points (allow negative)
        db.query(
          "UPDATE points SET points=? WHERE player_id=? AND activity_id=?",
          [points, player_id, activity_id],
          (err2) => {
            if (err2) return res.status(500).send(err2);
            res.json({ success: true, action: "updated" });
          }
        );
      } else {
        // Insert new record with points (allow negative)
        db.query(
          "INSERT INTO points (player_id, activity_id, points) VALUES (?,?,?)",
          [player_id, activity_id, points],
          (err3) => {
            if (err3) return res.status(500).send(err3);
            res.json({ success: true, action: "inserted" });
          }
        );
      }
    }
  );
});

// Serve the static files from the React frontend build
app.use(express.static(path.join(__dirname, '../frontend/build')));

app.get('*', (req, res) => {
  res.sendFile(path.resolve(__dirname, '../frontend/build', 'index.html'));
});

// Server start
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
