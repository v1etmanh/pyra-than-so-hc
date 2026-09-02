# Numina closed-beta runbook

## Scope

Invite 20–50 people who use Vietnamese or English numerology readings on mobile and desktop. Do not ask beta users to submit sensitive information beyond the name and birth date needed for the feature.

## Funnel events

- `numerology_calculate`: form completed (only boolean flags, no raw birth date)
- `meaning_request`: indicator opened
- `meaning_cache_hit`: cached reading reopened
- `pricing_view`: pricing page viewed
- `checkout_started` / `checkout_failed`: purchase intent and failure
- `account_delete`: deletion flow completed

## Acceptance checks

1. AI success streams and caches a reading.
2. Empty/provider/partial AI streams are replaced by the knowledge fallback.
3. Offline or slow requests show a retryable error.
4. Free users stop at the daily quota; Pro users receive the higher quota after the signed Stripe webhook.
5. Mobile layout has no horizontal overflow at 320px, 375px, and 768px widths.
6. Privacy and terms links are reachable in both `/vi` and `/en`.
7. Account deletion removes the Supabase user and locally stored Numina data.

## Weekly metrics

Track activation, completed calculations, reading requests per activated user, 7-day return rate, fallback rate, pricing conversion, checkout success rate, support issues, and AI/image cost per active user. Export the admin usage endpoint to a durable store before scaling beyond one deployment instance.

