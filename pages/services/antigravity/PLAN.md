# Antigravity AI Tracker — Build Prompt

Build a React SPA page at `/pages/services/antigravity/` with Cloudflare dashboard aesthetic (orange `#f38020`, dark header `#1d283a`, white cards, slate borders). Firebase Realtime Database via `useFirebase({ section: "antigravity_cli" })`.

---

## Firebase Schema

```
settings: {
  renewalHours: number          // default renewal window in hours
  models: string[]              // list of tracked model names
  current?: string              // encodedEmail of currently active account
}
list: {
  [encodedEmail]: {
    models: {
      [encodeModelKey(modelName)]: {
        modelPercentage: number   // 0–100 remaining quota
        renewsAt: string          // ISO timestamp when quota resets
      }
    }
    notes?: string
    disabled?: boolean            // absent or false = active; true = disabled
    updatedAt?: string
  }
}
```

**Key encoding:**

- Email: replace `.` → `,` (`encodeEmailKey` / `decodeEmailKey`)
- Model name: `encodeURIComponent(name).replace(/\./g, "%2E")` (`encodeModelKey`) — required because model names like "Gemini 3.8 Flash" contain dots and spaces

---

## Renewal Logic

- If `Date.now() >= renewsAt` for a model → that model is **renewed** → show 100% regardless of stored `modelPercentage`
- Otherwise show stored `modelPercentage` and time-left countdown
- "Expired Now" action: sets `modelPercentage = 0`, `renewsAt = now + renewalHours`
- "Set Quota" modal: user enters `%` (0–100) and "hours until renew" (float) → `renewsAt = now + hours`

---

## UI Sections

### Header

- Badge "AGY", title "Antigravity AI Tracker"
- Logged-in user email (decoded), Sign Out button

### Time Simulation Bar (sticky top)

- Checkbox "Simulate Future Time" + range slider offset (0 → `renewalHours * 2`)
- Shows active effective clock vs real clock
- All renewal calculations use effective time when simulation enabled

### Configuration & Models (collapsible)

- `renewalHours` number input
- Model tag pills with remove (×) button
- Add model text input + button

### Antigravity Accounts Panel

**Header actions:** "Show disabled accounts" checkbox (right side)

**Add account form:** email input + "Add Account" button

**Accounts table columns:**

1. **Current** — radio button per row; click selects as current, click again deselects; selected row is pinned to top, highlighted with orange-left-border and soft orange background (`#fff7ed`)
2. **Account Email** — clickable sortable header (↕ / ▲ / ▼, 3-cycle: unsorted → asc → desc)
3. **Note** — shows 📝 icon only when `notes.trim().length > 0`; clicking icon opens note modal
4. **[Model columns]** — one column per model in `settings.models`:
   - Number input (0–100) for direct % edit
   - Interactive progress bar: click or drag to set % directly
   - "Set Quota..." button → opens quota modal pre-filled with current values
   - "Expired Now" button → sets 0% + `renewsAt = now + renewalHours`
   - Time left label + renewsAt timestamp
   - Sort buttons in header: `% ↕` and `Renews ↕` (3-cycle each)
5. **Actions** — "Note" button (open note modal), "Edit" button (open edit modal)

**Disabled accounts:** `opacity: 0.45`, gray background; hidden unless "Show disabled accounts" checked

---

## Modals

### Set Quota Modal

- "Model Available Percentage (0–100%)" number input; default `0`
- "In how many hours will quota renew?" float input; default `settings.renewalHours`
- Cancel / Save Quota

### Edit Account Modal

- Email input (renaming transfers all data to new key, also updates `settings.current` if needed)
- "Mark account as disabled" checkbox
- Two-stage process notice explaining disable-first-then-delete flow
- Footer left: **"Disable Account"** button (amber style, shown when NOT disabled) → opens confirm dialog → marks `disabled: true`; OR **"Delete Account"** button (red, shown only when already disabled) → opens confirm dialog → permanently deletes from Firebase
- Footer right: Cancel / Save Changes

### Confirm Dialog (zIndex 1100, sits above edit modal)

- Shown for both "disable" and "delete" confirm steps
- Different title/text/button label per action type

### Note Modal

- Textarea for free-form note
- Clear button (clears textarea text in-place, does not save)
- Cancel / Save Note
- Help text: 📝 icon appears in table when note is non-empty

---

## Other Requirements

- All interactive elements must have `data-testid`
- No SCSS — raw CSS with native nesting; styles in `antigravity.entry.css` imported in TSX
- Avoid `useCallback` for premature optimization
- No negated conditions when `else` is present (swap condition + blocks)
- Preserve all comments in existing code
- Footer: Firebase console link `https://console.firebase.google.com/`
- Periodic ticker every 30s to update countdown displays
