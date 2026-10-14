-- Drafts are admin-only and kept separate from sent ticket_messages.
CREATE TABLE IF NOT EXISTS ticket_ai_drafts (
  ticket_id INTEGER PRIMARY KEY REFERENCES tickets(id) ON DELETE CASCADE,
  context_hash TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
