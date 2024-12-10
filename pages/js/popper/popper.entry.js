import React, { useState } from "react";
import { render } from "react-dom";

/**
 * To use:
 * yarn add react-popper @popperjs/core
 * https://popper.js.org/react-popper/v2/
 */

import { usePopper } from "react-popper";

import "./popper.css";

function useTooltip(generateOptions) {
  const [referenceElement, setReferenceElement] = useState(null);
  const [popperElement, setPopperElement] = useState(null);
  const [arrowElement, setArrowElement] = useState(null);
  const { styles, attributes } = usePopper(referenceElement, popperElement, generateOptions(arrowElement));
  return [setReferenceElement, setPopperElement, setArrowElement, attributes, styles];
}

function useTooltipOnHover(generateOptions, defautShow = false) {
  const props = useTooltip(generateOptions);

  const [show, setShow] = useState(defautShow);

  return [
    ...props,
    show,
    setShow,
    {
      onMouseEnter: () => setShow(true),
      onMouseLeave: () => setShow(false),
    },
  ];
}

const AlwaysShow = () => {
  const [setReferenceElement, setPopperElement, setArrowElement, attributes, styles] = useTooltip((arrowElement) => ({
    modifiers: [
      {
        name: "offset",
        options: {
          offset: [0, 8],
          element: arrowElement,
        },
      },
    ],
  }));

  return (
    <>
      <button type="button" ref={setReferenceElement}>
        Fixed popper target
      </button>

      <div
        ref={setPopperElement}
        style={styles.popper}
        className="tooltipstyle tooltip-toggle-click show"
        {...attributes.popper}
      >
        Fixed popper
        <div ref={setArrowElement} style={styles.arrow} className="arrow" data-popper-arrow />
      </div>
    </>
  );
};

const OnHover = () => {
  const [setReferenceElement, setPopperElement, setArrowElement, attributes, styles, show, setShow, events] =
    useTooltipOnHover((arrowElement) => ({
      modifiers: [
        {
          name: "offset",
          options: {
            offset: [0, 8],
            element: arrowElement,
          },
        },
      ],
    }));

  return (
    <>
      <button type="button" ref={setReferenceElement} {...events}>
        On hover target
      </button>

      {show && (
        <div
          ref={setPopperElement}
          style={styles.popper}
          className="tooltipstyle tooltip-toggle-click show"
          {...attributes.popper}
        >
          On hover
          <div ref={setArrowElement} style={styles.arrow} className="arrow" data-popper-arrow />
        </div>
      )}
    </>
  );
};

function Main() {
  const [length, setLength] = useState(1);

  return (
    <div className="example1">
      <button className="add" onClick={() => setLength((i) => i + 1)}>
        add element set {length}
      </button>
      {Array.from({ length }, (_, index) => index).map((_, i) => (
        <div key={i}>
          <AlwaysShow />
          <OnHover />
        </div>
      ))}
    </div>
  );
}

if (!Array.isArray(window.allLoaded)) {
  window.allLoaded = [];
}
window.allLoaded.push(async function () {
  render(<Main />, document.getElementById("app"));
});
