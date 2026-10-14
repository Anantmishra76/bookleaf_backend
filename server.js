import "dotenv/config";
import { getServerConfig } from "./config/env.js";

const startServer = async () => {
  let pool;
  try {
    // Validate settings before loading the app or connecting to the database.
    const { port } = getServerConfig();
    const { default: app } = await import("./app.js");
    pool = (await import("./config/db.js")).default;
    await pool.query("SELECT 1");

    const server = app.listen(port, () => {
      console.log(`BookLeaf server running on port ${port}`);
    });
    server.on("error", async (error) => {
      console.error("Unable to start HTTP server:", error.code);
      await pool.end();
      process.exitCode = 1;
    });
  } catch (error) {
    console.error(
      "Server startup failed:",
      pool
        ? "Database connection failed. Check DATABASE_URL and PostgreSQL availability."
        : error.message,
    );
    if (pool) await pool.end();
    process.exitCode = 1;
  }
};

startServer();
