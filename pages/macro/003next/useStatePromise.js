import { useState, useEffect } from "react";

const cache = [];

const inc = (function () {
  let counter = 0;

  return () => {
    counter += 1;
    if (counter > 5000) {
      counter = 0;
    }
    return counter;
  };
})();

export default function useStatePromise(def) {
  const [{ state, dummy }, setState] = useState({ state: def, dummy: 0 });

  useEffect(() => {
    let buff;
    while ((buff = cache.shift())) {
      const { resolve } = buff;
      resolve();
    }
  }, [dummy]);

  return [
    state,
    (state) => {
      setState((oldState) => {
        return {
          dummy: inc(),
          state: typeof state === "function" ? state(oldState.state) : state,
        };
      });

      let resolve;

      const promise = new Promise((res) => {
        resolve = res;
      });

      cache.push({
        resolve,
        promise,
      });

      return promise;
    },
  ];
}
