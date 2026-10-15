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
const selectedFileIds = new Set<string>();

/* ---- Drive API helpers ---- */

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

/*
 * Delete multiple files sequentially (one-by-one).
 * onProgress callback provides current progress (done count / total).
 */
async function deleteFilesSequentially(
  fileIds: string[],
  onProgress?: (done: number, total: number) => void
): Promise<void> {
  let done = 0;
  for (const id of fileIds) {
    await deleteFile(id);
    done++;
    if (onProgress) {
      onProgress(done, fileIds.length);
    }
  }
}

/*
 * Download multiple files sequentially with a small delay so browser doesn't block multiple downloads.
 */
async function downloadFilesSequentially(
  files: DriveFile[],
  onProgress?: (done: number, total: number) => void
): Promise<void> {
  let done = 0;
  for (const file of files) {
    await downloadFile(file);
    done++;
    if (onProgress) {
      onProgress(done, files.length);
    }
    /* Small delay to let browser process download dialog / queue */
    if (done < files.length) {
      await new Promise((r) => setTimeout(r, 400));
    }
  }
}

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

/* Index of the last clicked checkbox for shift-click range selection */
let lastClickedIndex = -1;

/*
 * Build a tree node element for a single file.
 * Clicking the row selects the file and shows its detail panel.
 * Checkbox toggles file selection for bulk delete / download, supporting Shift+click range selection.
 * The [+]/[-] toggle expands an inline content row (for text preview future use).
 */
function buildFileNode(
  file: DriveFile,
  index: number,
  allFilesList: DriveFile[],
  containerEl: HTMLElement
): HTMLElement {
  const row = document.createElement("div");
  row.className = "tree-row";

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.className = "tree-checkbox";
  checkbox.dataset.index = String(index);
  checkbox.checked = selectedFileIds.has(file.id);

  checkbox.addEventListener("click", (e: MouseEvent) => {
    e.stopPropagation();
    const isChecked = checkbox.checked;

    if (e.shiftKey && lastClickedIndex !== -1 && lastClickedIndex !== index) {
      const start = Math.min(lastClickedIndex, index);
      const end = Math.max(lastClickedIndex, index);

      for (let i = start; i <= end; i++) {
        const targetFile = allFilesList[i];
        if (!targetFile) continue;
        if (isChecked) {
          selectedFileIds.add(targetFile.id);
        } else {
          selectedFileIds.delete(targetFile.id);
        }
      }

      /* Synchronize all visible checkboxes in the container */
      const checkboxes = containerEl.querySelectorAll<HTMLInputElement>(".tree-checkbox");
      checkboxes.forEach((cb) => {
        const idx = parseInt(cb.dataset.index || "-1", 10);
        if (idx >= start && idx <= end) {
          cb.checked = isChecked;
        }
      });
    } else {
      if (isChecked) {
        selectedFileIds.add(file.id);
      } else {
        selectedFileIds.delete(file.id);
      }
    }

    lastClickedIndex = index;
    updateBulkActionButtons();
  });

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

  row.appendChild(checkbox);
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

/* All currently loaded files in tree */
let currentLoadedFiles: DriveFile[] = [];

type SortField = "modifiedTime" | "name" | "size";
type SortOrder = "asc" | "desc";

let currentSortField: SortField = "modifiedTime";
let currentSortOrder: SortOrder = "desc";

/* Sort files array in place according to current criteria */
function sortFiles(files: DriveFile[]): DriveFile[] {
  return files.sort((a, b) => {
    let cmp = 0;
    if (currentSortField === "name") {
      cmp = a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: "base" });
    } else if (currentSortField === "size") {
      const sa = parseInt(a.size || "0", 10);
      const sb = parseInt(b.size || "0", 10);
      cmp = sa - sb;
    } else if (currentSortField === "modifiedTime") {
      const ta = new Date(a.modifiedTime || 0).getTime();
      const tb = new Date(b.modifiedTime || 0).getTime();
      cmp = ta - tb;
    }
    return currentSortOrder === "asc" ? cmp : -cmp;
  });
}

