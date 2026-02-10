# TabletTimeTracker Implementation Plan

> Generated from full code review on 2026-02-09.
> This document is the source of truth for all planned work.
> Each section has checkboxes. Mark items done as they're completed.
> Commit and push after completing each numbered group.

---

## Phase A: Bug Fixes, Dead Code Removal, Architecture Improvements

### A1. Critical Bug Fixes

- [ ] **Fix balance reset targeting wrong child** (`SettingsPage.tsx:78-105`)
  - Problem: `handleResetBalance` uses the global `balance` (sum of ALL transactions across ALL children/units). It then creates a single adjustment for `activeChildId`, which is wrong.
  - Fix: Replace with a per-member reset. Show a member picker, calculate that member's balance with `getBalance(childId)`, and create the adjustment for that specific childId with the correct unit.
  - Files: `src/pages/SettingsPage.tsx`

- [ ] **Fix History page mixed-unit balance** (`HistoryPage.tsx`)
  - Problem: The "Running Balance" header sums all transactions regardless of unit (minutes + points = nonsense). The `dailyTotal` has the same issue.
  - Fix option A (simpler): Add a child/member filter to HistoryPage so it shows one person's history at a time, with the balance in the correct unit.
  - Fix option B: Show per-member balances in a collapsible header, each with the correct unit.
  - Recommendation: Option A — add a member selector dropdown at the top of HistoryPage, default to "All" which hides the balance, or to the first kid.
  - Files: `src/pages/HistoryPage.tsx`

- [ ] **Fix migration running on every snapshot** (`useFamily.ts:213-216`)
  - Problem: `ensureMembersHaveChildIds` and `ensureChildRecordsHaveIds` are called on every Firestore snapshot, reading the settings doc each time and potentially causing write→snapshot loops.
  - Fix: Add a `migrationRan` ref that's set to `true` after the first run per session. Only run migrations when `migrationRan.current === false`.
  - Files: `src/hooks/useFamily.ts`

### A2. Medium Bug Fixes

- [ ] **Fix timer alarm not firing when tab is backgrounded** (`UsagePage.tsx:125-153`)
  - Problem: `requestAnimationFrame` stops when the tab is inactive. The elapsed time catches up on return (it uses `Date.now()`), but the alarm check only happens inside the rAF callback.
  - Fix: Add a `setInterval` (e.g., every 1 second) as a fallback that checks if `maxTimeMs` has been exceeded. The interval keeps running when the tab is backgrounded. Keep rAF for smooth visual updates, use the interval purely for the alarm trigger.
  - Also consider using the Page Visibility API to immediately check on tab return.
  - Files: `src/pages/UsagePage.tsx`

- [ ] **Fix FaceClockTimer division by zero** (`FaceClockTimer.tsx:104`)
  - Problem: Progress arc calculates `currentSeconds / maxSeconds` without guarding `maxSeconds === 0`.
  - Fix: Add `maxSeconds === 0 ? 0 : (currentSeconds / maxSeconds)` for the strokeDasharray calculation.
  - Files: `src/components/FaceClockTimer.tsx`

- [ ] **Fix missing useEffect dependencies** (`AddTransactionPage.tsx:71`)
  - Problem: `onMemberUsed` and `selectedMemberId` are missing from the dependency array.
  - Fix: Add them. Use `useCallback` on `onMemberUsed` in the parent if needed to prevent infinite loops.
  - Files: `src/pages/AddTransactionPage.tsx`, possibly `src/App.tsx`

- [ ] **Fix UsagePage child restoration depending on array length, not content** (`UsagePage.tsx:88`)
  - Problem: Effect depends on `children.length` — won't update if a child is renamed but count stays the same.
  - Fix: Depend on a serialized key like `children.map(c => c.id + c.name).join(',')` or just `settings?.children`.
  - Files: `src/pages/UsagePage.tsx`

### A3. Dead Code Removal

- [ ] Delete `src/assets/react.svg` (Vite scaffold leftover, never referenced)
- [ ] Remove `PersonalSettings` and `PersonalSettingsDoc` types from `src/types/index.ts` (lines 113-122, never used)
- [ ] Remove `updateChildColor` function from `src/hooks/useSettings.ts` (lines 172-181, never called — SettingsPage uses `updateMemberColor` from useFamily)
- [ ] Remove `linkMemberToChild` from `src/hooks/useFamily.ts` (lines 430-444, exported but never called by any component)
- [ ] Stop exporting `getInviteLink` from `src/hooks/useFamily.ts` (only used internally by `shareInvite`; keep the function, remove from return object)
- [ ] Remove `getApprovedParents` from `src/hooks/useFamily.ts` (lines 459-464, returned but never called)

