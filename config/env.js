export const getServerConfig = (env = process.env) => {
  if (!env.DATABASE_URL?.trim()) throw new Error("DATABASE_URL is required");

  let databaseUrl;
  try {
    databaseUrl = new URL(env.DATABASE_URL);
  } catch {
    throw new Error("DATABASE_URL must be a valid PostgreSQL connection URL");
  }
  if (
    !["postgres:", "postgresql:"].includes(databaseUrl.protocol) ||
    !databaseUrl.hostname ||
    databaseUrl.pathname.length <= 1
  ) {
    throw new Error(
      "DATABASE_URL must include a PostgreSQL host and database name",
    );
  }

  if (
    !env.JWT_SECRET?.trim() ||
    env.JWT_SECRET === "replace_with_a_long_random_secret"
  ) {
    throw new Error("JWT_SECRET must be configured with your own secret");
  }

  const portValue = env.PORT ?? "5000";
  if (
    !/^\d+$/.test(portValue) ||
    Number(portValue) < 1 ||
    Number(portValue) > 65535
  ) {
    throw new Error("PORT must be a whole number between 1 and 65535");
  }

  // Gemini is optional: tickets and manual responses must work without AI.
  return { port: Number(portValue) };
};
