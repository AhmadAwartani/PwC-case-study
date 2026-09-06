import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth";
import { requireRole } from "../middleware/requireRole";
import { validate } from "../middleware/validate";
import { createCategorySchema } from "../schemas/category.schema";
import * as categoriesController from "../controllers/categories.controller";

const router = Router();

router.get("/", requireAuth, categoriesController.list);
router.post(
  "/",
  requireAuth,
  requireRole("admin"),
  validate(createCategorySchema),
  categoriesController.create
);

export default router;
