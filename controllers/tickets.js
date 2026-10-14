import pool from "../config/db.js";
import { classifyTicket } from "../services/ai.js";

// PostgreSQL INTEGER IDs must be positive whole numbers.
const isValidId = (value) => {
  return Number.isInteger(value) && value > 0 && value <= 2147483647;
};

export const createTicket = async (req, res) => {
  const { subject, description, book_id = null } = req.body ?? {};

  if (typeof subject !== "string" || !subject.trim() || subject.trim().length > 255) {
    return res.status(400).json({ message: "Subject is required and must be 255 characters or fewer" });
  }

  if (typeof description !== "string" || !description.trim() || description.trim().length > 10000) {
    return res.status(400).json({ message: "Description is required and must be 10000 characters or fewer" });
  }

  if (book_id !== null && !isValidId(book_id)) {
    return res.status(400).json({ message: "Book ID must be a positive integer or null" });
  }

  try {
    const authorResult = await pool.query(
      "SELECT id FROM authors WHERE user_id = $1",
      [req.user.id],
    );

    if (authorResult.rows.length === 0) {
      return res.status(404).json({ message: "Author profile not found" });
    }

    const authorId = authorResult.rows[0].id;

    if (book_id !== null) {
      const bookResult = await pool.query(
        "SELECT id FROM books WHERE id = $1 AND author_id = $2",
        [book_id, authorId],
      );

      if (bookResult.rows.length === 0) {
        return res.status(400).json({ message: "Please select one of your own books" });
      }
    }

    const result = await pool.query(
      `INSERT INTO tickets (author_id, book_id, subject, description)
       VALUES ($1, $2, $3, $4)
       RETURNING *, updated_at::text AS ai_version`,
      [authorId, book_id, subject.trim(), description.trim()],
    );

    // Save first so the author never loses the ticket if Gemini is unavailable.
    let ticket = result.rows[0];
    const aiVersion = ticket.ai_version;
    delete ticket.ai_version;
    let aiClassification = "unavailable";
    try {
      const classification = await classifyTicket(ticket);
      const updated = await pool.query(
        `UPDATE tickets SET category = $1, priority = $2, updated_at = CURRENT_TIMESTAMP
         WHERE id = $3 AND updated_at = $4 RETURNING *`,
        [classification.category, classification.priority, ticket.id, aiVersion],
      );
      // A concurrent admin edit takes precedence over the AI result.
      if (updated.rows.length) {
        ticket = updated.rows[0];
        aiClassification = "completed";
      } else {
        aiClassification = "skipped";
      }
    } catch {
      console.error("Ticket AI classification unavailable; ticket remains saved.");
    }

    return res.status(201).json({ message: "Ticket created successfully", ticket, ai_classification: aiClassification });
  } catch (error) {
    console.error("Create ticket error:", error.message);
    return res.status(500).json({ message: "Unable to create ticket. Please try again later." });
  }
};

export const getMyTickets = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT tickets.*, books.title AS book_title
       FROM tickets
       JOIN authors ON tickets.author_id = authors.id
       LEFT JOIN books ON tickets.book_id = books.id
       WHERE authors.user_id = $1
       ORDER BY tickets.created_at DESC, tickets.id DESC`,
      [req.user.id],
    );

    return res.status(200).json({ tickets: result.rows });
  } catch (error) {
    console.error("Get tickets error:", error.message);
    return res.status(500).json({ message: "Unable to fetch tickets. Please try again later." });
  }
};

export const getMyTicket = async (req, res) => {
  if (!/^\d+$/.test(req.params.id) || !isValidId(Number(req.params.id))) {
    return res.status(400).json({ message: "Ticket ID must be a positive integer" });
  }

  try {
    // Check ownership in the query so other authors' tickets stay private.
    const result = await pool.query(
      `SELECT tickets.*, books.title AS book_title
       FROM tickets
       JOIN authors ON tickets.author_id = authors.id
       LEFT JOIN books ON tickets.book_id = books.id
       WHERE tickets.id = $1 AND authors.user_id = $2`,
      [Number(req.params.id), req.user.id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    const responses = await pool.query(
      `SELECT id, ticket_id, sender_id, body, created_at
       FROM ticket_messages
       WHERE ticket_id = $1 AND is_internal = false
       ORDER BY created_at ASC, id ASC`,
      [Number(req.params.id)],
    );

    return res.status(200).json({ ticket: result.rows[0], responses: responses.rows });
  } catch (error) {
    console.error("Get ticket error:", error.message);
    return res.status(500).json({ message: "Unable to fetch ticket. Please try again later." });
  }
};
