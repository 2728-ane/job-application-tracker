
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const path = require("path");
require("dotenv").config();

const User = require("./models/User");
const Application = require("./models/Application");
const auth = require("./middleware/auth");

const app = express();

app.use(cors());
app.use(express.json({ limit: "20kb" }));

// Serve frontend files
app.use(express.static(path.join(__dirname, "../frontend")));

// Register a new user
app.post("/api/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (
      typeof name !== "string" ||
      !name.trim() ||
      typeof email !== "string" ||
      !email.trim() ||
      typeof password !== "string" ||
      password.length < 8
    ) {
      return res.status(400).json({
        error: "Enter a name, email, and password of at least 8 characters."
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existing = await User.findOne({ email: normalizedEmail });

    if (existing) {
      return res.status(409).json({
        error: "Email is already registered."
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword
    });

    res.status(201).json({ message: "Registration successful!" });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        error: "Email is already registered."
      });
    }

    console.error(error);
    res.status(500).json({ error: "Registration failed." });
  }
});

// Login
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (typeof email !== "string" || typeof password !== "string") {
      return res.status(400).json({
        error: "Email and password are required."
      });
    }

    const user = await User.findOne({
      email: email.trim().toLowerCase()
    });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({
        error: "Invalid email or password."
      });
    }

    const token = jwt.sign(
      { id: user._id.toString() },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({ token, name: user.name });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Login failed." });
  }
});

// Get applications belonging to logged-in user
app.get("/api/applications", auth, async (req, res) => {
  try {
    const applications = await Application.find({
      user: req.userId
    }).sort({ createdAt: -1 });

    res.json(applications);
  } catch (error) {
    res.status(500).json({ error: "Failed to load applications." });
  }
});

// Add application
app.post("/api/applications", auth, async (req, res) => {
  try {
    const { company, position, status, date } = req.body;

    if (
      typeof company !== "string" ||
      !company.trim() ||
      typeof position !== "string" ||
      !position.trim()
    ) {
      return res.status(400).json({
        error: "Company and position are required."
      });
    }

    const application = await Application.create({
      user: req.userId,
      company: company.trim(),
      position: position.trim(),
      status: status || "Applied",
      ...(date ? { date } : {})
    });

    res.status(201).json(application);
  } catch (error) {
    res.status(400).json({ error: "Failed to add application." });
  }
});

// Update application
app.put("/api/applications/:id", auth, async (req, res) => {
  try {
    const { company, position, status, date } = req.body;

    const changes = {};

    if (company !== undefined) {
      if (typeof company !== "string" || !company.trim()) {
        return res.status(400).json({ error: "Invalid company." });
      }
      changes.company = company.trim();
    }

    if (position !== undefined) {
      if (typeof position !== "string" || !position.trim()) {
        return res.status(400).json({ error: "Invalid position." });
      }
      changes.position = position.trim();
    }

    if (status !== undefined) changes.status = status;
    if (date !== undefined) changes.date = date;

    const updated = await Application.findOneAndUpdate(
      { _id: req.params.id, user: req.userId },
      { $set: changes },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({
        error: "Application not found."
      });
    }

    res.json(updated);
  } catch (error) {
    res.status(400).json({ error: "Failed to update application." });
  }
});

// Delete application
app.delete("/api/applications/:id", auth, async (req, res) => {
  try {
    const deleted = await Application.findOneAndDelete({
      _id: req.params.id,
      user: req.userId
    });

    if (!deleted) {
      return res.status(404).json({
        error: "Application not found."
      });
    }

    res.json({ message: "Application deleted." });
  } catch (error) {
    res.status(400).json({ error: "Failed to delete application." });
  }
});

// Start server
const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    if (!process.env.MONGODB_URI || !process.env.JWT_SECRET) {
      throw new Error("Missing MONGODB_URI or JWT_SECRET in .env");
    }

    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Startup error:", error.message);
    process.exit(1);
  }
}

startServer();
