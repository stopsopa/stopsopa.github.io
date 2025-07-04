// urlwizzard.schema://urlwizzard.hostnegotiated/pages/js/index.rendered.html#addcss-function
export default function addCss(css) {
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
