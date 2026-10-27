import { z } from "zod";
import {
  GUEST_LIMITS,
  ISO_DATE_PATTERN,
  ROOM_LIMITS,
} from "../constants/domain";
import { StayMessage } from "../constants/messages";
import {
  isRealIsoDate,
  todayIso,
  validateStayDates,
  type StayDates,
} from "../domain/rules";

const isoDate = z
  .string()
  .regex(ISO_DATE_PATTERN, StayMessage.DateFormat)
  .refine(isRealIsoDate, StayMessage.InvalidDate);

const count = (limits: { min: number; max: number }) =>
  z.coerce.number().int().min(limits.min).max(limits.max).default(limits.min);

const stayShape = {
  checkIn: isoDate.optional(),
  checkOut: isoDate.optional(),
  guests: count(GUEST_LIMITS),
  rooms: count(ROOM_LIMITS),
};

function addStayIssues(dates: StayDates, ctx: z.RefinementCtx): void {
  for (const issue of validateStayDates(dates, todayIso())) {
    ctx.addIssue({
      code: "custom",
      message: issue.message,
      path: [issue.field],
    });
  }
}

// Dates optional: browsing a branch before choosing a stay
export const stayQuery = z.object(stayShape).superRefine(addStayIssues);

// Dates required: asking for availability and prices
export const availabilityQuery = z
  .object({ ...stayShape, checkIn: isoDate, checkOut: isoDate })
  .superRefine(addStayIssues);

export const branchSearchQuery = z
  .object({
    ...stayShape,
    roomType: z.string().trim().min(1).optional(),
    city: z.string().trim().min(1).optional(),
    minPrice: z.coerce.number().nonnegative().optional(),
    maxPrice: z.coerce.number().nonnegative().optional(),
  })
  .superRefine(addStayIssues);
