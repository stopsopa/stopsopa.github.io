/* ============================================================
   Google Drive AppData Explorer — entry point
   Bundled by esbuild → /dist/google_drive_application_data_explorer.entry.bundle.js
   
   All Drive API calls use browser fetch().
   Auth uses Google Identity Services (GIS) loaded via CDN in index.html.
   No Node.js-only imports allowed here.
   ============================================================ */

import { get as getEnv } from "envprocessor";
// @ts-ignore
import "./google_drive_application_data_explorer.css";

/* ---- Types ---- */

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  modifiedTime?: string;
  createdTime?: string;
}

interface DriveListResponse {
  files: DriveFile[];
  nextPageToken?: string;
}

/* Google Identity Services token client — loaded via CDN, accessed via (window as any).google */

/* ---- State ---- */

let accessToken: string | null = null;
let selectedFile: DriveFile | null = null;

/* ---- Drive API helpers ---- */

/* List ALL files in appDataFolder, following nextPageToken pages */
async function listAllAppDataFiles(): Promise<DriveFile[]> {
  const allFiles: DriveFile[] = [];
  let pageToken: string | undefined = undefined;

  do {
    const params = new URLSearchParams({
      spaces: "appDataFolder",
      pageSize: "100",
      orderBy: "name",
      fields: "nextPageToken,files(id,name,mimeType,size,modifiedTime,createdTime)",
    });
    if (pageToken) params.set("pageToken", pageToken);

    const res = await fetch(`https://www.googleapis.com/drive/v3/files?${params}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Drive API ${res.status}: ${text}`);
    }

    const data: DriveListResponse = await res.json();
    allFiles.push(...(data.files || []));
    pageToken = data.nextPageToken;
  } while (pageToken);

  return allFiles;
}

