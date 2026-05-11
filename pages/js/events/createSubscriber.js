// pages/js/events/createSubscriber.ts
function createSubscriber(target) {
  const bindings = /* @__PURE__ */ new Map();
  function bind(event, handler) {
    if (!bindings.has(event)) {
      bindings.set(event, /* @__PURE__ */ new Set());
    }
    bindings.get(event).add(handler);
    target.addEventListener(event, handler);
  }
  function unbind(event, handler) {
    bindings.get(event)?.delete(handler);
    target.removeEventListener(event, handler);
  }
  function destroy() {
    bindings.forEach((handlers, event) => {
      handlers.forEach((handler) => {
        target.removeEventListener(event, handler);
      });
    });
    bindings.clear();
  }
  return { bind, unbind, destroy };
}
export { createSubscriber as default };
