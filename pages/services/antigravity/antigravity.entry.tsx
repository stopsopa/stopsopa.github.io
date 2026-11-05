import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom/client";
import useFirebase from "../../databases/firebase/useFirebase";
import "./antigravity.entry.css";

/**
 * Settings data structure for Antigravity AI tracking
 */
interface AntigravitySettings {
  renewalHours: number;
  models: string[];
}

/**
 * Single model state per account:
 * modelPercentage: number (0-100)
 * renewsAt: ISO string timestamp / date representation
 */
interface ModelUsageData {
  modelPercentage: number;
  renewsAt: string;
}

/**
 * Single account usage tracking structure
 */
interface AccountUsage {
  models?: Record<string, ModelUsageData>;
  notes?: string;
  updatedAt?: string;
}

/**
 * Firebase Realtime Database schema under section 'antigravity_cli'
 */
interface AntigravityDatabaseData {
  settings?: AntigravitySettings;
  list?: Record<string, AccountUsage>;
}

/**
 * Escapes email address to be safe as a Firebase Realtime Database key.
 * Firebase disallows: '.', '#', '$', '/', '[', ']'
 */
function encodeEmailKey(email: string): string {
  return email.trim().replace(/\./g, ",");
}

/**
 * Decodes email key from Firebase representation back to standard email
 */
function decodeEmailKey(key: string): string {
  return key.replace(/,/g, ".");
}

/**
 * Escapes arbitrary model name string (which can contain '.', '/', '$', etc. like 'Gemini 3.8 Flash')
 * to be safe as a Firebase Realtime Database child key.
 */
function encodeModelKey(modelName: string): string {
  return encodeURIComponent(modelName).replace(/\./g, "%2E");
}

/**
 * Helper to format duration in remaining hours and minutes
 */
