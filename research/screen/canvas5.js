function addCss(css) {
  var head = document.head || document.getElementsByTagName("head")[0];
  var styleElement = document.createElement("style");
  head.appendChild(styleElement);
  styleElement.type = "text/css";
  styleElement.appendChild(document.createTextNode(css));
  return {
    unmountStyle: () => {
      styleElement.parentNode.removeChild(styleElement);
    },
    styleElement,
  };
  return;
}
addCss(`
#periscope_div {
position: fixed;
width: 200px;
height: 200px;
overflow: hidden;
border: 1px solid gray;
top: 0;
left: 0;
background-color: white;
}
#periscope_div video {
width: 200px;
height: 200px;
border: 1px solid red;
}
#periscope_div canvas {
border: 1px solid green;
/* width: 200px;
height: 200px; */
}
`);
function get(key) {
  const v = localStorage.getItem(key);
  if (v !== null) {
    const tmp = parseInt(v, 10);
    if (isNaN(tmp)) {
      return v;
    }
    return tmp;
  }
}
function set(key, val) {
  if (val !== null && typeof val !== "undefined") {
    localStorage.setItem(key, String(val));
  }
}
function getStyle(el) {
  var styles = window.getComputedStyle(el);
  return styles;
}
function drag(element, listener, fetch) {
  let pageX = 0;
  let pageY = 0;
  let down = false;
  let fetchX;
  let fetchY;
  element.addEventListener("mousedown", (e) => {
    down = true;
    pageX = e.pageX;
    pageY = e.pageY;
    if (typeof fetch === "function") {
      ({ x: fetchX, y: fetchY } = fetch());
    } else {
      fetchX = fetchY = 0;
    }
    listener(fetchX + e.pageX - pageX, fetchY + e.pageY - pageY, "mousedown");
  });
  function stop(e) {
    if (down) {
      down = false;
      listener(fetchX + e.pageX - pageX, fetchY + e.pageY - pageY, "mouseup");
    }
  }
  element.addEventListener("mouseup", stop);
  element.addEventListener("mouseout", stop);
  element.addEventListener("mousemove", (e) => {
    if (down) {
      listener(fetchX + e.pageX - pageX, fetchY + e.pageY - pageY, "mousemove");
    }
  });
}
const button = document.querySelector("button");
const destroy = document.querySelector("#destroy");
// const log = console.log;
// button.addEventListener("click", function () {
// log("button");
navigator.mediaDevices
  .getDisplayMedia({
    audio: false,
    video: true,
    preferCurrentTab: true, // https://stackoverflow.com/a/70665376
  })
  .then((stream) => {
    const keys = {};
    document.addEventListener("keydown", (e) => {
      keys[e.key] = true;
      // log("keydown keys", keys);
    });
    document.addEventListener("keyup", (e) => {
      keys[e.key] = false;
      // log("keyup keys", keys);
    });
    const parent = document.createElement("div");
    parent.setAttribute("id", "periscope_div");
    const pw = get("pw");
    if (pw) {
      // log("lc", "pw", pw);
      parent.style.width = `${pw}px`;
    }
    const ph = get("ph");
    if (ph) {
      // log("lc", "ph", ph);
      parent.style.height = `${ph}px`;
    }
    const pl = get("pl");
    if (pl) {
      // log("lc", "pl", pl);
      parent.style.left = `${pl}px`;
    }
    const pt = get("pt");
    if (pt) {
      // log("lc", "pt", pt);
      parent.style.top = `${pt}px`;
    }
    drag(
      parent,
      (x, y) => {
        if (keys.Shift) {
          parent.style.width = `${x}px`;
          parent.style.height = `${y}px`;
          set("pw", x);
          set("ph", y);
        } else {
          if (!keys.Meta) {
            parent.style.left = `${x}px`;
            parent.style.top = `${y}px`;
            set("pl", x);
            set("pt", y);
            return;
          }
        }
      },
      () => {
        if (keys.Shift) {
          const c = getStyle(parent);
          const t = { x: parseInt(c.width, 10) || 0, y: parseInt(c.height, 10) || 0 };
          // log("shift", t);
          return t;
        }
        return { x: parseInt(parent.style.left, 10) || 0, y: parseInt(parent.style.top, 10) || 0 };
      }
    );
    document.body.appendChild(parent);
    const video = document.createElement("video");
    video.setAttribute("controls", true);
    video.setAttribute("playsinline", true);
    video.setAttribute("autoplay", true);
    video.style.display = "none";
    // function del() {
    //   video.parentNode.removeChild(video);
    //   SimpleObserver.removeEventListener("delete", del);
    // }
    // SimpleObserver.addEventListener("delete", del);
    //<video src="" controls playsinline autoplay></video>
    parent.appendChild(video);
    let play = false;
    const stop = () => {
      // log("stop");
      play = false;
    };
    video.addEventListener("ended", stop);
    video.addEventListener("pause", stop);
    video.addEventListener("play", (event) => {
      // log("video.videoWidth");
      const canvas = document.createElement("canvas");
      drag(
        canvas,
        (x, y) => {
          if (keys.Meta) {
            const trans = `translate(${x}px, ${y}px)`;
            set("ct", trans);
            canvas.style.transform = trans;
          }
        },
        () => {
          const transform = (canvas.style.transform || "").match(/(-?\d+).*?(-?\d+)/) || [];
          const x = parseInt(transform[1], 10) || 0;
          const y = parseInt(transform[2], 10) || 0;
          // log("tran", canvas.style.transform, transform, x, y);
          return { x, y };
        }
      );
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.style.width = `${video.videoWidth}px`;
      canvas.style.height = `${video.videoHeight}px`;
      parent.appendChild(canvas);
      const ct = get("ct");
      // log("lc", "ct", ct);
      if (ct) {
        canvas.style.transform = ct;
      }
      play = true;
      (function copy() {
        if (!play) {
          return;
        }
        // log("play");
        window.requestAnimationFrame(() => {
          canvas.getContext("2d").drawImage(video, 0, 0, canvas.width, canvas.height);
          copy();
        });
      })();
    });
    video.srcObject = stream;
  });
// });
// destroy.addEventListener("click", function () {
//   log("destroy");
//   SimpleObserver.dispatchEvent("delete");
// });
