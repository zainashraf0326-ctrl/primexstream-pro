# Flutter Migration Roadmap (Post APK)

## Objective
Ship fast with Capacitor APK now, then move highest-impact flows to Flutter for stronger native UX.

## Phase 1: Foundation (1-2 weeks)
- Create Flutter app shell with navigation, theme, and auth/session bootstrap.
- Reuse existing backend contracts (Supabase/Firebase service endpoints and table schema).
- Implement route parity for:
  - Login
  - Dashboard
  - IPTV list
  - Orders list
  - Wallet summary

## Phase 2: Revenue-Critical Flows (2-3 weeks)
- Build IPTV checkout + payment proof upload end-to-end.
- Add order-status tracking with near real-time updates.
- Port referral entry and basic wallet rewards view.

## Phase 3: Experience and Stability (2 weeks)
- Improve native interactions (gesture polish, skeleton loaders, pull-to-refresh).
- Add mobile error telemetry and crash reporting.
- Run staged QA for auth, payments, orders, wallet, referrals.

## Phase 4: Optional Extensions
- Keep admin as web-only initially.
- Add mobile admin subset later only if required (orders + approvals).

## Exit Criteria
- Flutter app reaches feature parity on core customer journey:
  login -> browse IPTV -> checkout -> upload proof -> order tracking -> wallet/referral visibility.
