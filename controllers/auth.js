import bcrypt from "bcryptjs";
import pool from "../config/db.js";
import { generateToken } from "../utils/generateToken.js";

export const login = async (req, res) => {
  try {
    const { email, password } = req.body ?? {};

    if (typeof email !== "string" || typeof password !== "string" || !email.trim() || !password.trim()) {
      return res.status(400).json({
        message: "Email and password are required and must be text",
      });
    }

    const normalizedEmail = email.trim();
    if (normalizedEmail.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return res.status(400).json({ message: "Please enter a valid email address" });
    }

    // Bcrypt processes at most 72 bytes. Keep the actual password unchanged.
    if (Buffer.byteLength(password, "utf8") > 72) {
      return res.status(400).json({ message: "Password must be 72 bytes or fewer" });
    }

    const result = await pool.query(
      `SELECT id, email, password_hash, role
       FROM users
       WHERE LOWER(email) = LOWER($1)`,
      [normalizedEmail],
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const user = result.rows[0];

    const passwordMatches = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatches) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const token = generateToken(user);

    return res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login error:", error.message);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};
