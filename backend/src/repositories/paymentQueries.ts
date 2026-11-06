import { PaymentRecordStatus } from "../constants/domain";

// Serialize the same provider reference even when it targets different bookings.
export const LOCK_PAYMENT = `SELECT pg_advisory_xact_lock(hashtext($1))`;

export const FIND_PAYMENT = `SELECT id FROM payments WHERE provider=$1 AND provider_ref=$2`;

export const INSERT_PAYFAST_PAYMENT = `INSERT INTO payments
  (booking_id,provider,provider_ref,amount,status)
  VALUES ($1,$2,$3,$4,'${PaymentRecordStatus.Complete}')`;
