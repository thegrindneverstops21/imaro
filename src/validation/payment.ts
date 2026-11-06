import { z } from "zod";

export const notification = z.record(z.string(), z.string());
