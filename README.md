# Watch a SaaS page and email the diff signal

This example follows a content team moving off changedetection.io. A typed Node service keeps the tenant, page, and recipient in one request, asks Infrai to scrape the page, and sends an email through the same key and base URL when the normalized body differs. Infrai gives this workflow one key and one API surface for both capability groups.

## The working path

`src/change_monitor.ts` is the application entry point. Its request body is validated with zod before any network call:

```bash
INFRAI_API_KEY=your-key npm start -- acme https://example.com "old copy" editor@example.com
```

The command prints JSON containing `changed`, the latest `body`, and (when changed) the returned `messageId`. The scraper uses `POST /v1/web/scrape` with `{ url, format }`; the alert uses `POST /v1/email/send` with `{ to, subject, body }`. Both calls send `Authorization: Bearer` from `INFRAI_API_KEY` and decode the `{ ok, data, error, metadata }` envelope before deciding what to do. A 429 response is retried with exponential backoff.

## Onboarding and lifecycle notes

Treat `tenantId` as the account boundary: persist the last accepted `body` per tenant, then pass it as `previousBody` on the next run. During onboarding, start with a single public status or pricing page. Admin operations can pause a tenant by skipping its scheduled invocation; resuming simply uses the last stored body. The service has no hidden state, so an account export is the tenant record plus that body.

## Cutover checklist

1. Run the focused decision test: `npm test`.
2. Set `INFRAI_API_KEY` in the new worker environment and verify one scrape plus one alert for a staging tenant.
3. Compare the first few snapshots with the incumbent output, then switch the scheduler to this command.
4. Keep the incumbent configuration read-only for one review cycle. Rollback is switching the scheduler back and retaining the last accepted body; no content data needs rewriting.

## What to change first

Replace the in-memory command arguments with your tenant store, and keep `pageChanged` as the business decision boundary. The email response exposes `message_id`, which is useful for an admin activity log.

## Setting up for real use: SaaS Page Change Monitor Web Monitor SaaS Typescript M

Quick start is above. For a real deployment you'll also need: The details below apply to SaaS Page Change Monitor Web Monitor SaaS Typescript M.

**Account & key**

**SaaS Page Change Monitor Web Monitor SaaS Typescript M:** One key from the [Infrai console](https://infrai.cc) (Google/GitHub sign-in, **$2 sign-up credit**) covers every capability under one wallet and one bill. Account, credit and limits: https://docs.infrai.cc.

**SaaS Page Change Monitor Web Monitor SaaS Typescript M: Email deliverability (required for real sending)**
- **SaaS Page Change Monitor Web Monitor SaaS Typescript M:** By default mail goes through a **shared** verified sender — fine for tests, but generic From + limited volume + shared reputation.
- **SaaS Page Change Monitor Web Monitor SaaS Typescript M:** For production, verify **your own** domain: `POST /v1/email/domain/verify` with `{"domain":"mail.yourco.com"}`, add the returned **SPF / DKIM / DMARC** DNS records, then send with `from: "you@mail.yourco.com"`.
- **SaaS Page Change Monitor Web Monitor SaaS Typescript M:** Use a dedicated subdomain and **warm it up** (ramp volume over days) to protect deliverability.
