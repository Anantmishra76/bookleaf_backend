import pool from "../config/db.js";
import { createHash } from "node:crypto";
import { generateDraftResponse } from "../services/ai.js";
import {
  ticketStatuses,
  ticketPriorities,
  ticketCategories,
} from "../utils/ticketOptions.js";

const ticketQuery = `SELECT tickets.*, authors.name AS author_name,
  users.email AS author_email, books.title AS book_title
  FROM tickets
  JOIN authors ON tickets.author_id = authors.id
  LEFT JOIN users ON authors.user_id = users.id
  LEFT JOIN books ON tickets.book_id = books.id`;

const isValidDate = (value) => {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value))
    return false;
  const date = new Date(value);
  return (
    value >= "0001-01-01" &&
    !Number.isNaN(date.getTime()) &&
    date.toISOString().slice(0, 10) === value
  );
};

export const getAllTickets = async (req, res) => {
  const { status, category, priority, from, to } = req.query;
  const filters = [];
  const values = [];

  for (const [field, value, allowed] of [
    ["status", status, ticketStatuses],
    ["category", category, ticketCategories],
    ["priority", priority, ticketPriorities],
  ]) {
    if (value !== undefined) {
      if (!allowed.includes(value)) {
        return res.status(400).json({ message: `Invalid ${field}`, allowed });
      }
      values.push(value);
      filters.push(`tickets.${field} = $${values.length}`);
    }
  }

  if (
    (from !== undefined && !isValidDate(from)) ||
    (to !== undefined && !isValidDate(to))
  ) {
    return res
      .status(400)
      .json({ message: "Dates must be valid dates in YYYY-MM-DD format" });
  }
  if (from && to && from > to) {
    return res
      .status(400)
      .json({ message: "From date must be on or before to date" });
  }
  if (from) {
    values.push(from);
    filters.push(`tickets.created_at >= $${values.length}::date`);
  }
  if (to) {
    values.push(to);
    filters.push(
      `tickets.created_at < $${values.length}::date + INTERVAL '1 day'`,
    );
  }

  try {
    const where = filters.length ? `WHERE ${filters.join(" AND ")}` : "";
    const result = await pool.query(
      `${ticketQuery} ${where}
       ORDER BY CASE WHEN tickets.status IN ('OPEN', 'IN_PROGRESS') THEN 0 ELSE 1 END,
         CASE tickets.priority WHEN 'CRITICAL' THEN 0 WHEN 'HIGH' THEN 1 WHEN 'MEDIUM' THEN 2 ELSE 3 END,
         tickets.created_at ASC, tickets.id ASC`,
      values,
    );
    return res.status(200).json({ tickets: result.rows });
  } catch (error) {
    console.error("Admin ticket list error:", error.message);
    return res
      .status(500)
      .json({ message: "Unable to fetch tickets. Please try again later." });
  }
};

export const getTicketDetails = async (req, res) => {
  try {
    const result = await pool.query(`${ticketQuery} WHERE tickets.id = $1`, [
      req.params.id,
    ]);
    if (!result.rows.length)
      return res.status(404).json({ message: "Ticket not found" });

    const messages = await pool.query(
      `SELECT id, ticket_id, sender_id, body, is_internal, created_at
       FROM ticket_messages WHERE ticket_id = $1 ORDER BY created_at ASC, id ASC`,
      [req.params.id],
    );
    return res.status(200).json({
      ticket: result.rows[0],
      responses: messages.rows.filter((message) => !message.is_internal),
      notes: messages.rows.filter((message) => message.is_internal),
    });
  } catch (error) {
    console.error("Admin ticket details error:", error.message);
    return res
      .status(500)
      .json({ message: "Unable to fetch ticket. Please try again later." });
  }
};

