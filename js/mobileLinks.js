const test = /https?:\/\/[^\s]+/g;

let stopForAWhile = false;

let popup;

function removePopup() {
  if (popup) {
    popup.remove();
    popup = null;
  }
}

export const mobileLinkElement = (el, text, origin) => {
  console.log({ origin, el, text, stopForAWhile });

  if (stopForAWhile) {
    return;
  }

  removePopup();

  if (typeof text === "string") {
    const matchAll = [...text.matchAll(test)];

    if (Array.isArray(matchAll) && matchAll.length === 1 && Array.isArray(matchAll[0]) && matchAll[0].length === 1) {
      stopForAWhile = true;

      setTimeout(() => {
        stopForAWhile = false;
      }, 100);

      const url = matchAll[0][0];

      console.log("getBoundingClientRect", JSON.stringify(el.getBoundingClientRect(), null, 2));
      //   getBoundingClientRect {
      //     "x": 588,
      //     "y": 189.5078125,
      //     "width": 1000000,
      //     "height": 16,
      //     "top": 189.5078125,
      //     "right": 1000588,
      //     "bottom": 205.5078125,
      //     "left": 588
      //     }

      popup = document.createElement("div");
      popup.className = "mobile-link-popup";
      popup.style.left = `${el.getBoundingClientRect().left}px`;
      popup.style.top = `${el.getBoundingClientRect().bottom + 5}px`;
      //   popup.textContent = "Open link";
      // //   popup.textContent = url;

      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.textContent = "Open link";

      const copy = document.createElement("span");
      copy.textContent = "copy";

      copy.style.marginRight = "10px";
      copy.onclick = () => {
        stopForAWhile = false;
        navigator.clipboard.writeText(url).then(() => {
          copy.textContent = "copied";
          setTimeout(() => {
            copy.textContent = "copy";
            setTimeout(() => {
              removePopup();
            }, 1000);
          }, 1000);
        });
      };
      popup.appendChild(copy);

      link.onclick = () => {
        removePopup();
        stopForAWhile = false;
        window.open(url, "_blank");
      };
      popup.appendChild(link);

      document.body.appendChild(popup);
    }
  }
};

export default function mobileLinks() {
  document.body.addEventListener("click", function (e) {
    var el = e.target;

    try {
      const text = el.textContent || el.innerText;

      mobileLinkElement(el, text, "delegate");
    } catch (e) {
      console.log("mobileLinks error:", e);

      setTimeout(() => {
        throw e;
      }, 0);
    }
  });
  // trigger removePopup() on document scroll
  document.addEventListener("scroll", removePopup, { passive: true });
}
