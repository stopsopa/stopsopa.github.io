---
name: modal
description: Provides progressive examples for creating modal dialogs using the modern native browser Popover API
license: GPL-2.0-only
metadata:
  author: stopsopa
  version: "1.0"
  website: https://github.com/stopsopa/skill-modal
---

<about>

This skill demonstrates how to create progressively complex modal dialogs using the modern native browser Popover API. It builds upon the concepts from the [popover-api skill](../popover-api/SKILL.md) but focuses specifically on modal implementations.

All examples follow the principle of using `popover="manual"` to maintain full control over when modals open and close, preventing automatic dismissal when clicking outside the modal.

</about>

<examples>

## Basic Modal

Start with a minimal modal implementation:

```tsx
import { useState } from "react";
import Modal from "../components/Modal";

export default function BasicModalExample() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div>
      <button onClick={() => setIsOpen(true)}>Open Basic Modal</button>

      <Modal
        open={isOpen}
        onClose={() => setIsOpen(false)}
        header="Basic Modal"
        footer={<button onClick={() => setIsOpen(false)}>Close</button>}
      >
        <p>This is a basic modal with minimal configuration.</p>
      </Modal>
    </div>
  );
}
```

This example shows:

- A simple toggle mechanism with useState
- Basic header and footer implementation
- Proper cleanup with onClose handler

## Custom Width Modal

Specify a custom width for your modal:

```tsx
import { useState } from "react";
import Modal from "../components/Modal";

export default function CustomWidthModal() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div>
      <button onClick={() => setIsOpen(true)}>Open Custom Width Modal</button>

      <Modal
        open={isOpen}
        onClose={() => setIsOpen(false)}
        width="600px" // Or use percentage like "90%"
        header="Custom Width Modal"
        footer={
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button onClick={() => setIsOpen(false)}>Close</button>
          </div>
        }
      >
        <p>This modal has a custom width of 600px.</p>
      </Modal>
    </div>
  );
}
```

Key additions:

- `width` prop to control modal dimensions
- Styled footer with right-aligned close button

## Scrollable Content Modal

Handle overflow content with automatic scrollbars:

```tsx
import { useState } from "react";
import Modal from "../components/Modal";

export default function ScrollableModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [content, setContent] = useState(["Item 1", "Item 2"]);

  const addContent = () => {
    setContent((prev) => [...prev, `Item ${prev.length + 1}`]);
  };

  return (
    <div>
      <button onClick={() => setIsOpen(true)}>Open Scrollable Modal</button>

      <Modal
        open={isOpen}
        onClose={() => setIsOpen(false)}
        width="500px"
        header="Scrollable Content Modal"
        footer={
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span>{content.length} items</span>
            <div>
              <button onClick={addContent} style={{ marginRight: "8px" }}>
                Add Item
              </button>
              <button onClick={() => setIsOpen(false)}>Close</button>
            </div>
          </div>
        }
      >
        <div>
          <button onClick={addContent} style={{ marginBottom: "12px" }}>
            Add More Items
          </button>
          <div>
            {content.map((item, index) => (
              <div
                key={index}
                style={{
                  padding: "8px",
                  borderBottom: "1px solid #eee",
                }}
              >
                {item}
              </div>
            ))}
          </div>
        </div>
      </Modal>
    </div>
  );
}
```

Features demonstrated:

- Dynamic content that grows beyond modal boundaries
- Automatic scrollbar activation
- Status indicator in footer
- Multiple action buttons

## No Backdrop Modal

Create a modal without the semi-transparent overlay:

```tsx
import { useState } from "react";
import Modal from "../components/Modal";

export default function NoBackdropModal() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div>
      <button onClick={() => setIsOpen(true)}>Open No-Backdrop Modal</button>

      <Modal
        open={isOpen}
        onClose={() => setIsOpen(false)}
        backdrop={false} // Disable backdrop
        width="450px"
        header="No Backdrop Modal"
        footer={
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button onClick={() => setIsOpen(false)}>Close</button>
          </div>
        }
      >
        <p>This modal appears without the semi-transparent backdrop.</p>
        <p>Clicking outside the modal will NOT close it because we're using popover="manual".</p>
      </Modal>
    </div>
  );
}
```

Important notes:

- `backdrop={false}` removes the overlay
- Still uses `popover="manual"` so clicking outside won't close it
- User must explicitly click the close button

## Complex Header Modal

Implement a rich header with icons and custom styling:

```tsx
import { useState } from "react";
import Modal from "../components/Modal";

export default function ComplexHeaderModal() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div>
      <button onClick={() => setIsOpen(true)}>Open Complex Header Modal</button>

      <Modal
        open={isOpen}
        onClose={() => setIsOpen(false)}
        width="550px"
        header={
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <span style={{ fontSize: "1.5rem" }}>⚠️</span>
            <div>
              <div style={{ fontWeight: "bold" }}>Warning</div>
              <div style={{ fontSize: "0.85rem", opacity: 0.8 }}>Please review before proceeding</div>
            </div>
          </div>
        }
        footer={
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div style={{ fontSize: "0.85rem", opacity: 0.7 }}>Action required</div>
            <div>
              <button
                style={{
                  backgroundColor: "#dc3545",
                  color: "white",
                  marginRight: "8px",
                }}
                onClick={() => setIsOpen(false)}
              >
                Cancel
              </button>
              <button
                style={{
                  backgroundColor: "#28a745",
                  color: "white",
                }}
                onClick={() => setIsOpen(false)}
              >
                Confirm
              </button>
            </div>
          </div>
        }
      >
        <p>Are you sure you want to proceed with this action?</p>
        <p>This operation cannot be undone.</p>
      </Modal>
    </div>
  );
}
```

Advanced features:

- Custom JSX in header with icon and subtext
- Multi-line footer with status text and styled buttons
- Semantic button styling for actions

## Progressive Enhancement Summary

Each example builds upon the previous ones:

1. **Basic Modal** - Core functionality with open/close state management
2. **Custom Width** - Visual customization with width control
3. **Scrollable Content** - Handling dynamic/overflow content
4. **No Backdrop** - Behavioral customization with backdrop control
5. **Complex Header** - Advanced UI with custom header/footer elements

All examples utilize the native browser Popover API through our React component wrapper, ensuring accessibility and modern browser support while providing a clean developer experience.

</examples>

<related-skills>

This skill complements the [popover-api skill](../popover-api/SKILL.md) which provides foundational knowledge about the native Popover API. The modal skill focuses specifically on modal dialog patterns built with this API.

</related-skills>
