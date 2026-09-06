import { z } from "zod";

// Prepared for Phase 2's category endpoints. Not yet wired to a controller.

export const createCategorySchema = z.object({
  name: z.string().trim().min(1, "Category name is required.").max(100),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
