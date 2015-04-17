import React, { useEffect, useState } from "react";

import { createRoot } from "react-dom/client";

const container = document.getElementById("root");

const root = createRoot(container);

root.render(<App />);

function setFocus() {
  const [focus, setFocus] = useState(document.visibilityState === "visible");

  useEffect(() => {
    function on() {
      setTimeout(() => {
        if (!document.hidden) {
          setFocus(true);
        }
      }, 100);
    }
    function off() {
      setTimeout(() => {
        setFocus(false);
      }, 100);
    }

    window.addEventListener("focus", on);
    window.addEventListener("blur", off);

    return () => {
      window.removeEventListener("focus", on);
      window.removeEventListener("blur", off);
    };
  }, []);

  return focus;
}

function App() {
  const focus = setFocus();

  if (focus) {
    localStorage.setItem("sound-experiment", 830.61);

    return <div>focused</div>;
  }

  localStorage.setItem("sound-experiment", 415.3);

  return <div>not focused</div>;
}
