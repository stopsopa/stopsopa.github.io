import React, { useEffect, useState } from "react";

import { render } from "react-dom";

import log from "inspc";

const se = require("nlab/se");

const Main = () => {
  const [check, setCheck] = useState(false);

  return (
    <table width="80%">
      <tbody>
        <tr>
          <td width="50%">
            <label>
              <input type="checkbox" />
              foo foo foo foo foo foo
            </label>

            <br />

            <label>
              <input type="checkbox" />
              foo foo foo foo foo foo
            </label>

            <br />

            <label>
              <NoInput checked={check === "foo"} onChange={() => setCheck("foo")} />
              foo foo foo foo foo foo
            </label>

            <br />

            <label>
              <NoInput checked={check === "bar"} onChange={() => setCheck("bar")} />
              bar bar bar bar bar bar
            </label>

            <br />

            <label>
              <input type="checkbox" />
              foo foo foo foo foo foo
            </label>

            <br />

            <label>
              <input type="checkbox" />
              foo foo foo foo foo foo
            </label>
          </td>
          <td>
            <label>
              <input type="radio" />
              foo foo foo foo foo foo
            </label>

            <br />

            <label>
              <input type="radio" />
              foo foo foo foo foo foo
            </label>

            <br />

            <label>
              <NoInput checked={check === "foo"} onChange={() => setCheck("foo")} radio />
              foo foo foo foo foo foo
            </label>

            <br />

            <label>
              <NoInput checked={check === "bar"} onChange={() => setCheck("bar")} radio />
              bar bar bar bar bar bar
            </label>

            <br />

            <label>
              <input type="radio" />
              foo foo foo foo foo foo
            </label>

            <br />

            <NoInput checked={check === "foo"} onChange={() => setCheck("foo")} radio>
              foo foo foo foo foo foo
            </NoInput>

            <br />

            <NoInput checked={check === "bar"} onChange={() => setCheck("bar")} radio>
              bar bar bar bar bar bar
            </NoInput>

            <br />

            <label>
              <input type="radio" />
              foo foo foo foo foo foo
            </label>

            <br />

            <NoInput checked={check === "foo"} onChange={() => setCheck("foo")} radio before>
              foo foo foo foo foo foo
            </NoInput>

            <br />

            <NoInput checked={check === "bar"} onChange={() => setCheck("bar")} radio before>
              bar bar bar bar bar bar
            </NoInput>

            <br />

            <label>
              <input type="radio" />
              foo foo foo foo foo foo
            </label>
          </td>
        </tr>
      </tbody>
    </table>
  );
};

render(<Main />, document.getElementById("app"));

function NoInput({ checked, onChange, className, children, before, props1, props2, props3, propslabel, radio }) {
  const cls = ["noinput-checkbox"];

  if (checked) {
    cls.push("checked");
  }

  if (typeof className === "string") {
    cls.push(className);
  }

  if (radio) {
    cls.push("radio");
  }

  const hasChildren = typeof children !== "undefined";

  const component = (
    <div className={cls.join(" ")} {...props1}>
      <div tabIndex="0" onClick={hasChildren ? undefined : onChange} onKeyDown={onChange} {...props2}>
        <div {...props3}></div>
      </div>
    </div>
  );

  if (hasChildren) {
    if (before) {
      return (
        <label onClick={onChange} {...propslabel}>
          {children}
          {component}
        </label>
      );
    }

    return (
      <label onClick={onChange} {...propslabel}>
        {component}
        {children}
      </label>
    );
  }

  return component;
}
