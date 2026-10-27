import { createHmac, timingSafeEqual } from "node:crypto";
import type { NextFunction, Request, Response } from "express";
import { env } from "../config/env";
import { HttpStatus } from "../constants/http";
import { AppError } from "./error";

export type Session = { userId: number; email: string; role: "guest" | "admin"; exp: number };
const SECONDS_PER_MILLISECOND = 1000;
const secret = (): string => env.SESSION_SECRET ?? "development-only-change-this-session-secret";
const sign = (value: string): string => createHmac("sha256", secret()).update(value).digest("base64url");
const equal = (a: string, b: string): boolean => {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
};

export function encodeSession(session: Session): string {
  const payload = Buffer.from(JSON.stringify(session)).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function decodeSession(token: string): Session | null {
  const [payload, signature] = token.split(".");
  if (!payload || !signature || !equal(sign(payload), signature)) return null;
  try {
    const session = JSON.parse(Buffer.from(payload, "base64url").toString()) as Session;
  if (!session.userId || session.exp <= Date.now() / SECONDS_PER_MILLISECOND) return null;
    return session;
  } catch {
    return null;
  }
}

export function readBearer(req: Request): Session | null {
  const match = /^Bearer\s+(.+)$/i.exec(req.header("authorization") ?? "");
  return match ? decodeSession(match[1]!) : null;
}

export function requireUser(req: Request, res: Response, next: NextFunction): void {
  const session = readBearer(req);
  if (!session) return next(new AppError(HttpStatus.Unauthorized, "Sign in required"));
  res.locals.session = session;
  next();
}

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  requireUser(req, res, (error?: unknown) => {
    if (error) return next(error);
    const session = res.locals.session as Session;
    if (session.role !== "admin") return next(new AppError(HttpStatus.Forbidden, "Admin access required"));
    next();
  });
}

export function signState(value: string): string { return sign(value); }
export function verifyState(value: string, signature: string): boolean { return equal(sign(value), signature); }
