import express from "express";
import cors from "cors";
import pool from "./config/db.js";
import authRoutes from "./routes/auth.js";
import bookRoutes from "./routes/books.js";
import ticketRoutes from "./routes/tickets.js";
import adminRoutes from "./routes/admin.js";
import { notFound, errorHandler } from "./middleware/errors.js";

const app = express();

app.use(cors());
app.use(express.json({ limit: "100kb" }));
app.use(express.urlencoded({ extended: true, limit: "100kb" }));
app.use("/api/auth", authRoutes);
app.use("/api/books", bookRoutes);
app.use("/api/tickets", ticketRoutes);
app.use("/api/admin", adminRoutes);

app.get("/", (req, res) => {
  res.send("BookLeaf Author Support Portal API");
});

app.get("/api/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    return res.status(200).json({ success: true, message: "BookLeaf API is running", database: "Connected" });
  } catch (error) {
    console.error("Database connection failed:", error.code);
    return res.status(500).json({ success: false, message: "Database connection failed" });
  }
});

// Keep these last so every route gets consistent JSON error responses.
app.use(notFound);
app.use(errorHandler);

export default app;
