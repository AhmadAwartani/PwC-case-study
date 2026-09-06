import { Router } from "express";

const router = Router();

// Deliberately does not require authentication.
router.get("/", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

export default router;
