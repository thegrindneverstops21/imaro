const BYTES_PER_KB = 1024;
const BYTES_PER_MB = BYTES_PER_KB * BYTES_PER_KB;

export const MAX_IMAGE_MB = 5;
export const MAX_IMAGE_BYTES = MAX_IMAGE_MB * BYTES_PER_MB;

export interface SignatureCheck {
  offset: number;
  hex: string;
}

// Each image type is recognised by its "magic bytes" (written as hex), not by the file name, so a renamed .exe cannot sneak through as a picture.
export const IMAGE_SIGNATURES = [
  { extension: "jpg", checks: [{ offset: 0, hex: "ffd8ff" }] },
  { extension: "png", checks: [{ offset: 0, hex: "89504e470d0a1a0a" }] },
  {
    extension: "webp",
    checks: [
      { offset: 0, hex: "52494646" },
      { offset: 8, hex: "57454250" },
    ],
  },
] as const;
