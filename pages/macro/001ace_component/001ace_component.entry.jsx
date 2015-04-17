import React, { useEffect, useState } from "react";

import { render } from "react-dom";

import Ace from "../Ace";

const Main = () => {
  return <Ace />;
};

render(<Main />, document.getElementById("app"));
