import { useRef } from "react";

/**
 * 
const num = (function () {
  let c = 0;
  return () => {
    c += 1;
    return c;
  };
})();
  
function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, ms);
  });
}
function Test({ unique }) {
  const queue = useQueue(async (data) => {
    await delay(parseInt(Math.random() * 300 + 100, 10));
    console.log("proc: ", unique, data);
  });  
  return (
    <div
      style={{ backgroundColor: "cyan", height: "400px", width: "400px", display: "inline-block", marginRight: "5px" }}
      onMouseMove={() => {
        const nu = num();  
        log("add_: ", unique, nu);  
        queue(nu);
      }}
    ></div>
  );
}
  
  as a test just render it twice: 
      <Test unique="****" />
      <Test unique="----" />
 */

/**
 * @param {*} commonAsyncFunc - optional function, if not provided then pass async function for each use of queue()
 */
export default function useQueue(commonAsyncFunc) {
  const ref = useRef([]);

  let lock = false;
  async function trigger() {
    if (!lock && ref.current.length > 0) {
      lock = true;

      const data = ref.current.shift();

      if (typeof commonAsyncFunc === "undefined") {
        await data();
      } else {
        await commonAsyncFunc(data);
      }

      lock = false;

      trigger();
    }
  }

  return (data) => {
    ref.current.push(data);

    trigger();
  };
}
