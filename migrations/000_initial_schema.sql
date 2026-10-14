-- Baseline matching the existing bookleafdb tables.
-- Existing tables and records are left in place.
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'AUTHOR' CHECK (role IN ('AUTHOR', 'ADMIN')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS authors (
  id SERIAL PRIMARY KEY,
  author_id VARCHAR(50) NOT NULL UNIQUE,
  user_id INTEGER UNIQUE REFERENCES users(id),
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(30),
  city VARCHAR(100),
  joined_date DATE
);

CREATE TABLE IF NOT EXISTS books (
  id SERIAL PRIMARY KEY,
  book_id VARCHAR(50) NOT NULL UNIQUE,
  author_id INTEGER NOT NULL REFERENCES authors(id),
  title VARCHAR(500) NOT NULL,
  isbn VARCHAR(20),
  genre VARCHAR(100),
  publication_date DATE,
  status VARCHAR(100) NOT NULL,
  mrp NUMERIC(10, 2),
  author_royalty_per_copy NUMERIC(10, 2),
  total_copies_sold INTEGER DEFAULT 0,
  total_royalty_earned NUMERIC(12, 2) DEFAULT 0,
  royalty_paid NUMERIC(12, 2) DEFAULT 0,
  royalty_pending NUMERIC(12, 2) DEFAULT 0,
  last_royalty_payout_date DATE,
  print_partner VARCHAR(255),
  available_on TEXT[] DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS tickets (
  id SERIAL PRIMARY KEY,
  author_id INTEGER NOT NULL REFERENCES authors(id),
  book_id INTEGER REFERENCES books(id),
  subject VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'OPEN'
    CHECK (status IN ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED')),
  category VARCHAR(50) DEFAULT 'GENERAL_INQUIRY',
  priority VARCHAR(20) DEFAULT 'MEDIUM'
    CHECK (priority IN ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW')),
  assigned_admin_id INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ticket_messages (
  id SERIAL PRIMARY KEY,
  ticket_id INTEGER NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  sender_id INTEGER NOT NULL REFERENCES users(id),
  body TEXT NOT NULL,
  is_internal BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_books_author_id ON books(author_id);
CREATE INDEX IF NOT EXISTS idx_tickets_author_id ON tickets(author_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status_priority ON tickets(status, priority);
CREATE INDEX IF NOT EXISTS idx_messages_ticket_id ON ticket_messages(ticket_id);