/* Update visibility and text of bulk action buttons in tree header */
function updateBulkActionButtons(): void {
  const bulkDeleteBtn = document.getElementById("bulk-delete-btn");
  const bulkDownloadBtn = document.getElementById("bulk-download-btn");

  if (bulkDeleteBtn) {
    if (selectedFileIds.size > 0) {
      bulkDeleteBtn.classList.remove("hidden");
      bulkDeleteBtn.textContent = `🗑 Delete Selected (${selectedFileIds.size})`;
    } else {
      bulkDeleteBtn.classList.add("hidden");
    }
  }

  if (bulkDownloadBtn) {
    if (selectedFileIds.size > 0) {
      bulkDownloadBtn.classList.remove("hidden");
      bulkDownloadBtn.textContent = `⬇ Download Selected (${selectedFileIds.size})`;
    } else if (currentLoadedFiles.length > 0) {
      bulkDownloadBtn.classList.remove("hidden");
      bulkDownloadBtn.textContent = `⬇ Download All (${currentLoadedFiles.length})`;
    } else {
      bulkDownloadBtn.classList.add("hidden");
    }
  }
}

/*
 * Build the root "appDataFolder" tree node.
 * Starts expanded by default, fetches all files and renders them as children.
 */
function buildRootNode(): HTMLElement {
  const wrapper = document.createElement("div");
  wrapper.className = "tree-node root-node";

  const row = document.createElement("div");
  row.className = "tree-row root-row";

  const selectAll = document.createElement("input");
  selectAll.type = "checkbox";
  selectAll.className = "tree-checkbox";
  selectAll.title = "Select / Deselect all loaded files";

  const toggle = document.createElement("span");
  toggle.className = "tree-toggle";
  toggle.textContent = "[-]";

  const icon = document.createElement("span");
  icon.className = "tree-icon";
  icon.textContent = "📁";

  const label = document.createElement("span");
  label.className = "tree-label root-label";
  label.textContent = "appDataFolder";

  const status = document.createElement("span");
  status.className = "tree-status";
  status.textContent = " (loading…)";

  row.appendChild(selectAll);
  row.appendChild(toggle);
  row.appendChild(icon);
  row.appendChild(label);
  row.appendChild(status);

  const children = document.createElement("div");
  children.className = "tree-children";

  let expanded = true;

  selectAll.addEventListener("click", (e) => {
    e.stopPropagation();
    const isChecked = selectAll.checked;
    for (const f of currentLoadedFiles) {
      if (isChecked) {
        selectedFileIds.add(f.id);
      } else {
        selectedFileIds.delete(f.id);
      }
    }
    const fileCheckboxes = children.querySelectorAll<HTMLInputElement>(".tree-checkbox");
    fileCheckboxes.forEach((cb) => (cb.checked = isChecked));
    updateBulkActionButtons();
  });

  /* Re-render child nodes using sorted currentLoadedFiles */
  const renderChildren = () => {
    children.innerHTML = "";
    lastClickedIndex = -1;
    if (currentLoadedFiles.length === 0) {
      const empty = document.createElement("div");
      empty.className = "tree-empty";
      empty.textContent = "(no files found)";
      children.appendChild(empty);
    } else {
      const sorted = sortFiles([...currentLoadedFiles]);
      sorted.forEach((file, idx) => {
        children.appendChild(buildFileNode(file, idx, sorted, children));
      });
    }
    updateBulkActionButtons();
  };

  const loadFiles = async () => {
    status.textContent = " (loading…)";
    children.innerHTML = "";
    try {
      currentLoadedFiles = await listAllAppDataFiles();
      status.textContent = ` (${currentLoadedFiles.length} files)`;
      renderChildren();
    } catch (e: any) {
      status.textContent = "";
      const errEl = document.createElement("div");
      errEl.className = "error-msg";
      errEl.textContent = e.message;
      children.appendChild(errEl);
      updateBulkActionButtons();
    }
  };

  /* Hook sort change to re-render children without re-fetching */
  const sortSelect = document.getElementById("sort-select") as HTMLSelectElement | null;
  if (sortSelect) {
    sortSelect.onchange = () => {
      const [field, order] = sortSelect.value.split(":") as [SortField, SortOrder];
      currentSortField = field;
      currentSortOrder = order;
      renderChildren();
    };
  }

  /* Auto-load files immediately */
  loadFiles();

  toggle.addEventListener("click", () => {
    expanded = !expanded;
    toggle.textContent = expanded ? "[-]" : "[+]";
    children.classList.toggle("hidden", !expanded);
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
      selectedFileIds.clear();
      renderExplorer();
    };
  }

  const bulkDeleteBtn = document.getElementById("bulk-delete-btn") as HTMLButtonElement | null;
  if (bulkDeleteBtn) {
    bulkDeleteBtn.onclick = async () => {
      const ids = Array.from(selectedFileIds);
      if (ids.length === 0) return;
      if (!confirm(`Delete ${ids.length} selected files sequentially from appDataFolder?`)) return;

      bulkDeleteBtn.disabled = true;
      try {
        await deleteFilesSequentially(ids, (done, total) => {
          bulkDeleteBtn.textContent = `Deleting ${done}/${total}...`;
        });
      } catch (e: any) {
        alert(`Bulk delete error: ${e.message}`);
      } finally {
        bulkDeleteBtn.disabled = false;
        selectedFileIds.clear();
        selectedFile = null;
        renderExplorer();
      }
    };
  }

  const bulkDownloadBtn = document.getElementById("bulk-download-btn") as HTMLButtonElement | null;
  if (bulkDownloadBtn) {
    bulkDownloadBtn.onclick = async () => {
      let targetFiles: DriveFile[];
      if (selectedFileIds.size > 0) {
        targetFiles = currentLoadedFiles.filter((f) => selectedFileIds.has(f.id));
      } else {
        targetFiles = currentLoadedFiles;
      }

      if (targetFiles.length === 0) return;
      if (!confirm(`Download ${targetFiles.length} files sequentially?`)) return;

      bulkDownloadBtn.disabled = true;
      try {
        await downloadFilesSequentially(targetFiles, (done, total) => {
          bulkDownloadBtn.textContent = `Downloading ${done}/${total}...`;
        });
      } catch (e: any) {
        alert(`Bulk download error: ${e.message}`);
      } finally {
        bulkDownloadBtn.disabled = false;
        updateBulkActionButtons();
      }
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
        <p class="auth-note">
          💡 Tip: When downloading multiple files in bulk, go to <code>chrome://settings/downloads</code> and uncheck <strong>"Ask where to save each file before downloading"</strong> to prevent individual save dialogs.
        </p>
        <p>
        <a href="https://drive.google.com/drive/settings">See how much space your tampermonkey dump takes in appData Folder</a>
        </p>
      </div>
    </div>

    <!-- Explorer section (shown after sign-in) -->
    <div id="explorer-section" class="explorer-section hidden">
      <div class="explorer-layout">
        <div class="tree-panel">
          <div class="tree-panel-header">
            <div class="tree-header-actions">
              <select id="sort-select" class="sort-select" title="Sort files">
                <option value="modifiedTime:desc">Modified (newest)</option>
                <option value="modifiedTime:asc">Modified (oldest)</option>
                <option value="name:asc">Name (A-Z)</option>
                <option value="name:desc">Name (Z-A)</option>
                <option value="size:desc">Size (largest)</option>
                <option value="size:asc">Size (smallest)</option>
              </select>
              <button id="bulk-download-btn" class="btn-tool hidden"></button>
              <button id="bulk-delete-btn" class="btn-danger hidden"></button>
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
