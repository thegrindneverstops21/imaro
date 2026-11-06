import { rows, type Queryable } from "../db/pool";
import { PAYFAST } from "../constants/payfast";
import * as sql from "./paymentQueries";

export async function paymentExists(db: Queryable, reference: string) {
  await rows(sql.LOCK_PAYMENT, [`${PAYFAST.provider}:${reference}`], db);
  return (
    (await rows(sql.FIND_PAYMENT, [PAYFAST.provider, reference], db)).length > 0
  );
}

export async function insertPayment(
  db: Queryable,
  payment: { bookingId: number; reference: string; amount: number },
) {
  await rows(
    sql.INSERT_PAYFAST_PAYMENT,
    [payment.bookingId, PAYFAST.provider, payment.reference, payment.amount],
    db,
  );
}
