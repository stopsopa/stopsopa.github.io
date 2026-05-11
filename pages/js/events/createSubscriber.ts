export default function createSubscriber() {
  const bindings = new Map<string, Set<any>>();

  function bind(event: string, handler: any) {
    if (!bindings.has(event)) {
      bindings.set(event, new Set());
    }
    bindings.get(event)!.add(handler);
    return () => unbind(event, handler);
  }

  function unbind(event: string, handler: any) {
    bindings.get(event)?.delete(handler);
  }

  function trigger(event: string, ...args: any[]) {
    bindings.get(event)?.forEach((handler) => {
      handler(...args);
    });
  }

  function destroy() {
    bindings.clear();
  }

  function getCount() {
    let count = 0;
    bindings.forEach((handlers) => (count += handlers.size));
    return count;
  }

  return { bind, unbind, trigger, destroy, getCount };
}
