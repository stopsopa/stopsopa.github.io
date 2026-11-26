/**
 * Ports registry - personal database of ports used across different projects, each with a comment.
 *
 * How it works:
 * 1. top card "New port": on load suggests next free port (generatePort.js), status chip shows if the port
 *    in the field is really free. "next" suggests another free port, higher than the current one.
 * 2. list: date, port and full comment of every record (newest first), with filter, edit (inline) and
 *    delete (confirmation in Modal).
 *
 * Port is "free" when it is not in lists/ports-generated.json (well known ports) and not registered here already.
 *
 * Styling: /css/gcp-css.css (class gcp-css, see gcp-css skill) + portsregistry.entry.css for layout.
 */
import React, { useEffect, useState } from "react";

import { render } from "react-dom";

import useCustomState from "../useCustomState";

import Modal from "../../components/Modal.tsx";

import "./portsregistry.entry.css";

const section = "portsregistry";

/**
 * Type of the whole tree stored in section "portsregistry" (S of useCustomState<S>, see pages/useCustomState.ts)
 * @typedef {{ port: string, description: string, created_at: string, updated_at?: string }} PortEntry
 * @typedef {{ ports?: Record<string, PortEntry> }} PortsRegistryState
 */

import generatePort from "./generatePort.js";

const reservedPorts = require("./lists/ports-generated.json");

let generate = generatePort();

generate.addList(reservedPorts);

window.generate = generate;

/**
 * Generator has no method to remove a port, so after every change of the registered ports (add/edit/delete)
 * it is just built again: well known ports + ports registered here.
 */
const rebuildGenerator = (ports) => {
  generate = generatePort();

  generate.addList(reservedPorts);

  generate.addList(
    Object.values(ports || {})
      .map((value) => value.port)
      .filter(Boolean)
  );

  window.generate = generate;
};

const now = () => new Date().toISOString().substring(0, 19).replace("T", " ");

/**
 * Field with port: input with floating label + status chip (free / taken / invalid) + optional "next" button.
 * Used for new record and for editing existing one.
 */
const PortField = ({ id, value, status, onChange, onNext }) => {
  const invalid = status.state === "taken" || status.state === "invalid";

  return (
    <div className="pr-port-row">
      <div className="input-wrapper" data-error={invalid ? "" : undefined}>
        <input
          type="text"
          inputMode="numeric"
          id={id}
          placeholder=" "
          autoComplete="off"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={invalid ? "true" : undefined}
          aria-describedby={invalid ? `${id}-error` : undefined}
          data-testid={id}
        />
        <label htmlFor={id}>Port *</label>
        <div className="error" id={`${id}-error`}>
          {status.message}
        </div>
      </div>
      <span className={`pr-chip pr-chip-${status.state}`} data-testid={`${id}-status`}>
        {status.label}
      </span>
      {onNext && (
        <button type="button" className="secondary" onClick={onNext} data-testid={`${id}-next`}>
          next
        </button>
      )}
    </div>
  );
};

