import { Request, Response, NextFunction } from "express";
import * as categoryService from "../services/category.service";
import { CreateCategoryInput } from "../schemas/category.schema";

export async function list(_req: Request, res: Response, next: NextFunction) {
  try {
    const categories = await categoryService.listCategories();
    res.status(200).json({ data: categories });
  } catch (err) {
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const category = await categoryService.createCategory(req.body as CreateCategoryInput);
    res.status(201).json({ data: category });
  } catch (err) {
    next(err);
  }
}
