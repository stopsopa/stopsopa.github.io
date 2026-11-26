/**
 * "Saved links" card of pages/services/maps_apple_to_google/matg.html.
 *
 * The page itself is plain html + inline module script (flat mode). Storing data needs useCustomState
 * (React hook, pages/useCustomState.ts), so only this one card is a small React island mounted into #matg-saved.
 *
 * What is stored: only Apple Maps links (Google link is derived from it by convert.ts every time),
 * as a list under key "links" in section "maps_apple_to_google". Rendered from newest to oldest.
 *
 * How it works:
 * 1. nothing happens until the user clicks "show saved links" - the hook starts authentication (login window)
 *    when mounted and the converter itself has to stay usable without signing in.
 *    The choice is remembered in localStorage, so next time the list shows up right away.
 * 2. "save link" stores the Apple link which is currently in the input of the page - only on click, never automatically.
 *    Together with custom label from the "Label" field (empty = name of the place from the link is shown instead).
 *    Label can be changed later with "edit" next to each saved link.
 * 3. click on saved link loads it back into the converter
 * 4. "delete" asks for confirmation in Modal (components/Modal.tsx, modal skill)
 *
 * Bridge to the inline script of matg.html: window.matg = { getAppleLink(), setInput(value) } (defined there).
 */
import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import useCustomState from "../../useCustomState";
import CustomStateGate from "../../CustomStateGate";
import Modal from "../../../components/Modal";

// unique for this service - root of the tree in the storage
const section = "maps_apple_to_google";

const LS_ENABLED = "matg_saved_enabled";

interface SavedLink {
  apple: string;
  // custom name given by the user, optional (records saved before labels existed don't have it)
  label?: string;
  // ISO date, list is sorted by it
  created_at: string;
}

/**
 * Type of the whole tree stored in section "maps_apple_to_google"
 */
interface MatgState {
  links?: Record<string, SavedLink>;
}

declare global {
  interface Window {
    matg?: {
      // Apple Maps link currently in the input of the page, empty string when there is none
      getAppleLink: () => string;
      // puts the value into the input of the page and runs the conversion
      setInput: (value: string) => void;
    };
  }
}