### A4. Architecture — Move Hooks to Context Providers

> This is the highest-impact refactor. Currently every component that calls `useFamily()` creates its own Firestore listener. Moving to Context means one listener shared app-wide.

**Order matters here — do one at a time, test between each:**

- [ ] **A4a. Create `FamilyProvider` / `FamilyContext`**
  - Move the Firestore listener and state from `useFamily.ts` into a Context provider.
  - The existing `useFamily()` hook becomes a thin wrapper around `useContext(FamilyContext)`.
  - Wrap `<App />` with `<FamilyProvider>` in `main.tsx`.
  - All existing call sites (`useFamily()`) continue to work — they just share one listener now.
  - Files: new `src/contexts/FamilyContext.tsx`, update `src/hooks/useFamily.ts`, update `src/main.tsx`

- [ ] **A4b. Create `SettingsProvider` / `SettingsContext`**
  - Same pattern: move Firestore listener into Context.
  - `useSettings()` becomes a context consumer.
  - Files: new `src/contexts/SettingsContext.tsx`, update `src/hooks/useSettings.ts`, update `src/main.tsx`

- [ ] **A4c. Create `TransactionsProvider` / `TransactionsContext`**
  - Same pattern.
  - `useTransactions()` becomes a context consumer.
  - Files: new `src/contexts/TransactionsContext.tsx`, update `src/hooks/useTransactions.ts`, update `src/main.tsx`

- [ ] **A4d. Create `AuthProvider` / `AuthContext`**
  - Same pattern for `useAuth()`.
  - Files: new `src/contexts/AuthContext.tsx`, update `src/hooks/useAuth.ts`, update `src/main.tsx`

**After A4 is complete, the provider tree in `main.tsx` will be:**
```tsx
<StrictMode>
  <ErrorBoundary>
    <ThemeProvider>
      <AuthProvider>
        <FamilyProvider>
          <SettingsProvider>
            <TransactionsProvider>
              <IdentityProvider>
                <ChildProvider>
                  <App />
                </ChildProvider>
              </IdentityProvider>
            </TransactionsProvider>
          </SettingsProvider>
        </FamilyProvider>
      </AuthProvider>
    </ThemeProvider>
  </ErrorBoundary>
</StrictMode>
```

**Note:** FamilyProvider depends on AuthProvider (needs `user`). SettingsProvider depends on AuthProvider + FamilyProvider. TransactionsProvider depends on AuthProvider + FamilyProvider. Order must be respected.

### A5. Architecture — Break Up Large Files

- [ ] **Split `useFamily.ts` (735 lines)**
  - After A4, the context provider will hold state + listener.
  - Extract action functions into separate files:
    - `src/hooks/useFamilyActions.ts` — createFamily, joinFamily, addManualMember, createMemberInCurrentFamily
    - `src/hooks/useMemberManagement.ts` — updateMemberStatus, updateDisplayName, updateMemberColor, requestPermission
    - `src/hooks/useMemberMatching.ts` — findMatchingMember, linkAuthToMember (+ extract shared matching logic used by joinFamily)
    - `src/hooks/useFamilyInvites.ts` — getInviteLink, shareInvite
  - Each sub-hook reads family/user from context, no new listeners.

- [ ] **Split `SettingsPage.tsx` (880 lines)**
  - Extract into focused components:
    - `src/components/settings/IdentitySection.tsx`
    - `src/components/settings/ProfileSection.tsx`
    - `src/components/settings/FamilySection.tsx` (family info, invite, add member, member list)
    - `src/components/settings/ThemeSection.tsx`
    - `src/components/settings/ReasonsSection.tsx` (reward, redemption, chore — one component with props)
    - `src/components/settings/MemberColorsSection.tsx`
    - `src/components/settings/BalanceResetSection.tsx`
  - `SettingsPage` becomes a thin layout that composes these sections.

### A6. Minor Improvements (while we're in there)

- [ ] Replace all `alert()` calls (~15 occurrences) with a simple toast component
  - Create `src/components/Toast.tsx` and a `useToast` hook or context
  - Find/replace: SettingsPage (many), ApprovalsPage, AddTransactionPage, ChildSelectPage, MemberMatchPage

- [ ] Add `aria-label` attributes to BottomNav buttons (`src/components/BottomNav.tsx`)

- [ ] Remove duplicate matching logic — extract a shared `matchMemberByNameOrEmail(members, name, email)` utility used by both `joinFamily` and `findMatchingMember`

---

