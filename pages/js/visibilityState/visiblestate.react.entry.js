import React, { useEffect, useState } from "react";

import { createRoot } from "react-dom/client";

const container = document.getElementById("root");

const root = createRoot(container);

root.render(<App />);

const log = console.log;

function useFocus() {
  const [focus, setFocus] = useState(document.visibilityState === "visible");

  useEffect(() => {
    const handleVisibilityChange = () => {
      // setTimeout(() => {
        if (document.visibilityState === "visible") {
          log("visible");
          setFocus(true);
        } else {
          log("not visible");

          setFocus(false);
        }
      // }, 1000);
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  return focus;
}

function App() {
  const focus = useFocus();

  if (focus) {
    localStorage.setItem("sound-experiment", 830.61);

    return <div>focused</div>;
  }

  localStorage.setItem("sound-experiment", 415.3);

  return <div>blured</div>;
}
