import React, { useState, useEffect, useRef } from "react";
import { render } from "react-dom";

/**
 * To use:
 * yarn add react-popper @popperjs/core
 * https://popper.js.org/react-popper/v2/
 */

import { usePopper } from "react-popper";

import "../for-popper.css";

/**
 * Basic hook to just bind
 */
function useTooltip(generateOptions) {
  const [referenceElement, setReferenceElement] = useState(null);
  const [popperElement, setPopperElement] = useState(null);
  const [arrowElement, setArrowElement] = useState(null);
  const { styles, attributes } = usePopper(referenceElement, popperElement, generateOptions(arrowElement));
  return {
    setReferenceElement,
    referenceElement,
    popperElement,
    setPopperElement,
    arrowElement,
    setArrowElement,
    attributes,
    styles,
  };
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

  //   props.popperElement

  const [show, setShow] = useState(defautShow);

  return {
    ...props,
    show,
    events: {
      onClick: () => setShow((show) => !show),
    },
  };
}
/**
 * Hide when click outside
 */
function useTooltipHideOnClickOutside(generateOptions, defautShow = false) {
  const props = useTooltip(generateOptions);

  const [show, setShow] = useState(defautShow);

  useEffect(() => {
    if (!props.popperElement) {
      return;
    }
    const handleClick = (event) => {
      if (!props.popperElement.contains(event.target)) {
        setShow(false);
      }
    };

    document.body.addEventListener("click", handleClick);

    return () => {
      document.body.removeEventListener("click", handleClick);
    };
  }, [props.popperElement]);

  return {
    ...props,
    show,
    events: {
      onClick: () => {
        if (!props.popperElement || !props.popperElement.classList.contains("show")) {
          setTimeout(() => {
            setShow(true);
          }, 50);
        }
      },
    },
  };
}

function useTooltipOnHoverDelayed(generateOptions, delay = 200, defautShow = false) {
  const props = useTooltip(generateOptions);

  const [show, setShow] = useState(defautShow);
  const timeoutRef = useRef(null);

  const handleMouseEnter = () => {
    timeoutRef.current = setTimeout(() => {
      setShow(true);
    }, delay);
  };

  const handleMouseLeave = () => {
    clearTimeout(timeoutRef.current);
    setShow(false);
  };

  return {
    ...props,
    show,
    events: {
      onMouseEnter: handleMouseEnter,
      onMouseLeave: handleMouseLeave,
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
        fixed popper
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
          on hover
          <div ref={tooltip.setArrowElement} style={tooltip.styles.arrow} className="arrow" data-popper-arrow />
        </div>
      )}
    </>
  );
};

const OnHoverDelayed = () => {
  const tooltip = useTooltipOnHoverDelayed(
    (arrowElement) => ({
      modifiers: [
        {
          name: "offset",
          options: {
            offset: [0, 8],
            element: arrowElement,
          },
        },
      ],
    }),
    1200
  );

  return (
    <>
      <button type="button" ref={tooltip.setReferenceElement} {...tooltip.events}>
        On hover target (delay)
      </button>

      {tooltip.show && (
        <div
          ref={tooltip.setPopperElement}
          style={tooltip.styles.popper}
          className="tooltipstyle show"
          {...tooltip.attributes.popper}
        >
          on hover delayed
          <div ref={tooltip.setArrowElement} style={tooltip.styles.arrow} className="arrow" data-popper-arrow />
        </div>
      )}
    </>
  );
};

const OnToggleClick = () => {
  const tooltip = useTooltipOnToggleClick(
    (arrowElement) => ({
      modifiers: [
        {
          name: "offset",
          options: {
            offset: [0, 8],
            element: arrowElement,
          },
        },
      ],
    }),
    true
  );

  return (
    <>
      <button type="button" ref={tooltip.setReferenceElement} {...tooltip.events}>
        Toggle click target
      </button>

      {tooltip.show && (
        <div
          ref={tooltip.setPopperElement}
          style={tooltip.styles.popper}
          className="tooltipstyle show"
          {...tooltip.attributes.popper}
        >
          on click
          <div ref={tooltip.setArrowElement} style={tooltip.styles.arrow} className="arrow" data-popper-arrow />
        </div>
      )}
    </>
  );
};

const HideOnClickOutside = () => {
  const tooltip = useTooltipHideOnClickOutside(
    (arrowElement) => ({
      modifiers: [
        {
          name: "offset",
          options: {
            offset: [0, 8],
            element: arrowElement,
          },
        },
      ],
    }),
    true
  );

  return (
    <>
      <button type="button" ref={tooltip.setReferenceElement} {...tooltip.events}>
        Hide on click outside
      </button>

      {tooltip.show && (
        <div
          ref={tooltip.setPopperElement}
          style={tooltip.styles.popper}
          className="tooltipstyle show"
          {...tooltip.attributes.popper}
        >
          <button onClick={() => alert("action")}>action</button> click me
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
          <OnHoverDelayed />
          <OnToggleClick />
          <HideOnClickOutside />
        </div>
      ))}
    </div>
  );
}

if (typeof window.allLoaded === 'undefined') {
  window.allLoaded = [];
}
window.allLoaded.push(async function () {
  render(<Main />, document.getElementById("app"));
});