const storage = {
  get(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set(key: string, value: string) {
    try {
      localStorage.setItem(key, value);
    } catch {}
  },
};

/**
 * Human readable name of the place from the Apple link (name / q / address param), empty string when none
 */
function placeName(apple: string): string {
  try {
    const params = new URL(apple).searchParams;

    return params.get("name") || params.get("q") || params.get("address") || params.get("daddr") || "";
  } catch {
    return "";
  }
}

// what to show as the name of saved link: custom label, then name of the place from the link
function displayName(item: SavedLink): string {
  return item.label || placeName(item.apple) || "(no name)";
}

/**
 * The part which uses the storage. Mounting it starts the authentication.
 */
const Saved = () => {
  const { ready, error, signIn, get, set, push, del } = useCustomState<MatgState>({
    section,
  });

  const [links, setLinks] = useState<Record<string, SavedLink> | null>(null);

  const [message, setMessage] = useState("");

  // label for the link which is about to be saved
  const [label, setLabel] = useState("");

  // null or { key, label } of the saved link which label is edited inline
  const [editing, setEditing] = useState<{ key: string; label: string } | null>(null);

  // null or the item waiting for confirmation in the delete modal
  const [deleting, setDeleting] = useState<(SavedLink & { key: string }) | null>(null);

  const refresh = async () => {
    setLinks((await get("links")) || {});
  };

  // Ready gate: touch the data only when the storage says it is ready
  useEffect(() => {
    if (ready) {
      refresh();
    }
  }, [ready]);

  if (error || !ready) {
    return <CustomStateGate ready={ready} error={error} signIn={signIn} />;
  }

  if (links === null) {
    return <p>Loading saved links...</p>;
  }

  // from newest to oldest
  const list = Object.entries(links)
    .map(([key, value]) => ({ key, ...value }))
    .sort((a, b) => {
      if (a.created_at === b.created_at) {
        return 0;
      }

      return a.created_at > b.created_at ? -1 : 1;
    });

  const save = async () => {
    const apple = window.matg?.getAppleLink() || "";

    if (apple === "") {
      setMessage("nothing to save - paste Apple Maps link first");

      return;
    }

    if (list.find((item) => item.apple === apple)) {
      setMessage("this link is already saved");

      return;
    }

    await push({
      key: "links",
      data: {
        apple,
        label: label.trim(),
        created_at: new Date().toISOString(),
      },
    });

    setLabel("");

    setMessage("saved");

    await refresh();
  };

  // stores changed label of already saved link
  const saveLabel = async () => {
    const item = editing && links[editing.key];

    if (editing && item) {
      await set({
        key: ["links", editing.key],
        data: {
          ...item,
          label: editing.label.trim(),
        },
      });

      setEditing(null);

      setMessage("label changed");

      await refresh();
    }
  };

  const confirmDelete = async () => {
    if (deleting) {
      await del(["links", deleting.key]);

      setDeleting(null);

      setMessage("deleted");

      await refresh();
    }
  };

  return (
    <>
      {/* gcp-css: control first, label directly after it, placeholder must not be empty */}
      <form
        className="row"
        onSubmit={(e) => {
          e.preventDefault();

          save();
        }}
        data-testid="saved-form"
      >
        <div className="input-wrapper">
          <input
            type="text"
            id="saved-label"
            placeholder=" "
            autoComplete="off"
            aria-describedby="saved-label-helper"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            data-testid="saved-label"
          />
          <label htmlFor="saved-label">Label</label>
          <div className="helper-text" id="saved-label-helper">
            optional name for the link above, can be changed later
          </div>
        </div>
        <button type="submit" data-testid="saved-save">
          save link
        </button>
      </form>
      <div className="saved-message" data-testid="saved-message">
        {message}
      </div>

      {list.length === 0 && <p data-testid="saved-empty">no saved links yet</p>}

      <ul className="saved-list" data-testid="saved-list">
        {list.map((item) =>
          editing && editing.key === item.key ? (
            <li key={item.key} data-testid={`saved-item-edit-${item.key}`}>
              <form
                className="row saved-main"
                onSubmit={(e) => {
                  e.preventDefault();

                  saveLabel();
                }}
              >
                <div className="input-wrapper">
                  <input
                    type="text"
                    id="saved-edit-label"
                    placeholder=" "
                    autoComplete="off"
                    autoFocus
                    value={editing.label}
                    onChange={(e) => setEditing({ ...editing, label: e.target.value })}
                    data-testid="saved-edit-label"
                  />
                  <label htmlFor="saved-edit-label">Label</label>
                </div>
                <button type="submit" data-testid="saved-edit-save">
                  save
                </button>
                <button
                  type="button"
                  className="secondary"
                  onClick={() => setEditing(null)}
                  data-testid="saved-edit-cancel"
                >
                  cancel
                </button>
              </form>
            </li>
          ) : (
            <li key={item.key} data-testid={`saved-item-${item.key}`}>
              <div className="saved-main">
                <span className="saved-name">{displayName(item)}</span>
                <span className="saved-date" title={item.created_at}>
                  {item.created_at.substring(0, 10)}
                </span>
                <button
                  type="button"
                  className="secondary saved-link"
                  title="Load into the converter"
                  onClick={() => window.matg?.setInput(item.apple)}
                  data-testid={`saved-load-${item.key}`}
                >
                  {item.apple}
                </button>
              </div>
              <button
                type="button"
                className="secondary"
                onClick={() => setEditing({ key: item.key, label: item.label || "" })}
                data-testid={`saved-edit-${item.key}`}
              >
                edit
              </button>
              <button
                type="button"
                className="secondary"
                onClick={() => setDeleting(item)}
                data-testid={`saved-delete-${item.key}`}
              >
                delete
              </button>
            </li>
          )
        )}
      </ul>

      {/*
        The island lives inside .gcp-css (#matg-left). "no-gcp-css" keeps gcp-css away from the modal
        (its "x" close button), "gcp-css" on the footer switches it on again for our buttons.
      */}
      <Modal
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        width="480px"
        header="Delete saved link?"
        className="no-gcp-css"
        data-id="modal-delete"
        footer={
          <div className="gcp-css saved-modal-footer">
            <button
              type="button"
              className="secondary"
              onClick={() => setDeleting(null)}
              data-testid="saved-delete-cancel"
            >
              cancel
            </button>
            <button type="button" className="saved-danger" onClick={confirmDelete} data-testid="saved-delete-confirm">
              delete
            </button>
          </div>
        }
      >
        <div className="saved-modal-body">
          <strong>{deleting ? displayName(deleting) : ""}</strong>
          <div>{deleting?.apple}</div>
        </div>
      </Modal>
    </>
  );
};

const Main = () => {
  const [enabled, setEnabled] = useState(storage.get(LS_ENABLED) === "1");

  return (
    <>
      <h2>Saved links</h2>
      {enabled ? (
        <Saved />
      ) : (
        <>
          <p>Apple Maps links can be saved to your account. It requires signing in.</p>
          <button
            type="button"
            className="secondary"
            onClick={() => {
              storage.set(LS_ENABLED, "1");

              setEnabled(true);
            }}
            data-testid="saved-enable"
          >
            show saved links (sign in)
          </button>
        </>
      )}
    </>
  );
};

const container = document.getElementById("matg-saved");

if (container) {
  createRoot(container).render(<Main />);
}
