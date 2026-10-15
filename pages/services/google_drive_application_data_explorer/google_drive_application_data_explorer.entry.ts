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
      orderBy: "modifiedTime desc",
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

/* Delete a file from appDataFolder */
async function deleteFile(fileId: string): Promise<void> {
  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Delete failed ${res.status}: ${text}`);
  }
}

/* Upload a new file to appDataFolder */
async function uploadNewFile(fileObj: File): Promise<DriveFile> {
  const metadata = {
    name: fileObj.name,
    parents: ["appDataFolder"],
  };

  const form = new FormData();
  form.append("metadata", new Blob([JSON.stringify(metadata)], { type: "application/json; charset=UTF-8" }));
  form.append("file", fileObj);

  const res = await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart", {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
    body: form,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Upload failed ${res.status}: ${text}`);
  }

  return await res.json();
}

/* Overwrite existing file content and/or metadata */
async function updateExistingFile(fileId: string, fileObj: File): Promise<DriveFile> {
  const metadata = {
    name: fileObj.name,
  };

  const form = new FormData();
  form.append("metadata", new Blob([JSON.stringify(metadata)], { type: "application/json; charset=UTF-8" }));
  form.append("file", fileObj);

  const res = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=multipart`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${accessToken}` },
    body: form,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Update failed ${res.status}: ${text}`);
  }

  return await res.json();
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
 * Shows metadata for the selected file, download, overwrite/update, and delete buttons.
 */
function renderDetailPanel(file: DriveFile | null): void {
  const panel = document.getElementById("detail-panel")!;

  if (!file) {
    panel.innerHTML = `
      <div class="panel-section">
        <p class="detail-empty">Select a file to view details or upload a new file below.</p>
        <div class="upload-box">
          <h3>Upload New File to appDataFolder</h3>
          <input type="file" id="upload-new-input" />
          <button id="upload-new-btn" class="btn-tool">Upload</button>
          <div id="upload-new-status" class="status-msg"></div>
        </div>
      </div>
    `;

    document.getElementById("upload-new-btn")?.addEventListener("click", async () => {
      const input = document.getElementById("upload-new-input") as HTMLInputElement;
      const statusEl = document.getElementById("upload-new-status")!;
      statusEl.textContent = "";
      if (!input.files || input.files.length === 0) {
        statusEl.textContent = "Select a file first.";
        return;
      }
      try {
        statusEl.textContent = "Uploading...";
        await uploadNewFile(input.files[0]);
        statusEl.textContent = "Uploaded successfully!";
        renderExplorer();
      } catch (e: any) {
        statusEl.textContent = e.message;
      }
    });

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
      <div class="detail-actions">
        <button id="download-btn" class="btn-download">⬇ Download</button>
        <button id="delete-btn" class="btn-danger">🗑 Delete</button>
      </div>

      <div class="detail-update-box">
        <h4>Overwrite with new content:</h4>
        <input type="file" id="update-file-input" />
        <button id="update-file-btn" class="btn-tool">Overwrite</button>
      </div>

      <div id="detail-op-status" class="status-msg"></div>
    </div>
  `;

  /* Download handler */
  document.getElementById("download-btn")!.addEventListener("click", async () => {
    const statusEl = document.getElementById("detail-op-status")!;
    statusEl.textContent = "";
    try {
      await downloadFile(file);
    } catch (e: any) {
      statusEl.textContent = e.message;
    }
  });

  /* Delete handler */
  document.getElementById("delete-btn")!.addEventListener("click", async () => {
    if (!confirm(`Delete "${file.name}" permanently from appDataFolder?`)) return;
    const statusEl = document.getElementById("detail-op-status")!;
    statusEl.textContent = "Deleting...";
    try {
      await deleteFile(file.id);
      statusEl.textContent = "Deleted!";
      selectedFile = null;
      renderExplorer();
    } catch (e: any) {
      statusEl.textContent = e.message;
    }
  });

  /* Overwrite handler */
  document.getElementById("update-file-btn")!.addEventListener("click", async () => {
    const input = document.getElementById("update-file-input") as HTMLInputElement;
    const statusEl = document.getElementById("detail-op-status")!;
    statusEl.textContent = "";
    if (!input.files || input.files.length === 0) {
      statusEl.textContent = "Select a file to overwrite with.";
      return;
    }
    if (!confirm(`Overwrite "${file.name}" with "${input.files[0].name}"?`)) return;
    try {
      statusEl.textContent = "Updating...";
      const updated = await updateExistingFile(file.id, input.files[0]);
      statusEl.textContent = "Updated successfully!";
      selectedFile = updated;
      renderExplorer();
    } catch (e: any) {
      statusEl.textContent = e.message;
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
  renderDetailPanel(selectedFile);

  const refreshBtn = document.getElementById("refresh-tree-btn");
  if (refreshBtn) {
    refreshBtn.onclick = () => {
      renderExplorer();
    };
  }
}

/* ---- Auth ---- */

const STORAGE_KEY_TOKEN = "gdrive_appdata_bearer_token";

/*
 * Parse input to extract clean Bearer token.
 * Accepts "Bearer xxxx" or raw "xxxx".
 */
function parseBearerToken(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed.toLowerCase().startsWith("bearer ")) {
    return trimmed.slice(7).trim();
  }
  return trimmed;
}

/*
 * Use a direct Bearer token and persist to localStorage.
 */
function useDirectToken(rawInput: string): void {
  const errEl = document.getElementById("auth-error")!;
  errEl.textContent = "";

  const token = parseBearerToken(rawInput);
  if (!token) {
    errEl.textContent = "Please provide a valid token.";
    return;
  }

  accessToken = token;
  try {
    localStorage.setItem(STORAGE_KEY_TOKEN, token);
  } catch (e) {
    console.warn("Could not save token to localStorage", e);
  }
  showExplorerView();
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

  /* Load stored token from localStorage if present */
  const savedToken = localStorage.getItem(STORAGE_KEY_TOKEN) || "";

  app.innerHTML = `
    <div class="header">
      <h1>📁 Google Drive AppData Explorer</h1>
    </div>

    <!-- Auth section (shown before sign-in) -->
    <div id="auth-section" class="auth-section">
      <div class="auth-block">
        <label for="token-input">Bearer Token (accepts "Bearer ya29..." or raw "ya29..."):</label>
        <div class="auth-row">
          <input
            id="token-input"
            type="password"
            placeholder="Bearer ya29.a0AX07..."
            value="${escapeHtml(savedToken)}"
            autocomplete="off"
            spellcheck="false"
          />
          <button id="token-btn" class="btn-signin">Explore AppData</button>
        </div>
      </div>

      <div id="auth-error" class="error-msg"></div>

      <div class="auth-hint">
        <strong>How to extract Bearer token from Tampermonkey:</strong>
        <ol class="auth-steps">
          <li>
            <span class="step-num">1.</span>
            <span>Open Tampermonkey dashboard, then open browser DevTools (F12 or right-click → Inspect).</span>
          </li>
          <li>
            <span class="step-num">2.</span>
            <span>Switch to the <strong>Network</strong> tab in DevTools (filter by <code>Fetch/XHR</code>).</span>
          </li>
          <li>
            <span class="step-num">3.</span>
            <span>In Tampermonkey dashboard, navigate to <strong>Utilities</strong> tab.</span>
          </li>
          <li>
            <span class="step-num">4.</span>
            <span>Scroll to Cloud Backup section and click the <strong>Show backups</strong> button.</span>
          </li>
          <li>
            <span class="step-num">5.</span>
            <span>Click any request to <code>googleapis.com</code> in Network tab, find <code>authorization: Bearer ...</code> header, and copy/paste the value above.</span>
          </li>
        </ol>
      </div>
    </div>

    <!-- Explorer section (shown after sign-in) -->
    <div id="explorer-section" class="explorer-section hidden">
      <div class="explorer-layout">
        <div class="tree-panel">
          <div class="tree-panel-header">
            <span>// Click [+] to expand · Click filename to inspect</span>
            <div class="tree-header-actions">
              <button id="refresh-tree-btn" class="btn-tool">↻ Refresh</button>
              <button id="change-token-btn" class="btn-tool">🔑 Change Token</button>
            </div>
          </div>
          <div id="explorer"></div>
        </div>
        <div class="detail-panel" id="detail-panel">
          <p class="detail-empty">Select a file to view details.</p>
        </div>
      </div>
    </div>
  `;

  /* Token submit */
  document.getElementById("token-btn")!.addEventListener("click", () => {
    const raw = (document.getElementById("token-input") as HTMLInputElement).value;
    useDirectToken(raw);
  });

  document.getElementById("token-input")!.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      const raw = (document.getElementById("token-input") as HTMLInputElement).value;
      useDirectToken(raw);
    }
  });

  /* Change token button in explorer view */
  document.getElementById("change-token-btn")?.addEventListener("click", () => {
    document.getElementById("explorer-section")!.classList.add("hidden");
    document.getElementById("auth-section")!.classList.remove("hidden");
  });
}

mount();
