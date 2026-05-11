import { expect, test, vi } from "vitest";
import createSubscriber from "./createSubscriber.ts";

test("bind adds event listener", () => {
  const target = new EventTarget();
  const subscriber = createSubscriber(target);
  const handler = vi.fn();

  subscriber.bind("click", handler);
  target.dispatchEvent(new Event("click"));

  expect(handler).toHaveBeenCalledTimes(1);
});

test("unbind removes event listener", () => {
  const target = new EventTarget();
  const subscriber = createSubscriber(target);
  const handler = vi.fn();

  subscriber.bind("click", handler);
  subscriber.unbind("click", handler);
  target.dispatchEvent(new Event("click"));

  expect(handler).not.toHaveBeenCalled();
});

test("destroy removes all event listeners", () => {
  const target = new EventTarget();
  const subscriber = createSubscriber(target);
  const handler1 = vi.fn();
  const handler2 = vi.fn();

  subscriber.bind("click", handler1);
  subscriber.bind("mouseover", handler2);

  subscriber.destroy();

  target.dispatchEvent(new Event("click"));
  target.dispatchEvent(new Event("mouseover"));

  expect(handler1).not.toHaveBeenCalled();
  expect(handler2).not.toHaveBeenCalled();
});