export const updateTicket = async (req, res) => {
  const body = req.body;
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return res.status(400).json({ message: "Provide ticket fields to update" });
  }
  const allowedFields = ["status", "category", "priority", "assign_to_me"];
  if (
    !Object.keys(body).length ||
    Object.keys(body).some((field) => !allowedFields.includes(field))
  ) {
    return res
      .status(400)
      .json({
        message: "Allowed fields: status, category, priority, assign_to_me",
      });
  }

  const updates = [];
  const values = [];
  for (const [field, allowed] of [
    ["status", ticketStatuses],
    ["category", ticketCategories],
    ["priority", ticketPriorities],
  ]) {
    if (body[field] !== undefined) {
      if (!allowed.includes(body[field]))
        return res.status(400).json({ message: `Invalid ${field}`, allowed });
      values.push(body[field]);
      updates.push(`${field} = $${values.length}`);
    }
  }
  if (body.assign_to_me !== undefined) {
    if (body.assign_to_me !== true)
      return res.status(400).json({ message: "assign_to_me must be true" });
    values.push(req.user.id);
    updates.push(`assigned_admin_id = $${values.length}`);
  }
  values.push(req.params.id);

  try {
    const result = await pool.query(
      `UPDATE tickets SET ${updates.join(", ")}, updated_at = CURRENT_TIMESTAMP
       WHERE id = $${values.length} RETURNING *`,
      values,
    );
    if (!result.rows.length)
      return res.status(404).json({ message: "Ticket not found" });
    return res
      .status(200)
      .json({ message: "Ticket updated successfully", ticket: result.rows[0] });
  } catch (error) {
    console.error("Update ticket error:", error.message);
    return res
      .status(500)
      .json({ message: "Unable to update ticket. Please try again later." });
  }
};

// Responses and notes use the same table; only notes have is_internal = true.
const saveMessage = async (req, res, isInternal) => {
  const { body } = req.body ?? {};
  if (typeof body !== "string" || !body.trim() || body.trim().length > 10000) {
    return res
      .status(400)
      .json({
        message:
          "Message body is required and must be 10000 characters or fewer",
      });
  }
  try {
    // One statement saves the message and updates the ticket together.
    const result = await pool.query(
      `WITH updated_ticket AS (
         UPDATE tickets SET updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING id
       )
       INSERT INTO ticket_messages (ticket_id, sender_id, body, is_internal)
       SELECT id, $2, $3, $4 FROM updated_ticket RETURNING *`,
      [req.params.id, req.user.id, body.trim(), isInternal],
    );
    if (!result.rows.length)
      return res.status(404).json({ message: "Ticket not found" });
    return res.status(201).json({
      message: isInternal
        ? "Internal note added"
        : "Response sent successfully",
      [isInternal ? "note" : "response"]: result.rows[0],
    });
  } catch (error) {
    console.error("Save ticket message error:", error.message);
    return res
      .status(500)
      .json({ message: "Unable to save message. Please try again later." });
  }
};

export const sendResponse = async (req, res) => {
  return saveMessage(req, res, false);
};

export const addInternalNote = async (req, res) => {
  return saveMessage(req, res, true);
};

export const getAiDraft = async (req, res) => {
  try {
    const tickets = await pool.query("SELECT * FROM tickets WHERE id = $1", [
      req.params.id,
    ]);
    if (!tickets.rows.length)
      return res.status(404).json({ message: "Ticket not found" });
    const ticket = tickets.rows[0];
    let book = null;
    if (ticket.book_id !== null) {
      const books = await pool.query(
        `SELECT title, isbn, status, publication_date, mrp, total_copies_sold,
         total_royalty_earned, royalty_paid, royalty_pending, last_royalty_payout_date, available_on
         FROM books WHERE id = $1 AND author_id = $2`,
        [ticket.book_id, ticket.author_id],
      );
      book = books.rows[0] || null;
    }
    const messages = await pool.query(
      `SELECT body FROM ticket_messages WHERE ticket_id = $1 AND is_internal = false
       ORDER BY created_at DESC, id DESC LIMIT 5`,
      [ticket.id],
    );
    const responses = messages.rows.reverse();
    const contextHash = createHash("sha256")
      .update(JSON.stringify({ ticket, book, responses }))
      .digest("hex");
    const cached = await pool.query(
      "SELECT body FROM ticket_ai_drafts WHERE ticket_id = $1 AND context_hash = $2",
      [ticket.id, contextHash],
    );
    if (cached.rows.length)
      return res.status(200).json({ draft: cached.rows[0].body, cached: true });

    let draft;
    try {
      draft = await generateDraftResponse(ticket, book, responses);
    } catch {
      console.error("AI draft unavailable; admin can reply manually.");
      return res
        .status(503)
        .json({
          message:
            "AI draft unavailable. Please write a response manually or try again later.",
        });
    }
    await pool.query(
      `INSERT INTO ticket_ai_drafts (ticket_id, context_hash, body) VALUES ($1, $2, $3)
       ON CONFLICT (ticket_id) DO UPDATE SET context_hash = EXCLUDED.context_hash,
       body = EXCLUDED.body, created_at = CURRENT_TIMESTAMP`,
      [ticket.id, contextHash, draft],
    );
    return res.status(200).json({ draft, cached: false });
  } catch (error) {
    console.error("AI draft database error:", error.message);
    return res
      .status(500)
      .json({
        message:
          "Unable to load AI draft. You can still write a response manually.",
      });
  }
};
