import type { RequestHandler, Response } from "express";
import { readSession } from "../auth/session";
import { UserRole } from "../constants/domain";
import { HttpStatus } from "../constants/http";
import { ErrorMessage } from "../constants/messages";
import type { Session } from "../domain/authTypes";
import { findUserById } from "../repositories/userRepository";
import { AppError } from "./error";

// `res.locals` is a per-request scratch space; the guard writes the session there so the route handler can read it.
export const currentSession = (res: Response): Session =>
  res.locals.session as Session;

// Note: these are plain (non-async) Express handlers that `throw`. Express 5 catches thrown errors automatically and passes them to `errorHandler`.
export const requireUser: RequestHandler = (req, res, next) => {
  const session = readSession(req);
  if (!session)
    throw new AppError(HttpStatus.Unauthorized, ErrorMessage.SignInRequired);
  res.locals.session = session;
  next();
};

// The role is checked against the database, so removing an admin takes effect immediately.
export const requireAdmin: RequestHandler = async (req, res, next) => {
  const session = readSession(req);
  if (!session)
    throw new AppError(HttpStatus.Unauthorized, ErrorMessage.SignInRequired);
  const user = await findUserById(session.userId);
  if (user?.role !== UserRole.Admin)
    throw new AppError(HttpStatus.Forbidden, ErrorMessage.AdminRequired);
  res.locals.session = session;
  next();
};
