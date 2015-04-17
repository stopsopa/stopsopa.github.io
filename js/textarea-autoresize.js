function textareaAutoResize() {
  function resize(element) {
    var offset = element.offsetHeight - element.clientHeight;
    element.style.height = "auto";
    element.style.height = element.scrollHeight + offset + "px";
  }
  document.querySelectorAll("[data-autoresize]").forEach(function (element) {
    element.style.boxSizing = "border-box";
    element.addEventListener("input", function (event) {
      resize(event.target);
    });
    element.removeAttribute("data-autoresize");
    element.setAttribute("data-autoresize-attached", "true");
  });

  return () => {
    document.querySelectorAll("[data-autoresize-attached]").forEach(function (element) {
      resize(element);
    });
  };
}

window.textareaAutoResize = textareaAutoResize;

//   window.resizeTextareas = (function () {
//     const trigger = textareaAutoResize();

//     return () => {
//       window.requestAnimationFrame(trigger);
//     };
//   })();
//
// then call resizeTextareas() if needed
