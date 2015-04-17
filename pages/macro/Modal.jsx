import React, { useEffect, useState } from "react";

import "./Modal.scss";

export default function Modal({ children, title, onClose }) {
  //   const [count, setCount] = useState(1);

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
            {children}

            {/* <button onClick={(_) => setCount((c) => c + 1)}>add</button>
            {(function () {
              const list = [];
              for (let i = 0; i < count; i += 1) {
                list.push(<p key={i}>abc</p>);
              }
              return list;
            })()} */}
          </div>
          <div className="footer"></div>
        </div>
      </div>
    </div>
  );
}