function formatTimeLeft(remainingMs: number): string {
  if (remainingMs > 0) {
    const totalMinutes = Math.floor(remainingMs / (1000 * 60));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours}h ${minutes}m left`;
  } else {
    return "renewed (100%)";
  }
}

/**
 * Helper to pick progress bar color based on percentage availability
 */
function getProgressColor(percent: number): string {
  if (percent >= 100) {
    return "#10b981"; // green belt
  } else if (percent >= 50) {
    return "#0284c7"; // blue
  } else if (percent >= 20) {
    return "#f59e0b"; // amber
  } else {
    return "#ef4444"; // red
  }
}

/**
 * Main Antigravity AI Usage Tracker Component
 */
export function AntigravityTracker() {
  const { user, error, get, set, del, signOut } = useFirebase({
    section: "antigravity_cli",
  });

  const [settings, setSettings] = useState<AntigravitySettings>({
    renewalHours: 24,
    models: ["gemini-2.5-pro", "gemini-2.5-flash", "claude-3-7-sonnet"],
  });

  const [accounts, setAccounts] = useState<Record<string, AccountUsage>>({});
  const [newEmail, setNewEmail] = useState("");
  const [newModelName, setNewModelName] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState<number>(Date.now());

  // Time simulation state
  const [isFakeTimeEnabled, setIsFakeTimeEnabled] = useState<boolean>(false);
  const [fakeTimeOffsetHours, setFakeTimeOffsetHours] = useState<number>(0);

  // Account Edit Modal state (for editing email)
  const [editingAccountKey, setEditingAccountKey] = useState<string | null>(null);
  const [editedEmailValue, setEditedEmailValue] = useState<string>("");

  // Model Quota Update Modal state: (account, model, hours, percent)
  interface ModalQuotaState {
    encodedEmail: string;
    modelName: string;
    percent: number;
    hoursUntilRenew: string;
  }
  const [activeQuotaModal, setActiveQuotaModal] = useState<ModalQuotaState | null>(null);

  // Table sorting state: can sort by any model's percentage or renewsAt
  type SortType = "percentage" | "renewsAt";
  interface SortConfig {
    modelName: string;
    type: SortType;
    direction: "asc" | "desc";
  }
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);

  /**
   * Handles 3-mode header sort click: unsorted -> asc -> desc -> unsorted
   */
  function handleModelSortClick(modelName: string, type: SortType) {
    if (sortConfig && sortConfig.modelName === modelName && sortConfig.type === type) {
      if (sortConfig.direction === "asc") {
        setSortConfig({ modelName, type, direction: "desc" });
      } else {
        setSortConfig(null);
      }
    } else {
      setSortConfig({ modelName, type, direction: "asc" });
    }
  }

  /**
   * Refreshes settings and list from Firebase Realtime Database
   */
  async function loadData() {
    try {
      const data = await get<AntigravityDatabaseData>();
      if (data) {
        if (data.settings) {
          setSettings({
            renewalHours: typeof data.settings.renewalHours === "number" ? data.settings.renewalHours : 24,
            models: Array.isArray(data.settings.models) ? data.settings.models : ["gemini-2.5-pro", "gemini-2.5-flash"],
          });
        }
        if (data.list) {
          setAccounts(data.list);
        } else {
          setAccounts({});
        }
      }
    } catch (err) {
      console.error("Failed to load Antigravity data from Firebase:", err);
    }
  }

  // Ready gate: initialize data when authenticated user is present
  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  // Periodic ticker to recalculate dynamic remaining countdown every 30 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  /**
   * Updates global settings in Firebase
   */
  async function handleSaveSettings(updated: AntigravitySettings) {
    try {
      await set({
        key: "settings",
        data: updated,
      });
      setSettings(updated);
    } catch (err) {
      console.error("Failed to update settings:", err);
    }
  }

  /**
   * Adds a new Google account to the list
   */
  async function handleAddAccount(e: React.FormEvent) {
    e.preventDefault();
    const emailToUse = newEmail.trim();
    if (emailToUse) {
      const encoded = encodeEmailKey(emailToUse);
      const initialModels: Record<string, ModelUsageData> = {};
      const nowIso = new Date().toISOString();

      settings.models.forEach((model) => {
        initialModels[encodeModelKey(model)] = {
          modelPercentage: 100,
          renewsAt: nowIso,
        };
      });

      const newAccount: AccountUsage = {
        models: initialModels,
        updatedAt: nowIso,
      };

      try {
        await set({
          key: ["list", encoded],
          data: newAccount,
        });
        setAccounts((prev) => ({
          ...prev,
          [encoded]: newAccount,
        }));
        setNewEmail("");
      } catch (err) {
        console.error("Failed to add account:", err);
      }
    }
  }

  /**
   * Removes an account from Firebase and state
   */
  async function handleDeleteAccount(encodedEmail: string) {
    try {
      await del(["list", encodedEmail]);
      setAccounts((prev) => {
        const copy = { ...prev };
        delete copy[encodedEmail];
        return copy;
      });
    } catch (err) {
      console.error("Failed to delete account:", err);
    }
  }

  /**
   * Handles editing an account's email identifier
   */
  async function handleSaveEditedAccount() {
    if (editingAccountKey) {
      const newRawEmail = editedEmailValue.trim();
      if (newRawEmail) {
        const newEncoded = encodeEmailKey(newRawEmail);
        const existingData = accounts[editingAccountKey] || {};

        if (newEncoded === editingAccountKey) {
          setEditingAccountKey(null);
        } else {
          try {
            await set({
              key: ["list", newEncoded],
              data: {
                ...existingData,
                updatedAt: new Date().toISOString(),
              },
            });
            await del(["list", editingAccountKey]);

            setAccounts((prev) => {
              const copy = { ...prev };
              delete copy[editingAccountKey];
              copy[newEncoded] = existingData;
              return copy;
            });
            setEditingAccountKey(null);
          } catch (err) {
            console.error("Failed to update account email:", err);
          }
        }
      }
    }
  }

  /**
   * Saves updated model quota (percentage & renewsAt date) for an account
   */
  async function handleSaveQuotaModal() {
    if (activeQuotaModal) {
      const { encodedEmail, modelName, percent, hoursUntilRenew } = activeQuotaModal;
      const safePercent = Math.max(0, Math.min(100, isNaN(percent) ? 0 : percent));
      const hoursNum = parseFloat(hoursUntilRenew);
      const safeHours = isNaN(hoursNum) ? 0 : hoursNum;

      // Calculate future renewsAt timestamp based on hours provided
      const targetTimeMs = Date.now() + safeHours * 60 * 60 * 1000;
      const calculatedRenewsAt = new Date(targetTimeMs).toISOString();

      const targetAccount = accounts[encodedEmail] || {};
      const currentModels = { ...(targetAccount.models || {}) };
      const modelKey = encodeModelKey(modelName);

      currentModels[modelKey] = {
        modelPercentage: safePercent,
        renewsAt: calculatedRenewsAt,
      };

      const updatedAccount: AccountUsage = {
        ...targetAccount,
        models: currentModels,
        updatedAt: new Date().toISOString(),
      };

      try {
        await set({
          key: ["list", encodedEmail],
          data: updatedAccount,
        });
        setAccounts((prev) => ({
          ...prev,
          [encodedEmail]: updatedAccount,
        }));
        setActiveQuotaModal(null);
      } catch (err) {
        console.error("Failed to update model quota:", err);
      }
    }
  }

  /**
   * Marks a model as expired right now for an account:
   * Sets renewsAt = Date.now() + settings.renewalHours
   * Sets modelPercentage = 0%
   */
  async function handleMarkModelExpiredNow(encodedEmail: string, modelName: string) {
    const renewsAtMs = Date.now() + settings.renewalHours * 60 * 60 * 1000;
    const renewsAtIso = new Date(renewsAtMs).toISOString();

    const targetAccount = accounts[encodedEmail] || {};
    const currentModels = { ...(targetAccount.models || {}) };
    const modelKey = encodeModelKey(modelName);

    currentModels[modelKey] = {
      modelPercentage: 0,
      renewsAt: renewsAtIso,
    };

    const updatedAccount: AccountUsage = {
      ...targetAccount,
      models: currentModels,
      updatedAt: new Date().toISOString(),
    };

    try {
      await set({
        key: ["list", encodedEmail],
        data: updatedAccount,
      });
      setAccounts((prev) => ({
        ...prev,
        [encodedEmail]: updatedAccount,
      }));
    } catch (err) {
      console.error("Failed to mark model expired now:", err);
    }
  }

  /**
   * Directly updates percentage for a model. If quota was in cooldown, updates modelPercentage directly.
   */
  async function handleDirectPercentChange(encodedEmail: string, modelName: string, newPercent: number) {
    const safePercent = Math.max(0, Math.min(100, isNaN(newPercent) ? 0 : newPercent));
    const targetAccount = accounts[encodedEmail] || {};
    const currentModels = { ...(targetAccount.models || {}) };
    const modelKey = encodeModelKey(modelName);
    const existingModelData = currentModels[modelKey] || {
      modelPercentage: 100,
      renewsAt: new Date().toISOString(),
    };

    currentModels[modelKey] = {
      ...existingModelData,
      modelPercentage: safePercent,
    };

    const updatedAccount: AccountUsage = {
      ...targetAccount,
      models: currentModels,
      updatedAt: new Date().toISOString(),
    };

    try {
      await set({
        key: ["list", encodedEmail],
        data: updatedAccount,
      });
      setAccounts((prev) => ({
        ...prev,
        [encodedEmail]: updatedAccount,
      }));
    } catch (err) {
      console.error("Failed to update percentage directly:", err);
    }
  }

  /**
   * Helper to inspect model status for a given account.
   * If effectiveNow >= renewsAt: account model quota is renewed -> 100% available
   * Otherwise: model is in cooldown -> displays stored modelPercentage and time left.
   */
  function getModelStatus(account: AccountUsage, modelName: string) {
    const effectiveNow = isFakeTimeEnabled
      ? currentTime + fakeTimeOffsetHours * 60 * 60 * 1000
      : currentTime;

    const modelKey = encodeModelKey(modelName);
    const modelData = account.models ? account.models[modelKey] : undefined;

    if (modelData) {
      const renewsAtMs = new Date(modelData.renewsAt).getTime();
      const remainingMs = renewsAtMs - effectiveNow;

      if (remainingMs > 0) {
        return {
          isRenewed: false,
          percentage: modelData.modelPercentage,
          renewsAt: new Date(renewsAtMs).toLocaleString(),
          renewsAtMs,
          remainingMs,
          timeLeftLabel: formatTimeLeft(remainingMs),
        };
      } else {
        return {
          isRenewed: true,
          percentage: 100,
          renewsAt: new Date(renewsAtMs).toLocaleString(),
          renewsAtMs,
          remainingMs: 0,
          timeLeftLabel: "renewed (100%)",
        };
      }
    } else {
      return {
        isRenewed: true,
        percentage: 100,
        renewsAt: "Unset",
        renewsAtMs: 0,
        remainingMs: 0,
        timeLeftLabel: "ready (100%)",
      };
    }
  }

  if (error) {
    return (
      <div className="cf-app-container">
        <div className="cf-state-screen" data-testid="error-screen">
          <h2>Authentication or Database Error</h2>
          <pre>{JSON.stringify(error, null, 2)}</pre>
        </div>
      </div>
    );
  }

  if (user) {
    const rawAccountEntries = Object.entries(accounts);

    // Sort accounts dynamically by column if configured
    const accountEntries = [...rawAccountEntries].sort((a, b) => {
      if (sortConfig) {
        const statusA = getModelStatus(a[1], sortConfig.modelName);
        const statusB = getModelStatus(b[1], sortConfig.modelName);

        let valA = 0;
        let valB = 0;

        if (sortConfig.type === "percentage") {
          valA = statusA.percentage;
          valB = statusB.percentage;
        } else {
          valA = statusA.renewsAtMs;
          valB = statusB.renewsAtMs;
        }

        if (valA < valB) {
          return sortConfig.direction === "asc" ? -1 : 1;
        } else if (valA > valB) {
          return sortConfig.direction === "asc" ? 1 : -1;
        }
        return 0;
      }
      return 0;
    });

    const maxOffsetHours = settings.renewalHours * 2;
    const effectiveNow = isFakeTimeEnabled
      ? currentTime + fakeTimeOffsetHours * 60 * 60 * 1000
      : currentTime;

    return (
      <div className="cf-app-container" data-testid="antigravity-app">
        {/* Cloudflare styled Header */}
        <header className="cf-header" data-testid="header-container">
          <div className="cf-header-inner">
            <div className="cf-logo-title">
              <span className="cf-badge-icon">AGY</span>
              <h1>Antigravity AI Tracker</h1>
            </div>
            <div className="cf-user-info">
              <span className="cf-user-email" data-testid="user-display">
                {user.replace(/,/g, ".")}
              </span>
              <button
                className="cf-btn-signout"
                onClick={() => signOut()}
                data-testid="button-signout"
              >
                Sign out
              </button>
            </div>
          </div>
        </header>

        <main className="cf-main-content">
          {/* Time simulation driver bar */}
          <div
            style={{
              position: "sticky",
              top: 0,
              zIndex: 100,
              background: "#ffffff",
              border: "1px solid #cbd5e1",
              borderRadius: "6px",
              padding: "1rem 1.25rem",
              boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1)",
              display: "flex",
              flexDirection: "column",
              gap: "0.6rem",
            }}
            data-testid="time-simulation-panel"
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "1rem",
                flexWrap: "wrap",
              }}
            >
              <label
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  fontWeight: 600,
                  fontSize: "0.9rem",
                  cursor: "pointer",
                }}
              >
                <input
                  type="checkbox"
                  checked={isFakeTimeEnabled}
                  onChange={(e) => setIsFakeTimeEnabled(e.target.checked)}
                  data-testid="checkbox-fake-time-enabled"
                />
                Simulate Future Time
              </label>

              <div
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  minWidth: "260px",
                  opacity: isFakeTimeEnabled ? 1 : 0.4,
                  pointerEvents: isFakeTimeEnabled ? "auto" : "none",
                }}
              >
                <input
                  type="range"
                  min="0"
                  max={maxOffsetHours}
                  step="0.1"
                  value={fakeTimeOffsetHours}
                  onChange={(e) => setFakeTimeOffsetHours(parseFloat(e.target.value))}
                  style={{ flex: 1, accentColor: "#f38020", cursor: "pointer" }}
                  data-testid="range-fake-time-offset"
                />
                <span
                  style={{
                    fontWeight: 700,
                    minWidth: "65px",
                    fontSize: "0.85rem",
                    color: "#f38020",
                  }}
                  data-testid="text-offset-display"
                >
                  +{fakeTimeOffsetHours.toFixed(1)}h
                </span>
                <span
                  style={{
                    fontSize: "0.75rem",
                    color: "#64748b",
                    whiteSpace: "nowrap",
                  }}
                >
                  (max +{maxOffsetHours}h)
                </span>
              </div>
            </div>

            <div
              style={{
                fontSize: "0.8rem",
                color: "#64748b",
                display: "flex",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: "0.5rem",
              }}
            >
              <span>
                Active Simulated Clock:{" "}
                <strong style={{ color: isFakeTimeEnabled ? "#f38020" : "#0f172a" }}>
                  {new Date(effectiveNow).toLocaleString()}
                </strong>
                {isFakeTimeEnabled ? " (Fast-forwarded)" : " (Real time)"}
              </span>
              <span>
                Real Time: {new Date(currentTime).toLocaleTimeString()}
              </span>
            </div>
          </div>

          {/* Settings Panel */}
          <section className="cf-panel" data-testid="settings-panel">
            <div className="cf-panel-header">
              <h2>Configuration & Models</h2>
              <div className="cf-panel-actions">
                <button
                  type="button"
                  className="cf-btn cf-btn-secondary cf-btn-sm"
                  onClick={() => setSettingsOpen(!settingsOpen)}
                  data-testid="button-toggle-settings"
                >
                  {settingsOpen ? "Hide Settings" : "Configure Settings"}
                </button>
              </div>
            </div>

            {settingsOpen ? (
              <div className="cf-panel-body" data-testid="settings-body">
                <div className="cf-settings-form">
                  <div className="cf-form-group">
                    <label htmlFor="renewalHoursInput">Default Renewal Interval (Hours)</label>
                    <input
                      id="renewalHoursInput"
                      type="number"
                      min="1"
                      max="168"
                      value={settings.renewalHours}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        const updated = {
                          ...settings,
                          renewalHours: isNaN(val) ? 24 : val,
                        };
                        handleSaveSettings(updated);
                      }}
                      data-testid="input-renewal-hours"
                    />
                    <span className="cf-help-text">
                      Default interval window used for tracking and simulation slider bounds.
                    </span>
                  </div>

                  <div className="cf-form-group">
                    <label>Available Models</label>
                    <div className="cf-models-list" data-testid="models-list-container">
                      {settings.models.map((model) => (
                        <span key={model} className="cf-model-tag" data-testid={`tag-model-${model}`}>
                          {model}
                          <button
                            type="button"
                            className="cf-btn-remove-tag"
                            onClick={() => {
                              const updated = {
                                ...settings,
                                models: settings.models.filter((m) => m !== model),
                              };
                              handleSaveSettings(updated);
                            }}
                            data-testid={`button-remove-model-${model}`}
                          >
                            &times;
                          </button>
                        </span>
                      ))}
                    </div>

                    <div className="cf-add-model-row">
                      <input
                        type="text"
                        placeholder="e.g. Gemini 3.8 Flash"
                        value={newModelName}
                        onChange={(e) => setNewModelName(e.target.value)}
                        data-testid="input-new-model-name"
                      />
                      <button
                        type="button"
                        className="cf-btn cf-btn-secondary"
                        onClick={() => {
                          const trimmed = newModelName.trim();
                          if (trimmed) {
                            if (settings.models.includes(trimmed)) {
                              setNewModelName("");
                            } else {
                              const updated = {
                                ...settings,
                                models: [...settings.models, trimmed],
                              };
                              handleSaveSettings(updated);
                              setNewModelName("");
                            }
                          }
                        }}
                        data-testid="button-add-model"
                      >
                        Add Model
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </section>

          {/* Accounts Management Panel */}
          <section className="cf-panel" data-testid="accounts-panel">
            <div className="cf-panel-header">
              <h2>Antigravity Accounts</h2>
            </div>
            <div className="cf-panel-body">
              {/* Add Account Inline Form */}
              <form onSubmit={handleAddAccount} className="cf-add-account-bar" data-testid="form-add-account">
                <input
                  type="email"
                  placeholder="Enter Google account email (e.g. user@gmail.com)"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  required
                  data-testid="input-new-account-email"
                />
                <button type="submit" className="cf-btn cf-btn-primary" data-testid="button-submit-add-account">
                  Add Account
                </button>
              </form>

              {/* Accounts Table with Split Model Columns */}
              <div className="cf-table-container">
                <table className="cf-table" data-testid="table-accounts">
                  <thead>
                    <tr>
                      <th style={{ minWidth: "160px" }}>Account Email</th>
                      {settings.models.map((modelName) => {
                        const isSortedPct =
                          sortConfig && sortConfig.modelName === modelName && sortConfig.type === "percentage";
                        const isSortedRenews =
                          sortConfig && sortConfig.modelName === modelName && sortConfig.type === "renewsAt";

                        return (
                          <th key={modelName} style={{ minWidth: "220px" }}>
                            <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                              <span style={{ fontWeight: 700, color: "#0f172a" }}>{modelName}</span>
                              <div style={{ display: "flex", gap: "0.5rem", fontSize: "0.7rem" }}>
                                <button
                                  type="button"
                                  onClick={() => handleModelSortClick(modelName, "percentage")}
                                  style={{
                                    border: "none",
                                    background: isSortedPct ? "#f38020" : "#e2e8f0",
                                    color: isSortedPct ? "#ffffff" : "#475569",
                                    padding: "2px 6px",
                                    borderRadius: "3px",
                                    cursor: "pointer",
                                    fontWeight: 600,
                                  }}
                                  title="Sort by quota percentage (unsorted / asc / desc)"
                                  data-testid={`sort-pct-${modelName}`}
                                >
                                  % {isSortedPct ? (sortConfig.direction === "asc" ? "▲" : "▼") : "↕"}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleModelSortClick(modelName, "renewsAt")}
                                  style={{
                                    border: "none",
                                    background: isSortedRenews ? "#f38020" : "#e2e8f0",
                                    color: isSortedRenews ? "#ffffff" : "#475569",
                                    padding: "2px 6px",
                                    borderRadius: "3px",
                                    cursor: "pointer",
                                    fontWeight: 600,
                                  }}
                                  title="Sort by renewsAt date (unsorted / asc / desc)"
                                  data-testid={`sort-renews-${modelName}`}
                                >
                                  Renews{" "}
                                  {isSortedRenews ? (sortConfig.direction === "asc" ? "▲" : "▼") : "↕"}
                                </button>
                              </div>
                            </div>
                          </th>
                        );
                      })}
                      <th style={{ width: "120px" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {accountEntries.length > 0 ? (
                      accountEntries.map(([encodedEmail, acc]) => {
                        const rawEmail = decodeEmailKey(encodedEmail);

                        return (
                          <tr key={encodedEmail} data-testid={`row-account-${encodedEmail}`}>
                            <td>
                              <strong>{rawEmail}</strong>
                            </td>

                            {/* Individual Model Columns */}
                            {settings.models.map((modelName) => {
                              const status = getModelStatus(acc, modelName);
                              const barColor = getProgressColor(status.percentage);

                              return (
                                <td key={modelName} data-testid={`cell-${encodedEmail}-${modelName}`}>
                                  <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                                    <div
                                      style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                        fontSize: "0.8rem",
                                      }}
                                    >
                                      <div style={{ display: "inline-flex", alignItems: "center", gap: "3px" }}>
                                        <input
                                          type="number"
                                          min="0"
                                          max="100"
                                          value={status.percentage}
                                          onChange={(e) =>
                                            handleDirectPercentChange(
                                              encodedEmail,
                                              modelName,
                                              parseFloat(e.target.value)
                                            )
                                          }
                                          style={{
                                            width: "48px",
                                            padding: "2px 4px",
                                            fontSize: "0.8rem",
                                            textAlign: "right",
                                            border: "1px solid #cbd5e1",
                                            borderRadius: "4px",
                                          }}
                                          data-testid={`input-percent-${encodedEmail}-${modelName}`}
                                        />
                                        <span style={{ color: "#64748b", fontWeight: 600 }}>%</span>
                                      </div>

                                      <div style={{ display: "inline-flex", gap: "4px" }}>
                                        <button
                                          type="button"
                                          className="cf-btn cf-btn-secondary cf-btn-sm"
                                          style={{ fontSize: "0.7rem", padding: "2px 5px" }}
                                          onClick={() => {
                                            setActiveQuotaModal({
                                              encodedEmail,
                                              modelName,
                                              percent: status.percentage,
                                              hoursUntilRenew: "3.5",
                                            });
                                          }}
                                          title="Set model percentage and hours until renew"
                                          data-testid={`btn-set-quota-${encodedEmail}-${modelName}`}
                                        >
                                          Set Quota...
                                        </button>
                                        <button
                                          type="button"
                                          className="cf-btn cf-btn-secondary cf-btn-sm"
                                          style={{ fontSize: "0.7rem", padding: "2px 5px" }}
                                          onClick={() => handleMarkModelExpiredNow(encodedEmail, modelName)}
                                          title={`Mark expired now (0%, renews in ${settings.renewalHours}h)`}
                                          data-testid={`btn-expired-now-${encodedEmail}-${modelName}`}
                                        >
                                          Expired Now
                                        </button>
                                      </div>
                                    </div>

                                    {/* Progress bar */}
                                    <div
                                      style={{
                                        width: "100%",
                                        height: "6px",
                                        backgroundColor: "#e2e8f0",
                                        borderRadius: "3px",
                                        overflow: "hidden",
                                      }}
                                      data-testid={`progressbar-wrapper-${encodedEmail}-${modelName}`}
                                    >
                                      <div
                                        style={{
                                          width: `${status.percentage}%`,
                                          height: "100%",
                                          backgroundColor: barColor,
                                          transition: "width 0.25s ease, background-color 0.25s ease",
                                        }}
                                        data-testid={`progressbar-fill-${encodedEmail}-${modelName}`}
                                      />
                                    </div>

                                    <div
                                      style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        fontSize: "0.75rem",
                                        color: "#64748b",
                                      }}
                                    >
                                      <span>
                                        {status.isRenewed ? (
                                          <strong style={{ color: "#10b981" }}>Renewed</strong>
                                        ) : (
                                          status.timeLeftLabel
                                        )}
                                      </span>
                                      <span title={`Renews at: ${status.renewsAt}`}>
                                        {status.renewsAt}
                                      </span>
                                    </div>
                                  </div>
                                </td>
                              );
                            })}

                            <td>
                              <div className="cf-action-buttons">
                                <button
                                  type="button"
                                  className="cf-btn cf-btn-secondary cf-btn-sm"
                                  onClick={() => {
                                    setEditingAccountKey(encodedEmail);
                                    setEditedEmailValue(rawEmail);
                                  }}
                                  title="Edit account email"
                                  data-testid={`button-edit-account-${encodedEmail}`}
                                >
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  className="cf-btn cf-btn-danger cf-btn-sm"
                                  onClick={() => handleDeleteAccount(encodedEmail)}
                                  title="Remove account"
                                  data-testid={`button-delete-account-${encodedEmail}`}
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td
                          colSpan={settings.models.length + 2}
                          style={{ textAlign: "center", padding: "2rem", color: "#64748b" }}
                        >
                          No Antigravity accounts registered yet. Use the form above to add an account.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        </main>

        {/* Set Model Quota Modal */}
        {activeQuotaModal ? (
          <div className="cf-modal-backdrop" data-testid="modal-set-model-quota">
            <div className="cf-modal-dialog">
              <div className="cf-modal-header">
                <h3>
                  Set Quota: {activeQuotaModal.modelName} (
                  {decodeEmailKey(activeQuotaModal.encodedEmail)})
                </h3>
                <button
                  type="button"
                  className="cf-btn-close"
                  onClick={() => setActiveQuotaModal(null)}
                  data-testid="button-close-quota-modal"
                >
                  &times;
                </button>
              </div>

              <div className="cf-modal-body">
                <div className="cf-form-group">
                  <label htmlFor="modalModelPercentageInput">Model Available Percentage (0 - 100%)</label>
                  <input
                    id="modalModelPercentageInput"
                    type="number"
                    min="0"
                    max="100"
                    value={activeQuotaModal.percent}
                    onChange={(e) =>
                      setActiveQuotaModal({
                        ...activeQuotaModal,
                        percent: parseFloat(e.target.value),
                      })
                    }
                    data-testid="input-modal-model-percent"
                  />
                  <span className="cf-help-text">
                    Specify current remaining capacity for this model (e.g. 0% if exhausted, 40% if partially used).
                  </span>
                </div>

                <div className="cf-form-group">
                  <label htmlFor="modalHoursRenewInput">In how many hours will quota renew? (Float allowed)</label>
                  <input
                    id="modalHoursRenewInput"
                    type="number"
                    step="0.1"
                    min="0"
                    value={activeQuotaModal.hoursUntilRenew}
                    onChange={(e) =>
                      setActiveQuotaModal({
                        ...activeQuotaModal,
                        hoursUntilRenew: e.target.value,
                      })
                    }
                    data-testid="input-modal-hours-renew"
                  />
                  <span className="cf-help-text">
                    Calculates future renewsAt timestamp by adding these hours to current time.
                  </span>
                </div>
              </div>

              <div className="cf-modal-footer">
                <button
                  type="button"
                  className="cf-btn cf-btn-secondary"
                  onClick={() => setActiveQuotaModal(null)}
                  data-testid="button-cancel-quota-modal"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="cf-btn cf-btn-primary"
                  onClick={handleSaveQuotaModal}
                  data-testid="button-save-quota-modal"
                >
                  Save Quota
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {/* Edit Account Modal */}
        {editingAccountKey ? (
          <div className="cf-modal-backdrop" data-testid="modal-edit-account">
            <div className="cf-modal-dialog">
              <div className="cf-modal-header">
                <h3>Edit Account Email</h3>
                <button
                  type="button"
                  className="cf-btn-close"
                  onClick={() => setEditingAccountKey(null)}
                  data-testid="button-close-edit-modal"
                >
                  &times;
                </button>
              </div>

              <div className="cf-modal-body">
                <div className="cf-form-group">
                  <label htmlFor="editEmailInput">Email Address</label>
                  <input
                    id="editEmailInput"
                    type="email"
                    value={editedEmailValue}
                    onChange={(e) => setEditedEmailValue(e.target.value)}
                    required
                    data-testid="input-edit-account-email"
                  />
                  <span className="cf-help-text">
                    Renaming the email address will transfer usage and percentages to the new key.
                  </span>
                </div>
              </div>

              <div className="cf-modal-footer">
                <button
                  type="button"
                  className="cf-btn cf-btn-secondary"
                  onClick={() => setEditingAccountKey(null)}
                  data-testid="button-cancel-edit-modal"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="cf-btn cf-btn-primary"
                  onClick={handleSaveEditedAccount}
                  data-testid="button-save-edit-modal"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {/* Footer with Firebase console dashboard link */}
        <footer className="cf-footer" data-testid="footer-container">
          Firebase Console:{" "}
          <a
            href="https://console.firebase.google.com/"
            target="_blank"
            rel="noopener noreferrer"
            data-testid="link-firebase-dashboard"
          >
            https://console.firebase.google.com/
          </a>
        </footer>
      </div>
    );
  } else {
    return (
      <div className="cf-app-container">
        <div className="cf-state-screen" data-testid="connecting-screen">
          <h3>Connecting to Firebase...</h3>
          <p>Authenticating Antigravity AI service session</p>
        </div>
      </div>
    );
  }
}

const rootElement = document.getElementById("root");
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(<AntigravityTracker />);
}
