import { expect, test, vi } from "vitest";
import createSubscriber from "./createSubscriber.ts";

test("bind adds handler and returns unbind function", () => {
  const subscriber = createSubscriber();
  const handler = vi.fn();

  const unbind = subscriber.bind("test", handler);
  expect(subscriber.getCount()).toBe(1);

  subscriber.trigger("test", "data");
  expect(handler).toHaveBeenCalledWith("data");

  unbind();
  expect(subscriber.getCount()).toBe(0);
});

test("unbind removes handler", () => {
  const subscriber = createSubscriber();
  const handler = vi.fn();

  subscriber.bind("test", handler);
  subscriber.unbind("test", handler);

  subscriber.trigger("test");
  expect(handler).not.toHaveBeenCalled();
});

test("trigger forwards all arguments", () => {
  const subscriber = createSubscriber();
  const handler = vi.fn();

  subscriber.bind("test", handler);
  subscriber.trigger("test", 1, 2, 3);

  expect(handler).toHaveBeenCalledWith(1, 2, 3);
});


test("destroy clears all bindings", () => {
  const subscriber = createSubscriber();
  subscriber.bind("a", () => {});
  subscriber.bind("b", () => {});

  expect(subscriber.getCount()).toBe(2);
  subscriber.destroy();
  expect(subscriber.getCount()).toBe(0);
});

test("getCount returns total number of handlers", () => {
  const subscriber = createSubscriber();
  subscriber.bind("a", () => {});
  subscriber.bind("a", () => {}); // Different handler (anonymous)
  subscriber.bind("b", () => {});

  expect(subscriber.getCount()).toBe(3);
});
