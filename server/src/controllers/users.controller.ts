import { Request, Response, NextFunction } from "express";
import * as userService from "../services/user.service";
import { CreateUserInput, ListUsersQuery, UpdateUserInput } from "../schemas/user.schema";

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await userService.listUsers(req.validatedQuery as ListUsersQuery);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await userService.createUser(req.body as CreateUserInput);
    res.status(201).json({ data: user });
  } catch (err) {
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await userService.updateUser(
      req.user!,
      req.params.id as string,
      req.body as UpdateUserInput
    );
    res.status(200).json({ data: user });
  } catch (err) {
    next(err);
  }
}