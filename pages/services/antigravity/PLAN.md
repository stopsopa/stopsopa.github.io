# Plan: Antigravity AI Usage Tracker UI

## 1. Overview & Objectives
Build a dedicated UI dashboard in Cloudflare styling to track multiple Google accounts used with Antigravity AI, their renewal intervals, and model expiration timestamps.
- **HTML**: `/pages/services/antigravity/index.html`
- **React Entry**: `/pages/services/antigravity/antigravity.entry.tsx`
- **Styles**: `/pages/services/antigravity/antigravity.entry.css` (raw nested CSS, Cloudflare dashboard styling)
- **State/Storage**: Firebase Realtime Database via `useCustomState` with `section: "antigravity_cli"`

---

## 2. Firebase Data Schema (`section: "antigravity_cli"`)

Root under user namespace: `users/<user_email>/antigravity_cli`

```typescript
interface AntigravitySettings {
  renewalHours: number; // e.g. 24 or 3
  models: string[];     // list of available models, e.g. ["gemini-2.5-pro", "gemini-2.5-flash", "claude-3-7-sonnet"]
}

interface AccountUsage {
  expiredAt: string | null; // ISO timestamp or epoch string when usage expired (null/empty if fresh/unused)
  notes?: string;
  updatedAt?: string;
}

interface AntigravityDatabaseSchema {
  settings: AntigravitySettings;
  list: Record<string, AccountUsage>; // key is email (sanitized or escaped as needed for Firebase key rules)
}
```

> **Note on Firebase Keys**: Firebase paths disallow `.`, `$`, `#`, `[`, `]`, `/`. For email keys in `list`, encode email using base64 or replace dots with commas (standard Firebase pattern, e.g. `foo@gmail,com` or `encodeURIComponent(email)`), while keeping raw email in the object or decoded in UI.

---

## 3. Expiration & Renewal Logic

1. **Renewal Calculation**:
   - Renewal time = `expiredAt + settings.renewalHours (hours)`
   - Time remaining = `Renewal time - Current time`
   - If `expiredAt` is null, or `Current time >= Renewal time`: Status is **"usage unused"** (ready for use / renewed).
   - If `Current time < Renewal time`: Display countdown / remaining duration (e.g. `X hours Y minutes remaining`).

2. **Setting Expiration**:
   - **Mode A (Exact date/time)**: User specifies exact date/time when it expired $\rightarrow$ saved directly to `expiredAt`.
   - **Mode B (Remaining hours offset)**: User specifies hours left to wait ($H_{remaining}$) $\rightarrow$ Calculate `expiredAt = now - (renewalHours - H_{remaining})` $\rightarrow$ saved to `expiredAt`.
   - **Reset / Mark Unused**: Clear `expiredAt = null`.
   - **Mark Expired Now**: Set `expiredAt = new Date().toISOString()`.

---

## 4. UI / UX Design (Cloudflare Dashboard Aesthetic)

- **Color Palette & Styling**:
  - Background: Clean neutral `#f4f5f7` or Cloudflare dark/light theme (crisp white cards `#ffffff`, subtle borders `#e2e8f0` / `#d1d5db`, CF accent orange `#f38020` / `#faad3f`, deep navy/slate header `#1d283a` / `#000000`).
  - Typography: System sans-serif (`-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`), clear data tables, badge pills for status (`badge-green` for "usage unused", `badge-amber` for "cooling down").
- **Header**:
  - Breadcrumb navigation (`Services / Antigravity AI Usage Tracker`)
  - Overall status badges (Total accounts, Ready/Unused count, In Cooldown count)
- **Settings Section (Collapsible or Card)**:
  - Global renewal interval input (hours)
  - Models management (tag pills / add / remove model)
  - Save settings button
- **Account List Table**:
  - Filter / Search accounts by email
  - "Add Account" inline form or modal
  - Table Columns:
    1. **Account (Email)**
    2. **Status Badge** ("Usage unused" vs "Cooling down: Xh Ym left")
    3. **Expired At** (Formatted timestamp or "None")
    4. **Renews At** (Calculated target timestamp)
    5. **Actions**:
       - Quick button: "Expired Just Now"
       - Quick button: "Mark Unused"
       - Set Expiration Popover/Modal (Set exact date/time OR set "Remaining hours" offset)
       - Delete account
- **Footer**:
  - Firebase console dashboard link: `https://console.firebase.google.com/` (per USAGE.md)

---

## 5. Implementation Steps

1. **Step 1 - HTML (`index.html`)**:
   - Load `/public/preprocessed.js?antigravity`
   - Load `/dist/firebase.core.entry.bundle.js`
   - Load `/dist/antigravity.entry.bundle.css`
   - Load `/dist/antigravity.entry.bundle.js`
   - Define `<div id="root"></div>`

2. **Step 2 - Styling (`antigravity.entry.css`)**:
   - Write standard modern CSS with native nesting for Cloudflare dashboard theme.
   - Distinct badges, action buttons, table styling, and modal/popover dialogs.

3. **Step 3 - React Entry & Components (`antigravity.entry.tsx`)**:
   - Use `useCustomState({ section: "antigravity_cli" })`
   - Guard until authenticated `id` is ready.
   - Load `settings` and `list`.
   - Real-time periodic ticker (every 30s-60s) to update remaining time counters.
   - Modals / Popovers with unique `data-testid` on all interactive buttons and inputs.
   - Comments following project rules (docstrings and no negated conditions with else).

---

## 6. Review & Verification
- Verify against rules in `SERVICES_RULES.md`, `USAGE.md`, and project instructions.
- Ensure all interactive elements have `data-testid`.
- Check non-negated conditionals and raw CSS nesting support.
