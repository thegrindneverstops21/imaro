import { z } from "zod";
import {
  ADMIN_FIELD_LIMITS,
  ADMIN_LIST_LIMIT,
  BookingStatus,
  PaymentStatus,
  GUEST_LIMITS,
  RoomStatus,
} from "../constants/domain";

import { isoDate } from "./stay";
import { ErrorMessage } from "../constants/messages";

// URL parameters arrive as strings, so ids must be coerced to numbers.
const id = z.coerce.number().int().positive();
const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);

export const adminId = id;
export const branchInput = z.object({
  slug: z
    .string()
    .trim()
    .min(1)
    .max(ADMIN_FIELD_LIMITS.slugMax)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  name: z.string().trim().min(1).max(ADMIN_FIELD_LIMITS.nameMax),
  description: z.string().trim().min(1),
  address: z.string().trim().min(1).max(ADMIN_FIELD_LIMITS.addressMax),
  city: z.string().trim().min(1).max(ADMIN_FIELD_LIMITS.cityMax),
  lat: z
    .number()
    .min(-ADMIN_FIELD_LIMITS.latitude)
    .max(ADMIN_FIELD_LIMITS.latitude),
  lng: z
    .number()
    .min(-ADMIN_FIELD_LIMITS.longitude)
    .max(ADMIN_FIELD_LIMITS.longitude),
  phone: z
    .string()
    .trim()
    .min(ADMIN_FIELD_LIMITS.phoneMin)
    .max(ADMIN_FIELD_LIMITS.phoneMax),
  email: z.string().trim().email().max(ADMIN_FIELD_LIMITS.emailMax),
  starRating: z
    .number()
    .int()
    .min(ADMIN_FIELD_LIMITS.starRatingMin)
    .max(ADMIN_FIELD_LIMITS.starRatingMax),
  checkInTime: time.default("14:00"),
  checkOutTime: time.default("10:00"),
  isPublished: z.boolean().default(true),
});
export const branchPatch = branchInput.partial().extend({
  checkInTime: time.optional(),
  checkOutTime: time.optional(),
  isPublished: z.boolean().optional(),
});
export const branchCreateInput = branchInput.extend({
  images: z.array(z.object({
    url: z.string().trim().url().max(ADMIN_FIELD_LIMITS.imageUrlMax).refine((value) => /^https?:\/\//i.test(value)),
    alt: z.string().trim().min(1).max(ADMIN_FIELD_LIMITS.imageAltMax),
  })).max(ADMIN_FIELD_LIMITS.imagesMax).default([]),
  amenities: z.array(
    z.string().trim().min(1).max(ADMIN_FIELD_LIMITS.amenityMax),
  ).max(ADMIN_FIELD_LIMITS.amenitiesMax).default([]),
  policies: z.array(z.object({
    type: z.enum(["house_rules", "cancellation", "payment"]),
    title: z.string().trim().min(1).max(ADMIN_FIELD_LIMITS.policyTitleMax),
    body: z.string().trim().min(1).max(ADMIN_FIELD_LIMITS.policyBodyMax),
  })).max(ADMIN_FIELD_LIMITS.policiesMax).default([]),
});
export type BranchCreateInput = z.infer<typeof branchCreateInput>;
export const roomInput = z.object({
  roomTypeId: id,
  roomNumber: z.string().trim().min(1).max(ADMIN_FIELD_LIMITS.roomNumberMax),
  status: z.enum(RoomStatus).default(RoomStatus.Active),
});
export const roomPatch = z
  .object({
    roomTypeId: id.optional(),
    roomNumber: z
      .string()
      .trim()
      .min(1)
      .max(ADMIN_FIELD_LIMITS.roomNumberMax)
      .optional(),
    status: z.enum(RoomStatus).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, ErrorMessage.EmptyPatch);
export const priceInput = z.object({
  pricePerNight: z.number().finite().min(0).max(ADMIN_FIELD_LIMITS.priceMax),
});
export const bookingUpdate = z
  .object({
    checkIn: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional(),
    checkOut: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional(),
    guests: z
      .number()
      .int()
      .min(GUEST_LIMITS.min)
      .max(GUEST_LIMITS.max)
      .optional(),
  })
  .refine((value) => Object.keys(value).length > 0, ErrorMessage.EmptyPatch);

export type BranchInput = z.infer<typeof branchInput>;
export type BranchPatch = z.infer<typeof branchPatch>;
export type RoomInput = z.infer<typeof roomInput>;
export type RoomPatch = z.infer<typeof roomPatch>;
export type BookingUpdate = z.infer<typeof bookingUpdate>;

export const reservationFilters = z
  .object({
    search: z.string().trim().max(ADMIN_FIELD_LIMITS.emailMax).optional(),
    dateFrom: isoDate.optional(),
    dateTo: isoDate.optional(),
    limit: z.coerce
      .number()
      .int()
      .min(1)
      .max(ADMIN_LIST_LIMIT)
      .default(ADMIN_LIST_LIMIT),
    offset: z.coerce.number().int().min(0).default(0),
    status: z.enum(BookingStatus).optional(),
    paymentStatus: z.enum(PaymentStatus).optional(),
    branchId: id.optional(),
  })
  .refine(
    ({ dateFrom, dateTo }) => !dateFrom || !dateTo || dateFrom <= dateTo,
    { message: ErrorMessage.DateFilterOrder, path: ["dateTo"] },
  );