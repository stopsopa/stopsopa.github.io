import React, { useState } from "react";
import { render } from "react-dom";

/**
 * To use:
 * yarn add react-popper @popperjs/core
 * https://popper.js.org/react-popper/v2/
 */

import { usePopper } from "react-popper";

import "./popper.css";

/**
 * Basic hook to just bind
 */
function useTooltip(generateOptions) {
  const [referenceElement, setReferenceElement] = useState(null);
  const [popperElement, setPopperElement] = useState(null);
  const [arrowElement, setArrowElement] = useState(null);
  const { styles, attributes } = usePopper(referenceElement, popperElement, generateOptions(arrowElement));
  return { setReferenceElement, setPopperElement, setArrowElement, attributes, styles };
}
/**
 * Extended hook for hover
 */
function useTooltipOnHover(generateOptions, defautShow = false) {
  const props = useTooltip(generateOptions);

  const [show, setShow] = useState(defautShow);

  return {
    ...props,
    show,
    events: {
      onMouseEnter: () => setShow(true),
      onMouseLeave: () => setShow(false),
    },
  };
}
/**
 * Extended hook for toggle click
 */
function useTooltipOnToggleClick(generateOptions, defautShow = false) {
  const props = useTooltip(generateOptions);

  const [show, setShow] = useState(defautShow);

  return {
    ...props,
    show,
    events: {
      onClick: () => setShow((show) => !show),
    },
  };
}

const AlwaysShow = () => {
  const tooltip = useTooltip((arrowElement) => ({
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
      <button type="button" ref={tooltip.setReferenceElement}>
        Fixed popper target
      </button>

      <div
        ref={tooltip.setPopperElement}
        style={tooltip.styles.popper}
        className="tooltipstyle show"
        {...tooltip.attributes.popper}
      >
        Fixed popper
        <div ref={tooltip.setArrowElement} style={tooltip.styles.arrow} className="arrow" data-popper-arrow />
      </div>
    </>
  );
};

const OnHover = () => {
  const tooltip = useTooltipOnHover((arrowElement) => ({
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
      <button type="button" ref={tooltip.setReferenceElement} {...tooltip.events}>
        On hover target
      </button>

      {tooltip.show && (
        <div
          ref={tooltip.setPopperElement}
          style={tooltip.styles.popper}
          className="tooltipstyle show"
          {...tooltip.attributes.popper}
        >
          On hover
          <div ref={tooltip.setArrowElement} style={tooltip.styles.arrow} className="arrow" data-popper-arrow />
        </div>
      )}
    </>
  );
};

const OnToggleClick = () => {
  const tooltip = useTooltipOnToggleClick((arrowElement) => ({
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
      <button type="button" ref={tooltip.setReferenceElement} {...tooltip.events}>
        On hover target
      </button>

      {tooltip.show && (
        <div
          ref={tooltip.setPopperElement}
          style={tooltip.styles.popper}
          className="tooltipstyle show"
          {...tooltip.attributes.popper}
        >
          On hover
          <div ref={tooltip.setArrowElement} style={tooltip.styles.arrow} className="arrow" data-popper-arrow />
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
          <OnToggleClick />
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
