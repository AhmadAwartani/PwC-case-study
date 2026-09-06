import { Router } from "express";
import { login, logout, me } from "../controllers/auth.controller";
import { validate } from "../middleware/validate";
import { loginSchema } from "../schemas/auth.schema";
import { requireAuth } from "../middleware/requireAuth";

const router = Router();

router.post("/login", validate(loginSchema), login);
router.post("/logout", logout);
router.get("/me", requireAuth, me);

export default router;
