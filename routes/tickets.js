import express from "express";
import { createTicket, getMyTickets, getMyTicket } from "../controllers/tickets.js";
import { authenticateToken, authorizeRoles } from "../middleware/auth.js";

const router = express.Router();

router.use(authenticateToken, authorizeRoles("AUTHOR"));

router.post("/", createTicket);
router.get("/", getMyTickets);
router.get("/:id", getMyTicket);

export default router;
