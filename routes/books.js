import express from "express";
import { getMyBooks } from "../controllers/books.js";
import { authenticateToken, authorizeRoles } from "../middleware/auth.js";

const router = express.Router();

router.get("/", authenticateToken, authorizeRoles("AUTHOR"), getMyBooks);

export default router;
