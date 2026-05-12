/**
  type Events = {
    login: [user: { id: string; name: string }];
    logout: [];
  };

  const subscriber = createSubscriber<Events>();

  const loginHandler = () => {}
  const logoutHandler = () => {}

  subscriber.bind("login", loginHandler);
  subscriber.bind("logout", logoutHandler);

  subscriber.trigger("login", { id: "1", name: "John" });

  subscriber.trigger("logout");
 */

export default function createSubscriber<EventsSpecs extends Record<string, any[]> = Record<string, any[]>>() {
  const bindings = new Map<keyof EventsSpecs, Set<any>>();

  function bind<K extends keyof EventsSpecs>(event: K, handler: (...args: EventsSpecs[K]) => void) {
    if (!bindings.has(event)) {
      bindings.set(event, new Set());
    }
    bindings.get(event)!.add(handler);
    return () => unbind(event, handler);
  }

  function unbind<K extends keyof EventsSpecs>(event: K, handler: (...args: EventsSpecs[K]) => void) {
    bindings.get(event)?.delete(handler);
  }

  function unbindGroup<K extends keyof EventsSpecs>(event: K) {
    bindings.delete(event);
  }

  function trigger<K extends keyof EventsSpecs>(event: K, ...args: EventsSpecs[K]) {
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

  return { bind, unbind, unbindGroup, trigger, destroy, getCount };
}