## Phase B: Testing

### B1. Set Up Test Infrastructure

- [ ] Add dependencies: `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`, `jsdom`
- [ ] Add vitest config to `vite.config.ts` (or separate `vitest.config.ts`)
- [ ] Add `"test": "vitest"` and `"test:run": "vitest run"` to package.json scripts
- [ ] Create `src/test/setup.ts` for global test setup (e.g., jest-dom matchers)

### B2. Unit Tests — Pure Functions

- [ ] `src/utils/format.test.ts`
  - `formatMinutes`: 0, 1, 59, 60, 61, 120, negative values
  - `formatAmount`: minutes mode, points mode, negative values
  - `getPersonInfo`: with family member match, with settings child match, with neither (Unknown fallback)

- [ ] `src/hooks/useFamily.test.ts` (test the extracted utility functions)
  - `generateFamilyCode`: returns 6-char alphanumeric string
  - `matchMemberByNameOrEmail` (after extraction): exact match, case-insensitive, email match, alternate name match, no match

### B3. Component Tests

- [ ] `src/components/DigitalTimer.test.tsx`
  - Renders correct hours/minutes/seconds for given milliseconds
  - Shows/hides hundredths based on prop
  - Displays label and uses correct color

- [ ] `src/components/FaceClockTimer.test.tsx`
  - Renders without crashing for various currentSeconds/maxSeconds
  - Handles maxSeconds=0 without error
  - Displays label and formatted time

- [ ] `src/components/BottomNav.test.tsx`
  - Renders all 6 tabs
  - Highlights active tab
  - Shows badge count on approvals
  - Calls onNavigate with correct tab id

- [ ] `src/components/ErrorBoundary.test.tsx`
  - Renders children when no error
  - Shows error UI when child throws
  - Reload and reset buttons work

### B4. Hook Tests (with mocked Firebase)

- [ ] `src/hooks/useAuth.test.ts`
  - Returns loading state initially
  - Returns user after auth state change
  - signIn, signUp, signOut call correct Firebase functions

- [ ] `src/hooks/useTransactions.test.ts`
  - `getBalance` returns correct sum for a given childId
  - `approvedTransactions` filters correctly
  - `pendingTransactions` filters correctly
  - Balance calculation excludes non-approved transactions

### B5. Integration / Page Tests

- [ ] `src/pages/AddTransactionPage.test.tsx`
  - Member selection works
  - Category toggles update state
  - Amount selection (quick + custom)
  - Reason selection (preset + custom)
  - Submit creates correct transaction with correct sign (+ for reward, - for redemption)
  - Pending status set for non-parent positive transactions

- [ ] `src/pages/DashboardPage.test.tsx`
  - Renders member balances grouped by role
  - Tapping a member calls onNavigate with correct args
  - Recent transactions display correctly

### B6. (Future) E2E Tests

- [ ] Add Playwright or Cypress
- [ ] Auth flow: sign up → family setup → identity select → child select → dashboard
- [ ] Core loop: add reward → see on dashboard → view in history → use timer → see deduction
- [ ] Approval flow: kid adds time → parent approves → balance updates

---

## Phase C: Security & Legal (DISCUSS WITH USER BEFORE IMPLEMENTING)

> These items require discussion about scope, hosting, compliance requirements, and budget.

### C1. Firestore Security Rules

- [ ] Create `firestore.rules` file in project root
- [ ] Rules to implement:
  - Users can only read families they belong to (check `users/{uid}.familyId`)
  - Only authenticated users can read/write
  - Only approved parents can: modify settings, approve/reject members, delete transactions
  - Kids can only create transactions (not modify/delete)
  - Transactions must have valid fields (amount is number, childId exists, etc.)
  - Rate limiting on reads (if supported by rules)
- [ ] Add `"firestore"` section to `firebase.json` to deploy rules
- [ ] Test rules with Firebase emulator

### C2. Auth Hardening

- [ ] Add email verification requirement after signup
- [ ] Add "Forgot Password" link on AuthPage
- [ ] Add account deletion option in SettingsPage
- [ ] Consider Firebase App Check to prevent API abuse

### C3. Family Code Security

- [ ] Increase code length or add complexity (e.g., 8 chars, or include special separator)
- [ ] Consider expiring invite codes
- [ ] Add rate limiting via Firebase App Check or Cloud Functions

### C4. Legal Compliance (COPPA / GDPR)

- [ ] **Privacy Policy** — required. Needs to cover:
  - What data is collected (names, emails, usage data)
  - How it's stored (Firebase/Google Cloud)
  - COPPA: verifiable parental consent mechanism for children under 13
  - GDPR: right to access, correct, delete data
  - Data retention period
