import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { PG_EXCLUSION_VIOLATION, PG_UNIQUE_VIOLATION, PG_FOREIGN_KEY_VIOLATION } from "../constants/domain";
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

export interface Failure {
  status: number;
  message: string;
  details?: unknown;
}

const databaseCode = (error: unknown): unknown =>
  typeof error === "object" && error !== null && "code" in error
    ? error.code
    : null;

const DATABASE_FAILURES: Record<string, Failure> = {
  [PG_UNIQUE_VIOLATION]: {
    status: HttpStatus.Conflict,
    message: ErrorMessage.ResourceExists,
  },
  [PG_FOREIGN_KEY_VIOLATION]: {
    status: HttpStatus.BadRequest,
    message: ErrorMessage.InvalidReference,
  },
  [PG_EXCLUSION_VIOLATION]: {
    status: HttpStatus.Conflict,
    message: ErrorMessage.BookingConflict,
  },
};

export function toFailure(error: unknown): Failure {
  if (typeof error === "object" && error !== null && "type" in error && error.type === "entity.too.large") {
    return { status: 413, message: "Choose a smaller file or shorten the submitted details." };
  }
  if (error instanceof ZodError) {
    return {
      status: HttpStatus.BadRequest,
      message: ErrorMessage.ValidationFailed,
      details: error.issues,
    };
  }
  if (error instanceof AppError) {
    return { status: error.status, message: error.message, details: error.details };
  }
  const known = DATABASE_FAILURES[String(databaseCode(error))];
  return (
    known ?? {
      status: HttpStatus.InternalServerError,
      message: ErrorMessage.Unexpected,
    }
  );
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