/* Download a file's raw content and trigger browser download */
async function downloadFile(file: DriveFile): Promise<void> {
  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Download failed ${res.status}: ${text}`);
  }

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = file.name;
  a.click();
  URL.revokeObjectURL(url);
}

/* ---- Formatting helpers ---- */

/* Convert bytes string to human-readable size */
function formatSize(bytes?: string): string {
  if (!bytes) return "—";
  const n = parseInt(bytes, 10);
  if (isNaN(n)) return "—";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
}

/* Format ISO date string to readable local date */
function formatDate(iso?: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString();
}

/* ---- Render functions ---- */

/*
 * Render the detail panel on the right side.
 * Shows metadata for the selected file and a download button.
 */
function renderDetailPanel(file: DriveFile | null): void {
  const panel = document.getElementById("detail-panel")!;

  if (!file) {
    panel.innerHTML = "<p class='detail-empty'>Select a file to view details.</p>";
    return;
  }

  panel.innerHTML = `
    <div class="detail-content">
      <div class="detail-title">${escapeHtml(file.name)}</div>
      <table class="detail-table">
        <tr><th>ID</th><td class="mono">${escapeHtml(file.id)}</td></tr>
        <tr><th>MIME type</th><td>${escapeHtml(file.mimeType)}</td></tr>
        <tr><th>Size</th><td>${formatSize(file.size)}</td></tr>
        <tr><th>Modified</th><td>${formatDate(file.modifiedTime)}</td></tr>
        <tr><th>Created</th><td>${formatDate(file.createdTime)}</td></tr>
      </table>
      <button id="download-btn" class="btn-download">⬇ Download</button>
      <div id="download-error" class="error-msg"></div>
    </div>
  `;

  document.getElementById("download-btn")!.addEventListener("click", async () => {
    const errEl = document.getElementById("download-error")!;
    errEl.textContent = "";
    try {
      await downloadFile(file);
    } catch (e: any) {
      errEl.textContent = e.message;
    }
  });
}

/*
 * Build a tree node element for a single file.
 * Clicking the row selects the file and shows its detail panel.
 * The [+]/[-] toggle expands an inline content row (for text preview future use).
 */
function buildFileNode(file: DriveFile): HTMLElement {
  const row = document.createElement("div");
  row.className = "tree-row";

  const toggle = document.createElement("span");
  toggle.className = "tree-toggle";
  toggle.textContent = "[+]";

  const icon = document.createElement("span");
  icon.className = "tree-icon";
  icon.textContent = "📄";

  const label = document.createElement("span");
  label.className = "tree-label";
  label.textContent = file.name;

  const mime = document.createElement("span");
  mime.className = "tree-mime";
  mime.textContent = file.mimeType;

  const size = document.createElement("span");
  size.className = "tree-size";
  size.textContent = formatSize(file.size);

  row.appendChild(toggle);
  row.appendChild(icon);
  row.appendChild(label);
  row.appendChild(mime);
  row.appendChild(size);

  /* Expanded content area (hidden by default) */
  const expandedArea = document.createElement("div");
  expandedArea.className = "tree-expanded hidden";
  expandedArea.innerHTML = `<span class="detail-hint">→ See detail panel on the right</span>`;

  let expanded = false;

  toggle.addEventListener("click", (e) => {
    e.stopPropagation();
    expanded = !expanded;
    toggle.textContent = expanded ? "[-]" : "[+]";
    expandedArea.classList.toggle("hidden", !expanded);
  });

  /* Clicking the label/row selects the file */
  label.addEventListener("click", () => selectFile(file, row));
  icon.addEventListener("click", () => selectFile(file, row));

  const wrapper = document.createElement("div");
  wrapper.className = "tree-node file-node";
  wrapper.appendChild(row);
  wrapper.appendChild(expandedArea);

  return wrapper;
}

/* Currently highlighted tree row */
let activeRow: HTMLElement | null = null;

/* Select a file: highlight its row and render detail panel */
function selectFile(file: DriveFile, rowEl: HTMLElement): void {
  if (activeRow) activeRow.classList.remove("selected");
  activeRow = rowEl;
  rowEl.classList.add("selected");
  selectedFile = file;
  renderDetailPanel(file);
}

/*
 * Build the root "appDataFolder" tree node.
 * Starts collapsed. On expand, fetches all files and renders them as children.
 */
function buildRootNode(): HTMLElement {
  const wrapper = document.createElement("div");
  wrapper.className = "tree-node root-node";

  const row = document.createElement("div");
  row.className = "tree-row root-row";

  const toggle = document.createElement("span");
  toggle.className = "tree-toggle";
  toggle.textContent = "[+]";

  const icon = document.createElement("span");
  icon.className = "tree-icon";
  icon.textContent = "📁";

  const label = document.createElement("span");
  label.className = "tree-label root-label";
  label.textContent = "appDataFolder";

  const status = document.createElement("span");
  status.className = "tree-status";

  row.appendChild(toggle);
  row.appendChild(icon);
  row.appendChild(label);
  row.appendChild(status);

  const children = document.createElement("div");
  children.className = "tree-children hidden";

  let expanded = false;
  let loaded = false;

  toggle.addEventListener("click", async () => {
    expanded = !expanded;
    toggle.textContent = expanded ? "[-]" : "[+]";
    children.classList.toggle("hidden", !expanded);

    /* Load children only once on first expand */
    if (expanded && !loaded) {
      loaded = true;
      status.textContent = " (loading…)";
      try {
        const files = await listAllAppDataFiles();
        status.textContent = ` (${files.length} files)`;

        if (files.length === 0) {
          const empty = document.createElement("div");
          empty.className = "tree-empty";
          empty.textContent = "(no files found)";
          children.appendChild(empty);
        } else {
          for (const file of files) {
            children.appendChild(buildFileNode(file));
          }
        }
      } catch (e: any) {
        status.textContent = "";
        const errEl = document.createElement("div");
        errEl.className = "error-msg";
        errEl.textContent = e.message;
        children.appendChild(errEl);
      }
    }
  });

  wrapper.appendChild(row);
  wrapper.appendChild(children);
  return wrapper;
}

/* Render the main explorer tree after successful auth */
function renderExplorer(): void {
  const explorerEl = document.getElementById("explorer")!;
  explorerEl.innerHTML = "";
  explorerEl.appendChild(buildRootNode());
  renderDetailPanel(null);
}

/* ---- Auth ---- */

/*
 * Trigger Google OAuth token flow using GIS.
 * Waits for window.google to be available (GIS async load).
 */
function signIn(clientId: string): void {
  const errEl = document.getElementById("auth-error")!;
  errEl.textContent = "";

  if (!clientId.trim()) {
    errEl.textContent = "Enter your OAuth Client ID first.";
    return;
  }

  /* Wait for GIS library to load */
  const tryInit = () => {
    if (!(window as any).google?.accounts?.oauth2) {
      setTimeout(tryInit, 200);
      return;
    }

    const tokenClient = (window as any).google.accounts.oauth2.initTokenClient({
      client_id: clientId.trim(),
      scope: "https://www.googleapis.com/auth/drive.appdata",
      callback: (response: { access_token?: string; error?: string }) => {
        if (response.error) {
          errEl.textContent = `Auth error: ${response.error}`;
          return;
        }
        if (response.access_token) {
          accessToken = response.access_token;
          showExplorerView();
        }
      },
    });

    tokenClient.requestAccessToken();
  };

  tryInit();
}

/* Switch from auth view to explorer view */
function showExplorerView(): void {
  document.getElementById("auth-section")!.classList.add("hidden");
  document.getElementById("explorer-section")!.classList.remove("hidden");
  renderExplorer();
}

/* ---- HTML escape util ---- */
function escapeHtml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/* ---- Mount the app ---- */

function mount(): void {
  const app = document.getElementById("app")!;

  /* Client ID from preprocessor env vars */
  const defaultClientId = getEnv("GOOGLE_DRIVE_APPDATA_CLIENT_ID") || "";

  app.innerHTML = `
    <div class="header">
      <h1>📁 Google Drive AppData Explorer</h1>
    </div>

    <!-- Auth section (shown before sign-in) -->
    <div id="auth-section" class="auth-section">
      <label for="client-id-input">OAuth 2.0 Client ID (Web application)</label>
      <input
        id="client-id-input"
        type="text"
        placeholder="xxxxxxxx.apps.googleusercontent.com"
        value="${escapeHtml(defaultClientId)}"
        autocomplete="off"
        spellcheck="false"
      />
      <button id="signin-btn" class="btn-signin">Sign In with Google</button>
      <div id="auth-error" class="error-msg"></div>
      <div class="auth-hint">
        <strong>One-time setup — <a href="https://console.cloud.google.com/" target="_blank" rel="noopener">console.cloud.google.com</a>:</strong>
        <ol class="auth-steps">
          <li>
            <span class="step-num">1.</span>
            <span>Create or select a project (suggested name: <code>Google Drive appDataFolder</code>).</span>
          </li>
          <li>
            <span class="step-num">2.</span>
            <span>
              Quick access → <strong>APIs and services</strong> → <strong>Library</strong> (left menu) →
              search <code>Google Drive API</code> → <strong>Enable</strong>.
            </span>
          </li>
          <li>
            <span class="step-num">3.</span>
            <span>
              Go to <a href="https://console.cloud.google.com/auth/overview" target="_blank" rel="noopener">Auth overview</a> →
              left menu <strong>Data access</strong> → <strong>Add or remove scopes</strong> →
              search <code>drive.appdata</code> → pick
              <code>https://www.googleapis.com/auth/drive.appdata</code> → <strong>Update</strong>.
            </span>
          </li>
          <li>
            <span class="step-num">4.</span>
            <span>
              Left menu <strong>Clients</strong> → Application type: <strong>Web application</strong> →
              name e.g. <code>Google Drive appDataFolder Web Client</code> →
              add to <em>Authorized JavaScript origins</em>:
              <code>https://stopsopa.github.io</code> and <code>https://stopsopa.github.io:4339</code>
              (port must be explicit if used) → <strong>Create</strong>.
            </span>
          </li>
          <li>
            <span class="step-num">5.</span>
            <span>Copy the <strong>Client ID</strong> (ends in <code>.apps.googleusercontent.com</code>) and paste it in the field above.</span>
          </li>
        </ol>
        <p class="auth-note">
          // "Sign In" opens a Google account picker popup — works with any account you're currently logged into.<br>
          // appDataFolder is scoped per OAuth app: only files created by the same Client ID are visible.
        </p>
      </div>
    </div>

    <!-- Explorer section (shown after sign-in) -->
    <div id="explorer-section" class="explorer-section hidden">
      <div class="explorer-layout">
        <div class="tree-panel">
          <div class="tree-panel-header">// Click [+] to expand · Click filename to inspect</div>
          <div id="explorer"></div>
        </div>
        <div class="detail-panel" id="detail-panel">
          <p class="detail-empty">Select a file to view details.</p>
        </div>
      </div>
    </div>
  `;

  document.getElementById("signin-btn")!.addEventListener("click", () => {
    const clientId = (document.getElementById("client-id-input") as HTMLInputElement).value;
    signIn(clientId);
  });

  /* Allow pressing Enter in the client ID field to sign in */
  document.getElementById("client-id-input")!.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      const clientId = (document.getElementById("client-id-input") as HTMLInputElement).value;
      signIn(clientId);
    }
  });
}

mount();
