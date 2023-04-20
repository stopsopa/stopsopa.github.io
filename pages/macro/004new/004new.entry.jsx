import React, { useEffect, useState, useMemo, useCallback } from "react";

import { render } from "react-dom";

import AceV2 from "../AceV2.jsx";

import "./004new.scss";

/**
 *  https://codesandbox.io/s/wuixn?file=/src/App.js:75-121
 */
const Main = () => {
  return <AceV2 id="test" />;
};

render(<Main />, document.getElementById("app"));
