import React, { useEffect, useState } from "react";

import { createRoot } from "react-dom/client";

const container = document.getElementById("root");

const root = createRoot(container);

root.render(<App />);

function useVisible() {
  const [visible, setVisible] = useState(document.visibilityState === "visible");

  useEffect(() => {
    const change = () => {
      // setTimeout(() => {
      if (document.visibilityState === "visible") {
        setVisible(true);
      } else {
        setVisible(false);
      }
      // }, 1000);
    };

    document.addEventListener("visibilitychange", change);

    return () => document.removeEventListener("visibilitychange", change);
  }, []);

  return visible;
}

function App() {
  const visible = useVisible();

  if (visible) {
    localStorage.setItem("sound-experiment", 830.61);

    return <div>visible</div>;
  }

  localStorage.setItem("sound-experiment", 415.3);

  return <div>not visible</div>;
}
