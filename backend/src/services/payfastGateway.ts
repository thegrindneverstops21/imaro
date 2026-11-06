import { env } from "../config/env";
import { PAYFAST } from "../constants/payfast";
import { parameterString, type PayfastFields } from "../domain/payfast";

export async function verifyWithPayfast(fields: PayfastFields) {
  const response = await fetch(
    env.PAYFAST_SANDBOX ? PAYFAST.sandboxValidate : PAYFAST.liveValidate,
    {
      method: "POST",
      headers: { "Content-Type": PAYFAST.formContentType },
      body: parameterString(fields, "", true),
      signal: AbortSignal.timeout(PAYFAST.timeoutMs),
      redirect: "error",
    },
  );
  return response.ok && (await response.text()).trim() === PAYFAST.valid;
}
