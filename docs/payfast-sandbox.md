# PayFast sandbox preparation

Use sandbox only until the end-to-end checks below pass. Never put merchant keys or the passphrase in VITE_ variables, browser code, Git, or chat.

## Configure locally

Set these in the ignored .env file using your sandbox account and public HTTPS frontend/API origins:

```dotenv
PAYFAST_SANDBOX=true
PAYFAST_MERCHANT_ID=<sandbox merchant ID>
PAYFAST_MERCHANT_KEY=<sandbox merchant key>
PAYFAST_PASSPHRASE=<exact sandbox dashboard passphrase, or empty if none>
PAYFAST_NOTIFY_URL=https://<public-api>/api/v1/payments/payfast/notify
PAYFAST_RETURN_URL=https://<public-frontend>/payment/return
PAYFAST_CANCEL_URL=https://<public-frontend>/payment/cancelled
CLIENT_URL=https://<public-frontend>
```

Run `npm run payfast:check`, then restart the API. The checker prints missing configuration names, never secret values; it makes no network calls. A passing check does not verify credentials or public reachability. The frontend's VITE_API_URL must point to the public API /api/v1, or the frontend host must proxy /api/v1 to it. Serve the built frontend separately: the current Express app is API-only.

## Existing integration

An authorized live booking hold can request signed checkout fields. The browser posts to PayFast's sandbox processor. Return/cancel pages read the booking from the API; redirects never mark a booking paid. ITNs validate signature, merchant, status and amount, then call PayFast's validation endpoint. Payment settlement is transactional and duplicate payment IDs are ignored. Existing automated tests cover authorized checkout, concurrent duplicate ITNs, failed server verification and expired holds.

## Sandbox acceptance

1. Use a dedicated test booking with a live hold and confirm the amount/reference before leaving the site.
2. Complete a sandbox wallet payment; verify the ITN in the sandbox dashboard and the booking's paid amount and pending-approval state in the app.
3. Repeat the same ITN; confirm only one payment record and notification exist.
4. Cancel checkout; verify the app does not claim payment succeeded.
5. Return before ITN delivery; verify the waiting state resolves after verified delivery.
6. Test invalid signatures/amounts and unavailable server validation; never mark those payments successful.
7. Verify staff approval, manage lookup, and printable receipt against the same test reservation.

## Release blockers

No merchant credentials or callback URLs were configured at the 6 November checkpoint. Public callback reachability and a real sandbox transaction remain unverified.

The current handler acknowledges even transient processing failures with HTTP 200, so PayFast will not retry them. Payments arriving after hold expiry are ignored. Before live release, implement and verify durable ITN processing/reconciliation and an explicit late-payment/refund policy that does not revive sold inventory. Do not label this integration live-ready until these are resolved.

## Official references

- https://developers.payfast.co.za/docs/itn-instant-transaction-notification/
- https://support.payfast.help/portal/en/kb/articles/what-causes-an-invalid-url-error-20-9-2022

PayFast requires a publicly reachable notify endpoint; localhost cannot receive ITNs. Production notifications retry when no HTTP 200 is received; sandbox sends only once. Use HTTPS and avoid callback redirects or login protection on the notify endpoint.
