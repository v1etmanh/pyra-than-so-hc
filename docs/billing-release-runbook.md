# NUMELYRA Pro release runbook

Paid features require an authenticated user and use the versioned monthly quota catalog in `lib/usage/plan-catalog.ts`. Daily Fortune is the exception: every authenticated account may create it for at most three distinct profiles per local day, independent of plan; reopening a profile or adding another locale reuses the same record and does not consume another slot.

## 1. Database

Apply `supabase/migrations/20261025000100_monthly_quota_and_google_play.sql`, then `supabase/migrations/20261029000100_daily_fortune_profile_limit.sql`, before deploying application code. Confirm that authenticated users can only select their own quota/content rows and that only `service_role` can execute quota, Daily Fortune claim/completion, and Google Play event RPCs.

Set `NUMINA_REQUIRE_DURABLE_LIMITS=true` in every production environment. A production instance must fail closed if the quota database is unavailable.

## 2. Google Play Console

1. Create subscription product `numelyra_pro_monthly` with base plan `monthly` at USD 9.99 (localized by Play).
2. Grant the backend service account Android Publisher API access and set `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON` and `GOOGLE_PLAY_PACKAGE_NAME`.
3. Set a stable, randomly generated `GOOGLE_PLAY_ACCOUNT_LINK_SECRET`. Never rotate it without an account-link migration.
4. Configure RTDN to POST Pub/Sub push messages to `/api/billing/google-play/rtdn`. Configure an authenticated push service account and set `GOOGLE_PLAY_RTDN_AUDIENCE` and `GOOGLE_PLAY_RTDN_SERVICE_ACCOUNT_EMAIL`.
5. Build Android with EAS/development build. Expo Go cannot run `expo-iap`.
6. Test pending, purchase, acknowledge, renewal, cancel, grace, hold, pause, expiry, refund, revoke, restore, duplicate RTDN, token replacement, reinstall, and a second device with license testers.

The app must never expose PayOS or PayPal checkout on Android. Google Play prices are read from the localized product returned by Play.

## 3. Web billing

- PayOS checkout uses 249,000 VND and grants one atomic 30-day period. A new PayOS checkout is available only after the active entitlement expires, preventing overlapping quota periods.
- Create a new PayPal monthly plan at USD 9.99 and set its ID in `PAYPAL_PRO_PLAN_ID`. Do not edit the old PayPal plan in place.
- Existing subscribers retain their recorded entitlement through `current_period_end`; checkout rejects a second active provider.

## 4. Cost and operations

Set `ADMIN_USAGE_SECRET` and query `/api/admin/usage` with `Authorization: Bearer <secret>`. The response reports actual provider tokens/cost, cost by feature/user, retry rate, quota-hit rate, web checkout conversion, renewal events, refunds/revokes, churn, and these launch-stopping alerts:

- p95 AI call cost over USD 0.01
- retry rate over 15%
- projected variable COGS over USD 2.50 per active subscriber

Do not widen rollout while any alert remains active. Validate DeepSeek Flash quality before production and keep token caps/retry limits in place.

## 5. Rollout order

1. Apply both migrations in order and verify actual token telemetry plus the three-profile Daily Fortune limit.
2. Enable durable quota and cached/lazy daily content.
3. Configure Play Billing, backend verification, acknowledgement, and RTDN.
4. Verify monthly prices and quota copy on web and Android.
5. Run closed testing with real telemetry.
6. Roll out by percentage only while the cost ceiling and lifecycle tests pass.
