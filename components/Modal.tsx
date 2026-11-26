/**
 * Modal Component
 *
 * Copy of .agents/skills/modal/assets/Modal.tsx (skill "modal") - keep it in sync with the skill,
 * together with Modal.css sitting next to this file. This is the only copy in the project - reuse it:
 *
 *   import Modal from "../../components/Modal.tsx";
 *
 * Don't render it inside element with class "gcp-css" - gcp-css would style the "x" close button.
 * Render it next to it and put className="gcp-css" on your own wrappers in body/footer
 * (example: pages/portsregistry/portsregistry.entry.jsx).
 *
 * Implements modal dialog functionality positioned in the center of the viewport
 * using standard native browser Popover API (popover="manual").
 *
 * Examples:
 *
 * ```tsx
 * <Modal
 *   open={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   width="500px"
 *   header="My Title"
 *   footer={<div><button onClick={() => setIsOpen(false)}>Close</button></div>}
 *   backdrop={true}
 * >
 *   <p>Modal content goes here</p>
 * </Modal>
 * ```
 */

import { useEffect, useRef, type ReactNode, type CSSProperties } from "react";
import "./Modal.css";

export type ModalProps = {
  /** Controls visibility of the modal */
  open?: boolean;
  /** Callback triggered when request to close modal occurs (e.g. Escape key or "X" button) */
  onClose?: () => void;
  /** Custom width for the modal (any valid CSS value) */
  width?: string | number;
  /** Header content: string text or custom ReactNode */
  header?: ReactNode;
  /** Footer content: any ReactNode (html, buttons, etc.) */
  footer?: ReactNode;
  /** Main body content */
  children?: ReactNode;
  /** Controls backdrop visibility (true by default) */
  backdrop?: boolean;
  /** Optional custom CSS class */
  className?: string;
  /** Optional data-id for testing */
  "data-id"?: string;
};

/**
 * Modal component leveraging the native HTML popover API.
 * Uses popover="manual" to prevent closing on outside clicks.
 * Dismisses on ESC key and features a reserved "X" close button in the header.
 */
export default function Modal({
  open = false,
  onClose,
  width,
  header,
  footer,
  children,
  backdrop = true,
  className,
  "data-id": dataId,
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  /**
   * Listen for Escape key to close the open modal
   */
  useEffect(() => {
    if (!open) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (onClose) {
          onClose();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  /**
   * Synchronize the native popover state with the open prop.
   * showPopover() / hidePopover() native methods are called on the element.
   */
  useEffect(() => {
    const el = modalRef.current;
    if (!el) {
      return;
    }

    if (open) {
      try {
        if (el.popover !== undefined) {
          el.showPopover();
        }
      } catch (err) {
        // Fallback or ignore if unsupported in older environments
        console.error("Error showing modal:", err);
      }
    } else {
      try {
        if (el.popover !== undefined) {
          el.hidePopover();
        }
      } catch (err) {
        console.error("Error hiding modal:", err);
      }
    }
  }, [open]);

  if (!open) {
    return null;
  }

  const dialogStyle: CSSProperties = {};
  if (width !== undefined) {
    dialogStyle.width = typeof width === "number" ? `${width}px` : width;
  }

  const rootClassNames = ["modal-root"];
  if (!backdrop) {
    rootClassNames.push("no-backdrop");
  }
  if (className) {
    rootClassNames.push(className);
  }

  return (
    <div ref={modalRef} popover="manual" className={rootClassNames.join(" ")} data-id={dataId || "modal"}>
      <div className="modal-backdrop-overlay" data-id="modal-backdrop" />
      <div className="modal-dialog" style={dialogStyle} data-id="modal-dialog">
        {header !== undefined && header !== null && (
          <div className="modal-header" data-id="modal-header">
            <div className="modal-header-content" data-id="modal-header-content">
              {header}
            </div>
            <button type="button" className="modal-close-btn" aria-label="Close" onClick={onClose}>
              &times;
            </button>
          </div>
        )}
        <div className="modal-body" data-id="modal-body">
          {children}
        </div>
        {footer !== undefined && footer !== null && (
          <div className="modal-footer" data-id="modal-footer">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
