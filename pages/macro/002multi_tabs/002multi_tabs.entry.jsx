import React, { useEffect, useState } from "react";

import { render } from "react-dom";

import classnames from "classnames";

import { set, get } from "nlab/lcstorage";

import Ace from "../Ace";

const Main = () => {
  const [tab, setTab] = useState("one");

  const [valOne, setValOneRaw] = useState(get("one", ""));

  const [valTwo, setValTwoRaw] = useState(get("two", ""));

  function setValOne(data) {
    set("one", data);

    setValOneRaw(data);
  }

  function setValTwo(data) {
    set("two", data);

    setValTwoRaw(data);
  }

  return (
    <>
      <div>
        <button
          onClick={() => {
            setValOne(valOne + "\nz");
          }}
        >
          a
        </button>{" "}
        <button
          onClick={() => {
            setValTwo(valTwo + "\nz");
          }}
        >
          b
        </button>
      </div>
      <div className="tabs">
        <div
          className={classnames({
            active: tab === "one",
          })}
          onClick={() => setTab("one")}
        >
          one
        </div>
        <div
          className={classnames({
            active: tab === "two",
          })}
          onClick={() => setTab("two")}
        >
          two
        </div>
      </div>
      <div className="editors">
        <div
          className={classnames({
            active: tab === "one",
          })}
        >
          <Ace content={valOne} onChange={(data) => setValOne(data)} />
        </div>
        <div
          className={classnames({
            active: tab === "two",
          })}
        >
          <Ace
            content={valTwo}
            onChange={(data) => {
              console.log("onChage two: ", data);
              setValTwo(data);
            }}
          />
        </div>
      </div>
    </>
  );
};

render(<Main />, document.getElementById("app"));
