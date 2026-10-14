import pool from "../config/db.js";

export const getMyBooks = async (req, res) => {
  try {
    // The user ID comes from the verified login token.
    const result = await pool.query(
      `SELECT books.*
       FROM books
       JOIN authors ON books.author_id = authors.id
       WHERE authors.user_id = $1
       ORDER BY books.id DESC`,
      [req.user.id],
    );

    return res.status(200).json({
      books: result.rows,
    });
  } catch (error) {
    console.error("Get books error:", error.message);

    return res.status(500).json({
      message: "Unable to fetch books. Please try again later.",
    });
  }
};
