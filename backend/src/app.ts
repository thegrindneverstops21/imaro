import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config/env";
import { API_PREFIX, Environment, JSON_BODY_LIMIT } from "./constants/domain";
import { errorHandler, notFound } from "./middleware/error";
import { router } from "./routes";
import { paymentsRouter } from "./routes/payments";
import { imageUploadDirectory } from "./services/imageUploadService";

export const app = express();

function allowedOrigin(origin: string | undefined) {
  if (!origin || origin === env.CLIENT_URL) return true;
  return (
    env.NODE_ENV === Environment.Development &&
    /^https?:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin)
  );
}

// helmet adds security-related HTTP headers (and hides "powered by Express").
app.use(helmet());
// CORS lets the React dev server (a different port) call this API with cookies.
app.use(cors({
  origin: (origin, callback) => {
    callback(null, allowedOrigin(origin));
  },
  credentials: true,
}));
app.use(`${API_PREFIX}/uploads`, express.static(imageUploadDirectory, {
  dotfiles: "deny",
  index: false,
  immutable: true,
  maxAge: "1y",
  setHeaders: (res) => { res.setHeader("Cross-Origin-Resource-Policy", "cross-origin"); },
}));
app.use(`${API_PREFIX}/payments`, paymentsRouter);
// Parse JSON request bodies into `req.body`; cap the size to avoid abuse.
app.use(express.json({ limit: JSON_BODY_LIMIT }));
// morgan logs each request in the terminal while developing (noisy in tests).
if (env.NODE_ENV !== Environment.Test) app.use(morgan("dev"));

// All real endpoints live under /api/v1, e.g. /api/v1/branches.
app.use(API_PREFIX, router);

// Reached only if no route above matched, or a route called next(error).
app.use(notFound);
app.use(errorHandler);
