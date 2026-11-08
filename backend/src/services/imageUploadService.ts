import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { AppError } from "../middleware/error";
import { env } from "../config/env";

// Point UPLOAD_DIR at a persistent volume when deploying the API.
export const imageUploadDirectory = resolve(env.UPLOAD_DIR);

export async function saveUploadedImage(body: unknown) {
  if (!Buffer.isBuffer(body) || !body.length || body.length > 5 * 1024 * 1024) {
    throw new AppError(400, "Choose an image smaller than 5 MB.");
  }
  const jpeg = body[0] === 0xff && body[1] === 0xd8 && body[2] === 0xff;
  const png = body.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  const webp = body.toString("ascii", 0, 4) === "RIFF" && body.toString("ascii", 8, 12) === "WEBP";
  if (!jpeg && !png && !webp) throw new AppError(400, "Please choose a JPEG, PNG or WebP image.");
  const filename = `${randomUUID()}.${jpeg ? "jpg" : png ? "png" : "webp"}`;
  await mkdir(imageUploadDirectory, { recursive: true });
  await writeFile(resolve(imageUploadDirectory, filename), body, { flag: "wx" });
  return { path: `/api/v1/uploads/${filename}` };
}
