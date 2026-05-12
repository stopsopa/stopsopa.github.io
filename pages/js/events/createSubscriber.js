// pages/js/events/createSubscriber.ts
function createSubscriber() {
  const bindings = /* @__PURE__ */ new Map();
  function bind(event, handler) {
    if (!bindings.has(event)) {
      bindings.set(event, /* @__PURE__ */ new Set());
    }
    bindings.get(event).add(handler);
    return () => unbind(event, handler);
  }
  function unbind(event, handler) {
    bindings.get(event)?.delete(handler);
  }
  function unbindGroup(event) {
    bindings.delete(event);
  }
  function trigger(event, ...args) {
    bindings.get(event)?.forEach((handler) => {
      handler(...args);
    });
  }
  function destroy() {
    bindings.clear();
  }
  function getCount() {
    let count = 0;
    bindings.forEach((handlers) => count += handlers.size);
    return count;
  }
  return { bind, unbind, unbindGroup, trigger, destroy, getCount };
}
export {
  createSubscriber as default
};
