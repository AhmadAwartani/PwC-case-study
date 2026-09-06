import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth";
import { requireRole } from "../middleware/requireRole";
import { validate } from "../middleware/validate";
import { createUserSchema, listUsersQuerySchema, updateUserSchema } from "../schemas/user.schema";
import * as usersController from "../controllers/users.controller";

const router = Router();

router.get(
  "/",
  requireAuth,
  requireRole("admin"),
  validate(listUsersQuerySchema, "query"),
  usersController.list
);
router.post(
  "/",
  requireAuth,
  requireRole("admin"),
  validate(createUserSchema),
  usersController.create
);
router.patch(
  "/:id",
  requireAuth,
  requireRole("admin"),
  validate(updateUserSchema),
  usersController.update
);

export default router;