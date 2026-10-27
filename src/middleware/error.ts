import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { HttpStatus } from "../constants/http";
import { ErrorMessage } from "../constants/messages";

export class AppError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: unknown,
  ) {
    super(message);
  }
}

interface Failure {
  status: number;
  message: string;
  details?: unknown;
}

function toFailure(error: unknown): Failure {
  if (error instanceof ZodError) {
    return {
      status: HttpStatus.BadRequest,
      message: ErrorMessage.ValidationFailed,
      details: error.issues,
    };
  }
  if (error instanceof AppError) {
    return {
      status: error.status,
      message: error.message,
      details: error.details,
    };
  }
  return {
    status: HttpStatus.InternalServerError,
    message: ErrorMessage.Unexpected,
  };
}

export function notFound(_req: Request, res: Response): void {
  res
    .status(HttpStatus.NotFound)
    .json({ error: { message: ErrorMessage.RouteNotFound } });
}

// Express identifies error handlers by their four-argument signature, so max-params is lifted here.
// eslint-disable-next-line max-params
export function errorHandler(
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const { status, message, details } = toFailure(error);
  if (status === HttpStatus.InternalServerError) console.error(error);
  res.status(status).json({ error: { message, details } });
}
