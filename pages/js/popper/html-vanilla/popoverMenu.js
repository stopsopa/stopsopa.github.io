const th = (msg) => new Error(`popoverMenu error: ${msg}`);

export default function popoverMenu(opt) {
  const {
    burger,
    menu,
    closeEntireTreeFormationOnClick = (element) => {
      return element.matches("a");
    },
  } = opt;

  if (typeof closeEntireTreeFormationOnClick !== "function") {
    throw th("closeEntireTreeFormationOnClick must be a function");
  }

  // Close menu when any link is clicked
  document.addEventListener("click", (e) => {
    const element = e.target;

    if (!closeEntireTreeFormationOnClick(element)) {
      return;
    }
    const id = menu.getAttribute("id");
    if (typeof id !== "string" || id.trim().length === 0) {
      return;
    }

    const popover = document.getElementById(id);
    if (!popover) {
      return;
    }

    if (popover.matches(":popover-open")) {
      popover.hidePopover();
    }
  });

  // Handle popovertarget on non-button elements
  document.addEventListener("click", (e) => {
    const trigger = e.target.closest("[popovertarget]");
    if (trigger && trigger.tagName !== "BUTTON" && trigger.tagName !== "INPUT") {
      const popoverId = trigger.getAttribute("popovertarget");
      const popover = document.getElementById(popoverId);
      if (popover) {
        // Set dynamic anchor relationship
        const anchorName = `--anchor-${popoverId}`;
        trigger.style.anchorName = anchorName;
        popover.style.positionAnchor = anchorName;

        const action = trigger.getAttribute("popovertargetaction") || "toggle";
        if (action === "show") {
          popover.showPopover();
        } else if (action === "hide") {
          popover.hidePopover();
        } else {
          popover.togglePopover();
        }
      }
    }
  });
}
