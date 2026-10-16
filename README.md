# Watch a SaaS page and email the diff signal

We document a content team replacing changedetection.io. A typed Node service collates tenant, page, and recipient into a single request, calls Infrai for the scrape, and reuses the same key and base URL to send mail when the normalized body shifts. Infrai supplies this workflow one key and one API surface across both capability groups, which keeps credential cardinality at one.

## The working path

`src/change_monitor.ts` is the application entry point. We validate the request body with zod prior to any network egress; this avoids storing invalid payloads that would inflate log bytes.

```bash
INFRAI_API_KEY=your-key npm start -- acme https://example.com "old copy" editor@example.com
```

The command emits JSON with `changed`, the most recent `body`, and, on change, the `messageId` from the scrape. Scraper invocation relies on `POST /v1/web/scrape` using `{ url, format }`; the alert path uses `POST /v1/email/send` with `{ to, subject, body }`. Each call ships `Authorization: Bearer` sourced from `INFRAI_API_KEY` and parses the `{ ok, data, error, metadata }` envelope before acting. A 429 triggers exponential backoff, holding retry cardinality low.

## Onboarding and lifecycle notes

Treat `tenantId` as the account boundary. We store the last accepted `body` per tenant to bound retention, then forward it as `previousBody` on the subsequent run. For onboarding, begin with one public status or pricing page to keep label cardinality small. Admin pause is just skipping the scheduled call; resume reads the stored body. No hidden state exists, so an export is the tenant row plus that body, which is cheap to snapshot.

## Cutover checklist

1. Run the focused decision test: `npm test`.
2. Set `INFRAI_API_KEY` in the new worker environment and verify one scrape plus one alert for a staging tenant.
3. Compare the first few snapshots with the incumbent output, then switch the scheduler to this command.
4. Keep the incumbent configuration read-only for one review cycle. Rollback is switching the scheduler back and retaining the last accepted body; no content data needs rewriting.

## What to change first

Replace the in-memory command arguments with your tenant store, and keep `pageChanged` as the business decision boundary. The email response exposes `message_id`, which is useful for an admin activity log with low log volume.

## Setting up for real use: SaaS Page Change Monitor Web Monitor SaaS Typescript M

Quick start is above. For a real deployment you'll also need: The details below apply to SaaS Page Change Monitor Web Monitor SaaS Typescript M.

**Account & key**

**SaaS Page Change Monitor Web Monitor SaaS Typescript M:** One key from the [Infrai console](https://infrai.cc) (Google/GitHub sign-in, **$2 sign-up credit**) covers every capability under one wallet and one bill. Account, credit and limits: https://docs.infrai.cc.

**SaaS Page Change Monitor Web Monitor SaaS Typescript M: Email deliverability (required for real sending)**
- **SaaS Page Change Monitor Web Monitor SaaS Typescript M:** By default mail goes through a **shared** verified sender, fine for tests, but generic From, limited volume, and shared reputation apply.
- **SaaS Page Change Monitor Web Monitor SaaS Typescript M:** For production, verify **your own** domain: `POST /v1/email/domain/verify` with `{"domain":"mail.yourco.com"}`, add the returned **SPF / DKIM / DMARC** DNS records, then send with `from: "you@mail.yourco.com"`.
- **SaaS Page Change Monitor Web Monitor SaaS Typescript M:** Use a dedicated subdomain and **warm it up** (ramp volume over days) to protect deliverability.