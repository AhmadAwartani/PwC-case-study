import { Request, Response, NextFunction } from "express";
import * as ticketService from "../services/ticket.service";
import { ApiError } from "../lib/apiError";
import {
  CreateCommentInput,
  CreateTicketInput,
  ListTicketsQuery,
  UpdateTicketInput,
} from "../schemas/ticket.schema";

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await ticketService.listTickets(
      req.user!,
      req.validatedQuery as ListTicketsQuery   // was: req.query as unknown as ListTicketsQuery
    );
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const ticket = await ticketService.createTicket(req.user!, req.body as CreateTicketInput);
    res.status(201).json({ data: ticket });
  } catch (err) {
    next(err);
  }
}

export async function getById(req: Request, res: Response, next: NextFunction) {
  try {
    const ticket = await ticketService.getTicketById(req.user!, req.params.id as string);
    res.status(200).json({ data: ticket });
  } catch (err) {
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const ticket = await ticketService.updateTicket(
      req.params.id as string,
      req.body as UpdateTicketInput
    );
    res.status(200).json({ data: ticket });
  } catch (err) {
    next(err);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    const ticket = await ticketService.softDeleteTicket(req.params.id as string);
    res.status(200).json({ data: ticket });
  } catch (err) {
    next(err);
  }
}

export async function addComment(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw ApiError.unauthorized();
    const comment = await ticketService.addComment(
      req.user,
      req.params.id as string,
      req.body as CreateCommentInput
    );
    res.status(201).json({ data: comment });
  } catch (err) {
    next(err);
  }
}
