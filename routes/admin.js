import express from "express";
import {
  getAllTickets,
  getTicketDetails,
  updateTicket,
  sendResponse,
  addInternalNote,
  getAiDraft,
} from "../controllers/admin.js";
import { authenticateToken, authorizeRoles } from "../middleware/auth.js";

const router = express.Router();

router.use(authenticateToken, authorizeRoles("ADMIN"));

router.param("id", (req, res, next, id) => {
  if (!/^\d+$/.test(id) || Number(id) < 1 || Number(id) > 2147483647) {
    return res
      .status(400)
      .json({ message: "Ticket ID must be a positive integer" });
  }
  next();
});

router.get("/tickets", getAllTickets);
router.get("/tickets/:id", getTicketDetails);
router.patch("/tickets/:id", updateTicket);
router.post("/tickets/:id/responses", sendResponse);
router.post("/tickets/:id/notes", addInternalNote);
router.post("/tickets/:id/ai-draft", getAiDraft);

export default router;
