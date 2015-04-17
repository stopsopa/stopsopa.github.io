import { useEffect, useState } from "react";

const log = console.log;

const getLoc = () => {
  let loc;

  try {
    loc = location.href;
  } catch (e) {
    log(`Can't access location.href`);
  }

  return loc;
};

/**
 * Seems like customizing message in onbeforeunload is now impossible
 */
export default function onBeforeUnloadHook(props) {
  props = {
    block: false,
    message: "Leaving the page... are you sure?",
    ...props,
  };

  const { block, message } = props;

  const [onx, setOnX] = useState(false);

  const on = () => {
    // log("on block && !on:", block && !on);
    if (block && !onx) {
      try {
        // the method that will be used for both add and remove event
        // https://developer.mozilla.org/en-US/docs/Web/Events/beforeunload
        // https://stackoverflow.com/a/10311375
        let loc = getLoc();

        window.onbeforeunload = (e) => {
          let curloc = getLoc();

          if (curloc && curloc === loc) {
            e = e || window.event;

            // For IE and Firefox prior to version 4
            if (e) {
              e.returnValue = message;
            }

            // For Safari
            return message;
          }

          log(`current location '${curloc}' is different then at the moment of mounting onbeforeunload '${loc}'`);
        };
      } catch (e) {
        log("onBeforeUnloadHook on error: ", e);
      }

      setOnX(true);
    }
  };

  const off = () => {
    // log("off !block && on:", !block && on);
    if (!block && onx) {
      try {
        window.onbeforeunload = undefined;
      } catch (e) {
        log("onBeforeUnloadHook off error: ", e);
      }

      setOnX(false);
    }
  };

  useEffect(() => {
    on();

    off();

    return off;
  }, [block, onx]);

  return null;
}
