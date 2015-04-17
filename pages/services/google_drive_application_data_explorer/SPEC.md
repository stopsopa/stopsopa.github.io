# Google Drive Application Data Explorer — Spec

## Goal

Build a browser-only HTML page with JS (bundled via esbuild) that acts as an explorer for Google Drive's **appDataFolder** — the hidden per-app storage folder not visible in the normal Drive UI.

## Files

- `index.html` — the page shell
- `google_drive_application_data_explorer.entry.ts` — bundled to `/dist/google_drive_application_data_explorer.entry.bundle.js`

## Tech Stack

- Pure browser JS (no Node.js backend)
- `fetch` for all Drive API calls
- Google Identity Services (GIS) for OAuth — loaded via CDN script tag
- esbuild for bundling the entry TS file
- Raw HTML + raw CSS (no frameworks)

## Auth

- OAuth scope: `https://www.googleapis.com/auth/drive.appdata`
- OAuth client type: **Web application** (created in Google Cloud Console)
- Client ID loaded by default from exposed environment variable `GOOGLE_DRIVE_APPDATA_CLIENT_ID` via `envprocessor`, populated into config input field on page
- Token stored in memory only (not localStorage)

## UI — Windows-style Tree Explorer

- Login area: input for OAuth Client ID + "Sign In" button
- After auth: show tree explorer panel
- Tree root node = "appDataFolder"
- Each node shows: icon (📁 folder / 📄 file), name, mimeType badge, size, modifiedTime
- Expand/collapse nodes via `[+]` / `[-]` toggle buttons (old-Windows style)
- Files are leaf nodes (no children); folders can be expanded
- appDataFolder is flat (Drive API doesn't support true folder hierarchy in appdata — all files live at root), so root expands to show all files directly
- Clicking a file shows its metadata in a detail panel on the right

## File Detail Panel

Shows on file click:

- id, name, mimeType, size (human-readable), modifiedTime, createdTime
- "Download" button — fetches file content and triggers browser download

## Drive API Operations

All via `fetch` to `https://www.googleapis.com/drive/v3/`:

| Operation        | Endpoint                                     |
| ---------------- | -------------------------------------------- |
| List files       | `GET /files?spaces=appDataFolder&fields=...` |
| Get metadata     | `GET /files/{id}?fields=...`                 |
| Download content | `GET /files/{id}?alt=media`                  |

- Handle `nextPageToken` pagination (load all pages)
- Errors shown inline (not alert())

## Layout

```
+------------------------------------------+
| Google Drive AppData Explorer            |
| [Client ID: ____________] [Sign In]      |
+---------------------------+--------------+
| Tree                      | Detail Panel |
| [-] appDataFolder         | name: ...    |
|   [+] file1.json          | size: ...    |
|   [+] config.db           | [Download]   |
|   ...                     |              |
+---------------------------+--------------+
```

## Notes

- No Node.js-only imports (no `fs`, `path`, etc.)
- GIS loaded via `<script src="https://accounts.google.com/gsi/client">` in HTML
- Must run from `localhost` or a real origin (not `file://`) due to OAuth restrictions
- appDataFolder is scoped to the OAuth app — files from other apps (e.g. Tampermonkey) may not be visible unless same client ID
- No destructive operations in v1 (no delete, no upload)