- [ ] **Terms of Service**
- [ ] **Data deletion mechanism** — a button in Settings that deletes all user data from Firestore
- [ ] **Data export** — allow parents to download their family's data as JSON/CSV
- [ ] **Cookie/storage consent** (if required in target jurisdictions)

### C5. Input Validation & Sanitization

- [ ] Add max length limits on all text inputs (names: 50 chars, reasons: 100 chars, family name: 50 chars)
- [ ] Sanitize/trim whitespace on all inputs before saving
- [ ] Validate transaction amounts (positive integer, reasonable max like 1440 = 24 hours)

---

## Phase D: Going Public (DISCUSS WITH USER BEFORE IMPLEMENTING)

> These items are about making the app production-ready and distributable.

### D1. Production Config

- [ ] Change `workbox.mode` from `'development'` to `'production'` in `vite.config.ts`
- [ ] Change `minify` from `false` to `true` (test on device first — was disabled due to terser hanging on Android build)
- [ ] Generate proper PWA icons: `pwa-192x192.png`, `pwa-512x512.png`, `apple-touch-icon.png` from the SVG
- [ ] Replace Vite favicon (`vite.svg`) with app-specific icon
- [ ] Add proper `apple-touch-icon` link in `index.html`
- [ ] Configure workbox runtime caching strategy properly for production

### D2. Error Reporting & Analytics

- [ ] Add Firebase Analytics (free, already in the Firebase project)
- [ ] Add error reporting: Sentry free tier or Firebase Crashlytics
- [ ] Track key events: sign up, family created, family joined, transaction added, timer used

### D3. UX Polish

- [ ] Add a router (React Router or TanStack Router) for URL-based navigation and back button support
- [ ] Loading skeletons instead of spinners
- [ ] Onboarding flow / first-use tutorial
- [ ] Empty state illustrations
- [ ] Proper app icon and splash screen

### D4. App Store Distribution

- [ ] Wrap PWA with Capacitor for native app store distribution
- [ ] Google Play Store ($25 one-time) — requires privacy policy, COPPA declaration
- [ ] Apple App Store ($99/year) — requires privacy policy, COPPA declaration, App Review

### D5. Monetization (Freemium Model)

- [ ] Define tier boundaries:
  - **Free**: 1 family, 2 kids, 30-day history, basic timer
  - **Family ($3-5/month or $30/year)**: Unlimited kids, full history, data export, weekly email reports
  - **Family+ ($5-8/month)**: Scheduled allowances, time locks, push notifications, multi-family
- [ ] Implement subscription infrastructure:
  - Stripe (web) or RevenueCat (mobile) for payment processing
  - Firebase Cloud Functions for subscription status webhooks
  - Firestore `subscriptions/{familyId}` document for tier tracking
- [ ] Gate features based on subscription tier
- [ ] Build premium features:
  - Weekly email reports (Cloud Functions + SendGrid/Mailgun)
  - Scheduled allowances (Cloud Functions cron job)
  - Data export (CSV/JSON download)

### D6. Marketing & Landing Page

- [ ] Create a landing/marketing page (separate from the app)
- [ ] SEO-optimized content targeting "kids screen time tracker", "chore chart app", "earn screen time"
- [ ] App Store screenshots and description
- [ ] Social proof / testimonials

---

## Work Order & Dependencies

```
A1 (critical bugs) → A3 (dead code) → A2 (medium bugs)
                                          ↓
                                    A4 (context providers, one at a time)
                                          ↓
                                    A5 (split large files)
                                          ↓
                                    A6 (minor improvements)
                                          ↓
                                    B1 (test setup)
                                          ↓
                              B2 → B3 → B4 → B5 (tests, can overlap)
                                          ↓
                              C (security/legal — DISCUSS FIRST)
                                          ↓
                              D (going public — DISCUSS FIRST)
```

**Commit strategy:** Commit and push after each numbered group (A1, A2, A3, etc.) at minimum. Larger groups (A4, A5) should have commits per sub-item.

---

## Notes for Future Sessions

- **Build environment:** Edit in `/storage/emulated/0/Documents/coding/TabletTimeTracker`, copy to `~/TabletTimeTracker`, user runs build in terminal.
- **npm install** only works in `~/TabletTimeTracker` (shared storage blocks symlinks).
- **Workbox terser** hangs on Android — that's why `minify: false` and `workbox.mode: 'development'` are set. Don't change without testing on device.
- **Context window:** This plan is self-contained. A fresh session can read this file and pick up where we left off.
