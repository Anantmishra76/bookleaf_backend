import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 5000,
});

pool.on("connect", () => {
  console.log("PostgreSQL client connected.");
});

pool.on("error", (error) => {
  console.error("Unexpected PostgreSQL error:", error.message);
});

export default pool;
