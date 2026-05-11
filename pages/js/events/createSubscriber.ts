export default function createSubscriber(target: EventTarget) {
  const bindings = new Map<string, Set<EventListenerOrEventListenerObject>>();

  function bind(event: string, handler: EventListenerOrEventListenerObject) {
    if (!bindings.has(event)) {
      bindings.set(event, new Set());
    }
    bindings.get(event)!.add(handler);
    target.addEventListener(event, handler);
  }

  function unbind(event: string, handler: EventListenerOrEventListenerObject) {
    bindings.get(event)?.delete(handler);
    target.removeEventListener(event, handler);
  }

  function destroy() {
    bindings.forEach((handlers, event) => {
      handlers.forEach((handler: EventListenerOrEventListenerObject) => {
        target.removeEventListener(event, handler);
      });
    });
    bindings.clear();
  }

  return { bind, unbind, destroy };
}
