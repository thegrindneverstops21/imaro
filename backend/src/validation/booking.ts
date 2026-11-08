import { z } from "zod";
import {
  GUEST_FIELD_LIMITS,
  GUEST_LIMITS,
  ROOM_LIMITS,
} from "../constants/domain";
import { addStayIssues, count, isoDate } from "./stay";

const limits = GUEST_FIELD_LIMITS;

export const createBookingBody = z
  .object({
    branchSlug: z.string().trim().min(1),
    roomType: z.string().trim().min(1),
    checkIn: isoDate,
    checkOut: isoDate,
    guests: count(GUEST_LIMITS),
    rooms: count(ROOM_LIMITS),
    guestName: z.string().trim().min(1, "Enter the guest's full name").max(limits.nameMax),
    guestEmail: z.string().trim().toLowerCase().email("Enter a valid guest email address").max(limits.emailMax),
    guestPhone: z.string().trim().min(limits.phoneMin, "Enter a valid guest phone number").max(limits.phoneMax),
    specialRequests: z.string().trim().max(limits.notesMax).optional(),
  })
  .superRefine(addStayIssues);

export const oauthCallbackQuery = z.object({
  code: z.string().min(1),
  state: z.string().min(1),
});
