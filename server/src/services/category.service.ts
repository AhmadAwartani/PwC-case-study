import { prisma } from "../lib/prisma";
import { ApiError } from "../lib/apiError";
import { CreateCategoryInput } from "../schemas/category.schema";

export async function listCategories() {
  return prisma.category.findMany({ orderBy: { name: "asc" } });
}

export async function createCategory(input: CreateCategoryInput) {
  const existing = await prisma.category.findUnique({ where: { name: input.name } });
  if (existing) {
    throw ApiError.conflict(`A category named "${input.name}" already exists.`);
  }

  return prisma.category.create({ data: { name: input.name } });
}
