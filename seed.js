import fs from "node:fs";
import pool from "./config/db.js";
import bcrypt from "bcryptjs";

const data = JSON.parse(fs.readFileSync(new URL("./bookleaf_sample_data.json", import.meta.url), "utf8"));

const DEFAULT_PASSWORD = "Bookleaf@123";

async function seedDatabase() {
  let client;

  try {
    if (!process.env.DATABASE_URL?.trim()) throw new Error("DATABASE_URL is required");
    client = await pool.connect();
    await client.query("BEGIN");

    const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);

    for (const author of data.authors) {
      // Create or update the author's login account.
      const userResult = await client.query(
        `INSERT INTO users (email, password_hash, role)
         VALUES ($1, $2, 'AUTHOR')
         ON CONFLICT (email)
         DO UPDATE SET email = EXCLUDED.email
         RETURNING id`,
        [author.email, passwordHash],
      );

      const userId = userResult.rows[0].id;

      // Create or update the author profile.
      const authorResult = await client.query(
        `INSERT INTO authors
         (author_id, user_id, name, phone, city, joined_date)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (author_id)
         DO UPDATE SET
           user_id = EXCLUDED.user_id,
           name = EXCLUDED.name,
           phone = EXCLUDED.phone,
           city = EXCLUDED.city,
           joined_date = EXCLUDED.joined_date
         RETURNING id`,
        [
          author.author_id,
          userId,
          author.name,
          author.phone ?? null,
          author.city ?? null,
          author.joined_date ?? null,
        ],
      );

      const authorDbId = authorResult.rows[0].id;

      for (const book of author.books) {
        await client.query(
          `INSERT INTO books (
            book_id, author_id, title, isbn, genre,
            publication_date, status, mrp,
            author_royalty_per_copy, total_copies_sold,
            total_royalty_earned, royalty_paid, royalty_pending,
            last_royalty_payout_date, print_partner, available_on
          )
          VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8,
            $9, $10, $11, $12, $13, $14, $15, $16
          )
          ON CONFLICT (book_id)
          DO UPDATE SET
            author_id = EXCLUDED.author_id,
            title = EXCLUDED.title,
            isbn = EXCLUDED.isbn,
            genre = EXCLUDED.genre,
            publication_date = EXCLUDED.publication_date,
            status = EXCLUDED.status,
            mrp = EXCLUDED.mrp,
            author_royalty_per_copy = EXCLUDED.author_royalty_per_copy,
            total_copies_sold = EXCLUDED.total_copies_sold,
            total_royalty_earned = EXCLUDED.total_royalty_earned,
            royalty_paid = EXCLUDED.royalty_paid,
            royalty_pending = EXCLUDED.royalty_pending,
            last_royalty_payout_date = EXCLUDED.last_royalty_payout_date,
            print_partner = EXCLUDED.print_partner,
            available_on = EXCLUDED.available_on`,
          [
            book.book_id,
            authorDbId,
            book.title,
            book.isbn ?? null,
            book.genre ?? null,
            book.publication_date ?? null,
            book.status,
            book.mrp ?? null,
            book.author_royalty_per_copy ?? null,
            book.total_copies_sold ?? 0,
            book.total_royalty_earned ?? 0,
            book.royalty_paid ?? 0,
            book.royalty_pending ?? 0,
            book.last_royalty_payout_date ?? null,
            book.print_partner ?? null,
            book.available_on ?? [],
          ],
        );
      }
    }

    // Create a separate administrator account.
    await client.query(
      `INSERT INTO users (email, password_hash, role)
       VALUES ($1, $2, 'ADMIN')
       ON CONFLICT (email) DO NOTHING`,
      ["admin@bookleaf.local", await bcrypt.hash(DEFAULT_PASSWORD, 10)],
    );

    await client.query("COMMIT");

    console.log(`Imported ${data.authors.length} authors.`);
    console.log(
      `Imported ${data.authors.reduce(
        (total, author) => total + author.books.length,
        0,
      )} books.`,
    );
    console.log("Administrator account created or already exists.");
  } catch (error) {
    if (client) await client.query("ROLLBACK");
    console.error("Import failed:", error.message);
    process.exitCode = 1;
  } finally {
    if (client) client.release();
    await pool.end();
  }
}

await seedDatabase();
