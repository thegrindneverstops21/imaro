import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { AppError } from "../middleware/error";
import { env } from "../config/env";
import { ErrorMessage } from "../constants/messages";
import { HttpStatus } from "../constants/http";
import {
  IMAGE_SIGNATURES,
  MAX_IMAGE_BYTES,
  type SignatureCheck,
} from "../constants/upload";

// Point UPLOAD_DIR at a persistent volume when deploying the API.
export const imageUploadDirectory = resolve(env.UPLOAD_DIR);

function matchesSignature(body: Buffer, { offset, hex }: SignatureCheck) {
  const expected = Buffer.from(hex, "hex");
  return body.subarray(offset, offset + expected.length).equals(expected);
}

function detectImageExtension(body: Buffer) {
  return IMAGE_SIGNATURES.find((type) =>
    type.checks.every((check) => matchesSignature(body, check)),
  )?.extension;
}

function assertImageSize(body: unknown): asserts body is Buffer {
  if (!Buffer.isBuffer(body) || !body.length || body.length > MAX_IMAGE_BYTES)
    throw new AppError(HttpStatus.BadRequest, ErrorMessage.ImageTooLarge);
}

export async function saveUploadedImage(body: unknown) {
  assertImageSize(body);
  const extension = detectImageExtension(body);
  if (!extension)
    throw new AppError(HttpStatus.BadRequest, ErrorMessage.ImageType);
  const filename = `${randomUUID()}.${extension}`;
  await mkdir(imageUploadDirectory, { recursive: true });
  await writeFile(resolve(imageUploadDirectory, filename), body, { flag: "wx" });
  return { path: `/api/v1/uploads/${filename}` };
}