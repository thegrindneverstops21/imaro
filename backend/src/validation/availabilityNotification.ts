import { z } from "zod";
import { GUEST_FIELD_LIMITS } from "../constants/domain";

export const availabilityNotificationBody = z.object({
  email: z.string().trim().toLowerCase().email().max(GUEST_FIELD_LIMITS.emailMax),
});
