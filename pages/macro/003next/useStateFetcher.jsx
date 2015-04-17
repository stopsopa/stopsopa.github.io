import { useEffect, useState, useRef } from "react";

export default function useStateFetcher(def) {
  const [state, setState] = useState(def);

  const ref = useRef(def);

  useEffect(() => {
    ref.current = state;
  }, [state]);

  return [
    state,
    setState,
    () => {
      return ref.current;
    },
  ];
}

// function MyComponent() {
//   const [tabs, setTabsDontUseDirectly, getTabsFetcher] = useState([
//     // { index: "one_indx", label: "one" },
//     // { index: "two_indx", label: "two" },
//     // { index: "three_indx", label: "three" },
//   ]);

//   // const [tabs, setTabsDontUseDirectly, getTabsFetcher] = useStateFetcher([ // <----- SOLUTION 1
//   //   // { index: "one_indx", label: "one" },
//   //   // { index: "two_indx", label: "two" },
//   //   // { index: "three_indx", label: "three" },
//   // ]);

//   async function pushTabs() {
//     const result = await set({
//       key: "tabs",
//       data: tabs, // <-- PROBLEM: old state
//       //   data: getTabsFetcher(),
//     });
//   }

//   useEffect(() => {
//     window.addEventListener("blur", async function () {
//       /**
//        * Problem is here where on event blur we will call OLD function
//        * .. instance of pushTabs generated with first trigger useEffect
//        * will result in pushing empty array
//        */
//       queue(() => pushTabs());
//     });
//   }, []);
// }