const Main = () => {
  const [ports, setPortsList] = useState(false);

  const [port, setPort] = useState(String(generate()));

  const [description, setDescription] = useState("");

  const [filter, setFilter] = useState("");

  // null or { key, port, description } of the record edited inline in the list
  const [editing, setEditing] = useState(null);

  // null or record (with key) waiting for confirmation in the delete modal
  const [deleting, setDeleting] = useState(null);

  /** @type {import("../useCustomState.ts").UseCustomStateReturn<PortsRegistryState>} */
  const { error, ready, set, get, del, push } = useCustomState({
    section,
  });

  const refreshPortsList = async function () {
    const list = (await get(`ports`)) || {};

    rebuildGenerator(list);

    if (ports === false) {
      // first load: initial suggestion was generated before we knew registered ports, so it might be taken
      setPort((current) => (generate.isFree(current) ? current : String(generate(parseInt(current, 10)))));
    }

    setPortsList(list);
  };

  useEffect(() => {
    if (ready) {
      refreshPortsList();
    }
  }, [ready]);

  if (error) {
    return (
      <pre>
        {JSON.stringify(
          {
            error,
          },
          null,
          4
        )}
      </pre>
    );
  }

  if (!ready) {
    return <div>Connecting to custom state...</div>;
  }

  if (ports === false) {
    return <div>Loading ports...</div>;
  }

  /**
   * Checks the port typed by the user.
   * own - port of the record which is edited, that one is allowed even though it is registered
   * Returns { state: "empty" | "invalid" | "taken" | "free", label (for chip), message (for error under field) }
   */
  const portStatus = (value, own) => {
    const trimmed = String(value || "").trim();

    if (trimmed === "") {
      return { state: "empty", label: "no port", message: "" };
    }

    const number = parseInt(trimmed, 10);

    if (!/^\d+$/.test(trimmed) || number < 1 || number > 65535) {
      return { state: "invalid", label: "✗ invalid", message: "port has to be a number 1 - 65535" };
    }

    if (trimmed === own) {
      return { state: "free", label: "✓ unchanged", message: "" };
    }

    if (Object.values(ports).find((o) => String(o.port) === trimmed)) {
      return { state: "taken", label: "✗ taken", message: `port ${trimmed} is already registered here` };
    }

    if (generate.isFree(trimmed)) {
      return { state: "free", label: "✓ free", message: "" };
    }

    return { state: "taken", label: "✗ taken", message: `port ${trimmed} is reserved (well known port)` };
  };

  // suggests next free port higher than the one in the field
  const next = () => {
    const current = /^\d+$/.test(port.trim()) ? generate(parseInt(port, 10) + 1) : generate();

    setPort(String(current));
  };

  const status = portStatus(port);

  const canAdd = status.state === "free" && description.trim() !== "";

  const add = async () => {
    if (canAdd) {
      await push({
        key: `ports`,
        data: {
          port: port.trim(),
          description: description.trim(),
          created_at: now(),
        },
      });

      setDescription("");

      await refreshPortsList();

      // refreshPortsList() rebuilt the generator, so just added port is not free anymore
      setPort(String(generate()));
    }
  };

  const editingStatus = editing ? portStatus(editing.port, ports[editing.key]?.port) : undefined;

  const canSave = Boolean(editing) && editingStatus.state === "free" && editing.description.trim() !== "";

  const save = async () => {
    if (canSave) {
      await set({
        key: ["ports", editing.key],
        data: {
          ...ports[editing.key],
          port: editing.port.trim(),
          description: editing.description.trim(),
          updated_at: now(),
        },
      });

      setEditing(null);

      await refreshPortsList();
    }
  };

  const confirmDelete = async () => {
    await del(`ports/${deleting.key}`);

    setDeleting(null);

    await refreshPortsList();
  };

  // newest first
  const all = Object.entries(ports)
    .map(([key, value]) => ({ key, ...value }))
    .sort((a, b) => {
      if (a.created_at === b.created_at) {
        return 0;
      }

      return a.created_at > b.created_at ? -1 : 1;
    });

  const needle = filter.trim().toLowerCase();

  const list = all.filter((g) => `${g.port} ${g.description} ${g.created_at}`.toLowerCase().includes(needle));

  return (
    <>
      <div className="pr-app gcp-css">
        <form
          className="pr-card"
          onSubmit={(e) => {
            e.preventDefault();

            add();
          }}
          data-testid="form-add"
        >
          <h2>New port</h2>
          <PortField id="pr-port" value={port} status={status} onChange={setPort} onNext={next} />
          <div className="input-wrapper">
            <textarea
              id="pr-description"
              placeholder=" "
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              data-testid="pr-description"
            />
            <label htmlFor="pr-description">Comment *</label>
          </div>
          <button type="submit" disabled={!canAdd} data-testid="button-add">
            add
          </button>
        </form>

        <div className="pr-card">
          <div className="pr-list-head">
            <h2>
              Registered ports ({list.length === all.length ? all.length : `${list.length} of ${all.length}`})
            </h2>
            <div className="input-wrapper">
              <input
                type="search"
                id="pr-filter"
                placeholder=" "
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                data-testid="pr-filter"
              />
              <label htmlFor="pr-filter">Filter (port, comment, date)</label>
            </div>
          </div>

          {list.length === 0 && <p data-testid="list-empty">nothing found</p>}

          {list.map((g) =>
            editing && editing.key === g.key ? (
              <form
                key={g.key}
                className="pr-item pr-item-edit"
                onSubmit={(e) => {
                  e.preventDefault();

                  save();
                }}
                data-testid={`item-edit-${g.key}`}
              >
                <PortField
                  id="pr-edit-port"
                  value={editing.port}
                  status={editingStatus}
                  onChange={(value) => setEditing({ ...editing, port: value })}
                />
                <div className="input-wrapper">
                  <textarea
                    id="pr-edit-description"
                    placeholder=" "
                    rows={4}
                    value={editing.description}
                    onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                    data-testid="pr-edit-description"
                  />
                  <label htmlFor="pr-edit-description">Comment *</label>
                </div>
                <div className="pr-actions">
                  <button type="submit" disabled={!canSave} data-testid="button-save">
                    save
                  </button>
                  <button
                    type="button"
                    className="secondary"
                    onClick={() => setEditing(null)}
                    data-testid="button-cancel-edit"
                  >
                    cancel
                  </button>
                </div>
              </form>
            ) : (
              <div key={g.key} className="pr-item" data-key={g.key} data-testid={`item-${g.key}`}>
                <div className="pr-meta">
                  <span className="pr-port">{g.port}</span>
                  <span
                    className="pr-date"
                    title={`created: ${g.created_at || "-"}${g.updated_at ? `\nupdated: ${g.updated_at}` : ""}`}
                  >
                    {String(g.created_at || "").substring(0, 10)}
                  </span>
                </div>
                <div className="pr-description">{g.description}</div>
                <div className="pr-actions">
                  <button
                    type="button"
                    className="secondary"
                    onClick={() =>
                      setEditing({ key: g.key, port: String(g.port || ""), description: g.description || "" })
                    }
                    data-testid={`button-edit-${g.key}`}
                  >
                    edit
                  </button>
                  <button
                    type="button"
                    className="secondary"
                    onClick={() => setDeleting(g)}
                    data-testid={`button-delete-${g.key}`}
                  >
                    delete
                  </button>
                </div>
              </div>
            )
          )}
        </div>
      </div>

      {/* outside of .gcp-css on purpose - see comment in components/Modal.tsx */}
      <Modal
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        width="480px"
        header={`Delete port ${deleting?.port}?`}
        data-id="modal-delete"
        footer={
          <div className="gcp-css pr-modal-footer">
            <button
              type="button"
              className="secondary"
              onClick={() => setDeleting(null)}
              data-testid="button-delete-cancel"
            >
              cancel
            </button>
            <button type="button" className="pr-danger" onClick={confirmDelete} data-testid="button-delete-confirm">
              delete
            </button>
          </div>
        }
      >
        <div className="pr-modal-body">
          <div className="pr-meta">
            <span className="pr-port">{deleting?.port}</span>
            <span className="pr-date">{deleting?.created_at}</span>
          </div>
          <div className="pr-description">{deleting?.description}</div>
        </div>
      </Modal>
    </>
  );
};

render(<Main />, document.getElementById("app"));
