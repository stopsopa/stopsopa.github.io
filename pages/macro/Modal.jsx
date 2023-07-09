import React, { useEffect } from "react";

import "./Modal.scss";

export default function Modal({ children, title, onClose }) {
  useEffect(() => {
    const event = (evt) => {
      if (evt.key === "Escape") {
        onClose();
      }
    };
    document.addEventListener("keydown", event);

    return () => document.removeEventListener("keydown", event);
  }, []);
  return (
    <div className="custom-modal">
      <div>
        <div class="header">
          {title}
          <div class="close" onClick={onClose}>
            x
          </div>
        </div>
        <div className="wrap">
          <div className="center">
            <div>{children}</div>
          </div>
          <div className="footer"></div>
        </div>
      </div>
    </div>
  );
}
