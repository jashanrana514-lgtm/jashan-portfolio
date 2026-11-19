
const express = require("express");
const Database = require("better-sqlite3");
const path = require("path");
require("dotenv").config();

const app = express();
const dbPath = path.join(__dirname, "database", "portfolio.db");
const db = new Database(dbPath);

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

db.exec(`
CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS projects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  tech TEXT,
  link TEXT
);
`);

const total = db.prepare(
  "SELECT COUNT(*) AS total FROM projects"
).get().total;

if (total === 0) {
  const add = db.prepare(`
    INSERT INTO projects (title, description, tech, link)
    VALUES (?, ?, ?, ?)
  `);

  add.run(
    "Personal Portfolio",
    "My personal website",
    "HTML CSS JavaScript",
    "#"
  );

  add.run(
    "Student Management System",
    "Manage student records",
    "JavaScript MySQL",
    "#"
  );
}

// Get projects
app.get("/api/projects", (req, res) => {
  const projects = db.prepare(
    "SELECT * FROM projects ORDER BY id DESC"
  ).all();

  res.json(projects);
});

// Contact form
app.post("/api/contact", (req, res) => {
  const { name, email, message } = req.body;

  if (
    typeof name !== "string" ||
    typeof email !== "string" ||
    typeof message !== "string" ||
    name.trim().length < 2 ||
    name.length > 80 ||
    email.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    message.trim().length < 5 ||
    message.length > 3000
  ) {
    return res.status(400).json({
      success: false,
      message: "Please enter valid details."
    });
  }

  db.prepare(`
    INSERT INTO messages (name, email, message)
    VALUES (?, ?, ?)
  `).run(name.trim(), email.trim(), message.trim());

  res.status(201).json({
    success: true,
    message: "Message sent successfully!"
  });
});

// Admin authentication
function adminOnly(req, res, next) {
  if (
    !process.env.ADMIN_KEY ||
    req.headers["x-admin-key"] !== process.env.ADMIN_KEY
  ) {
    return res.status(401).json({
      message: "Unauthorized"
    });
  }

  next();
}

// Admin messages
app.get("/api/admin/messages", adminOnly, (req, res) => {
  const messages = db.prepare(
    "SELECT * FROM messages ORDER BY id DESC"
  ).all();

  res.json(messages);
});

// Admin add project
app.post("/api/admin/projects", adminOnly, (req, res) => {
  const { title, description, tech, link } = req.body;

  if (
    typeof title !== "string" ||
    typeof description !== "string" ||
    typeof tech !== "string" ||
    typeof link !== "string" ||
    !title.trim() ||
    !description.trim() ||
    title.length > 100 ||
    description.length > 1000 ||
    tech.length > 200 ||
    link.length > 500
  ) {
    return res.status(400).json({
      message: "Invalid project details"
    });
  }

  const result = db.prepare(`
    INSERT INTO projects (title, description, tech, link)
    VALUES (?, ?, ?, ?)
  `).run(title.trim(), description.trim(), tech.trim(), link.trim());

  res.status(201).json({
    success: true,
    id: result.lastInsertRowid
  });
});

// Admin delete project
app.delete("/api/admin/projects/:id", adminOnly, (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isSafeInteger(id) || id < 1) {
    return res.status(400).json({ message: "Invalid ID" });
  }

  const result = db.prepare(
    "DELETE FROM projects WHERE id = ?"
  ).run(id);

  if (!result.changes) {
    return res.status(404).json({ message: "Project not found" });
  }

  res.json({ success: true });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Website running at http://localhost:" + PORT);
});
