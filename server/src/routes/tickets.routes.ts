import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth";
import { requireRole } from "../middleware/requireRole";
import { validate } from "../middleware/validate";
import {
  createCommentSchema,
  createTicketSchema,
  listTicketsQuerySchema,
  updateTicketSchema,
} from "../schemas/ticket.schema";
import * as ticketsController from "../controllers/tickets.controller";

/**
 * Access rules (enforced here via middleware where the rule is role-only;
 * ownership-dependent rules -- e.g. "the ticket's own requester" -- are
 * enforced inside the service layer, since they need the specific record,
 * not just the caller's role):
 *   GET    /            any authenticated user (service scopes "user" role to their own tickets)
 *   POST   /            any authenticated user
 *   GET    /:id         requester, moderator, or admin (service-layer check)
 *   PATCH  /:id         moderator/admin only
 *   DELETE /:id         admin only
 *   POST   /:id/comments requester, moderator, or admin (service-layer check)
 */
const router = Router();

router.get("/", requireAuth, validate(listTicketsQuerySchema, "query"), ticketsController.list);
router.post("/", requireAuth, validate(createTicketSchema), ticketsController.create);
router.get("/:id", requireAuth, ticketsController.getById);
router.patch(
  "/:id",
  requireAuth,
  requireRole("moderator", "admin"),
  validate(updateTicketSchema),
  ticketsController.update
);
router.delete("/:id", requireAuth, requireRole("admin"), ticketsController.remove);
router.post(
  "/:id/comments",
  requireAuth,
  validate(createCommentSchema),
  ticketsController.addComment
);

export default router;
