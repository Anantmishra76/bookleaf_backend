export const notFound = (req, res) => {
  return res.status(404).json({ message: "Route not found" });
};

// Express recognizes error middleware by these four parameters.
export const errorHandler = (error, req, res, next) => {
  if (res.headersSent) return next(error);
  if (error.type === "entity.parse.failed") {
    return res.status(400).json({ message: "Request body contains invalid JSON" });
  }
  if (error.type === "entity.too.large" || error.status === 413) {
    return res.status(413).json({ message: "Request body is too large" });
  }
  if (error.status >= 400 && error.status < 500) {
    return res.status(error.status).json({ message: "Invalid request" });
  }

  console.error("Unexpected request error:", error.name);
  return res.status(500).json({ message: "Internal server error" });
};
