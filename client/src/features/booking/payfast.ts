import { bookingHeaders, json, request } from "../../lib/api";

export async function redirectToPayfast(reference: string, token: string) {
  const payment = await request<{ actionUrl: string; fields: Record<string, string> }>(
    `/bookings/${encodeURIComponent(reference)}/payment`, { ...json("POST"), headers: bookingHeaders(token) },
  );
  const form = document.createElement("form");
  form.method = "POST";
  form.action = payment.actionUrl;
  for (const [name, value] of Object.entries(payment.fields)) {
    const input = document.createElement("input");
    input.type = "hidden"; input.name = name; input.value = value;
    form.append(input);
  }
  document.body.append(form);
  form.submit();
  form.remove();
}
