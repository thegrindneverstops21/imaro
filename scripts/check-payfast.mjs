/* global process, console, URL */
import 'dotenv/config';
const required = ['PAYFAST_MERCHANT_ID', 'PAYFAST_MERCHANT_KEY', 'PAYFAST_NOTIFY_URL', 'PAYFAST_RETURN_URL', 'PAYFAST_CANCEL_URL'];
let failures = 0;
const fail = (message) => { console.error(`FAIL: ${message}`); failures++; };
for (const key of required) if (!process.env[key]?.trim()) fail(`${key} is missing`);
if ((process.env.PAYFAST_SANDBOX ?? 'true') !== 'true') fail('PAYFAST_SANDBOX must be true for sandbox preparation');
const paths = { PAYFAST_NOTIFY_URL: '/api/v1/payments/payfast/notify', PAYFAST_RETURN_URL: '/payment/return', PAYFAST_CANCEL_URL: '/payment/cancelled' };
for (const [key, path] of Object.entries(paths)) {
  if (!process.env[key]?.trim()) continue;
  try {
    const url = new URL(process.env[key]);
    if (url.protocol !== 'https:') fail(`${key} needs a public HTTPS address`);
    if (url.hostname === 'localhost' || url.hostname.endsWith('.local') || url.hostname.endsWith('.localhost') || url.hostname === '[::1]' || /^(127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(url.hostname)) fail(`${key} points to a local/private host`);
    if (url.pathname !== path) fail(`${key} must use path ${path}`);
    if (url.username || url.password || url.hash) fail(`${key} must not contain credentials or a fragment`);
  } catch { fail(`${key} is not a valid URL`); }
}
console.log(process.env.PAYFAST_PASSPHRASE ? 'Passphrase configured; confirm it matches the sandbox dashboard.' : 'No passphrase configured; confirm the sandbox dashboard also has none.');
console.log('No secrets printed, network requests sent, or settings changed. Public reachability and a real sandbox ITN still need verification.');
if (!failures) console.log('PASS: local sandbox configuration checks');
process.exitCode = failures ? 1 : 0;
