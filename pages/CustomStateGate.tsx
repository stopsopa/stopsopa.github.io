/**
 * Screen to render instead of the app when useCustomState (pages/useCustomState.ts) is not ready or reports an error:
 * authentication in progress, signed out, failed attempt to sign in.
 *
 * Purpose: one decent looking "gate" for all pages using useCustomState, instead of each page dumping
 * raw json of the error. The error is still fully available - collapsed under "technical details".
 *
 * Styles are inline on purpose (no css file): some pages using the hook don't link any bundled css,
 * this way the component looks the same everywhere without touching html of the page.
 * Nothing here is specific to firebase - it uses only the universal interface.
 *
 * Usage:
 *
 *   const { ready, error, signIn, get, set } = useCustomState<MyState>({ section: "my_namespace" });
 *
 *   if (error || !ready) {
 *     return <CustomStateGate ready={ready} error={error} signIn={signIn} />;
 *   }
 *
 *   ... final ui of the page
 */
import React, { type CSSProperties } from "react";

export type CustomStateGateProps = {
  /** `ready` from useCustomState */
  ready: boolean;
  /** `error` from useCustomState (false when there is no error) */
  error: any;
  /** `signIn` from useCustomState - behind the "Sign in" button */
  signIn: () => Promise<void>;
};

const styles: Record<string, CSSProperties> = {
  wrap: {
    boxSizing: "border-box",
    display: "flex",
    justifyContent: "center",
    padding: "32px 16px",
    width: "100%",
  },
  card: {
    background: "#fff",
    border: "1px solid #dadce0",
    borderRadius: 8,
    boxSizing: "border-box",
    color: "#3c4043",
    fontSize: 14,
    lineHeight: 1.5,
    maxWidth: 520,
    padding: 24,
    textAlign: "left",
    width: "100%",
  },
  title: {
    color: "#202124",
    fontSize: 18,
    fontWeight: 500,
    margin: "0 0 8px",
  },
  text: {
    color: "#5f6368",
    margin: "0 0 16px",
  },
  error: {
    background: "#fce8e6",
    borderRadius: 4,
    color: "#c5221f",
    margin: "0 0 16px",
    overflowWrap: "anywhere",
    padding: "8px 12px",
  },
  button: {
    background: "#1a73e8",
    border: "none",
    borderRadius: 4,
    color: "#fff",
    cursor: "pointer",
    fontFamily: "inherit",
    fontSize: 14,
    fontWeight: 500,
    padding: "8px 24px",
  },
  details: {
    color: "#5f6368",
    fontSize: 12,
    marginTop: 16,
  },
  summary: {
    cursor: "pointer",
  },
  pre: {
    background: "#f8f9fa",
    border: "1px solid #e8eaed",
    borderRadius: 4,
    fontSize: 11,
    margin: "8px 0 0",
    maxHeight: 260,
    overflow: "auto",
    padding: 8,
    whiteSpace: "pre-wrap",
  },
};

/**
 * Tries to find one human readable line in the error, no matter how the implementation shaped it.
 * Looks for typical fields on few levels: error.message, error.error.e.message, error.error.mode ...
 */
function errorSummary(error: any): string {
  if (typeof error === "string") {
    return error;
  }

  const inner = error?.error ?? error;

  const cause = inner?.e ?? inner;

  const message = cause?.message || cause?.code || inner?.message;

  const parts = [inner?.mode, message].filter((part) => typeof part === "string" && part.trim() !== "");

  if (parts.length > 0) {
    return parts.join(": ");
  }

  return "unknown error";
}

export default function CustomStateGate({ ready, error, signIn }: CustomStateGateProps) {
  const hasError = Boolean(error);

  let title = "Signing in...";

  let text =
    "Waiting for authentication. If the window with login didn't show up (browsers often block it when it is not opened by a click) use the button below.";

  if (hasError) {
    title = ready ? "Storage error" : "Sign in failed";

    text = "Last attempt didn't succeed. You can try to sign in again.";
  }

  return (
    <div style={styles.wrap} data-testid="custom-state-gate">
      <div style={styles.card}>
        <h2 style={styles.title}>{title}</h2>
        <p style={styles.text}>{text}</p>
        {hasError && (
          <div style={styles.error} data-testid="custom-state-gate-error">
            {errorSummary(error)}
          </div>
        )}
        <button type="button" style={styles.button} onClick={() => signIn()} data-testid="custom-state-gate-signin">
          Sign in
        </button>
        {hasError && (
          <details style={styles.details} data-testid="custom-state-gate-details">
            <summary style={styles.summary}>technical details</summary>
            <pre style={styles.pre}>{JSON.stringify(error, null, 4)}</pre>
          </details>
        )}
      </div>
    </div>
  );
}
