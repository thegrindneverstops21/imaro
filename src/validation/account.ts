import { z } from "zod";
import { ACCOUNT_LIMITS } from "../constants/account";
import { GUEST_FIELD_LIMITS } from "../constants/domain";
import { ErrorMessage } from "../constants/messages";

export const profilePatch = z
  .object({
    name: z.string().trim().min(1).max(GUEST_FIELD_LIMITS.nameMax).optional(),
    phone: z
      .string()
      .trim()
      .min(GUEST_FIELD_LIMITS.phoneMin)
      .max(GUEST_FIELD_LIMITS.phoneMax)
      .optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, ErrorMessage.EmptyPatch);
export const reviewBody = z
  .object({
    rating: z
      .number()
      .int()
      .min(ACCOUNT_LIMITS.ratingMin)
      .max(ACCOUNT_LIMITS.ratingMax),
    comment: z.string().trim().max(ACCOUNT_LIMITS.reviewMax).optional(),
  })
  .strict();
export const pageQuery = z.object({
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(ACCOUNT_LIMITS.pageMax)
    .default(ACCOUNT_LIMITS.pageDefault),
  offset: z.coerce.number().int().min(0).default(0),
});
export const notificationId = z.coerce.number().int().positive();
export type ProfilePatch = z.infer<typeof profilePatch>;
export type ReviewInput = z.infer<typeof reviewBody>;
export type Page = z.infer<typeof pageQuery>;
