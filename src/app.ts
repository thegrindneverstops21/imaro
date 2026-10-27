import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config/env";
import { API_PREFIX, Environment, JSON_BODY_LIMIT } from "./constants/domain";
import { errorHandler, notFound } from "./middleware/error";
import { router } from "./routes";

export const app = express();

app.use(helmet());
app.use(cors({ origin: env.CLIENT_URL, credentials: true }));
app.use(express.json({ limit: JSON_BODY_LIMIT }));
if (env.NODE_ENV !== Environment.Test) app.use(morgan("dev"));

app.use(API_PREFIX, router);

app.use(notFound);
app.use(errorHandler);
