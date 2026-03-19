import { test } from "node:test";
import assert from "node:assert/strict";
import Semaphore from "./Semaphore.ts";

/**
 *
 */
test("Semaphore", () => {
  const semaphore = new Semaphore(3);

  semaphore.acquire();
  semaphore.acquire();
  semaphore.acquire();
  semaphore.acquire();

  semaphore.release();
  semaphore.release();
  semaphore.release();
  semaphore.release();

  assert.strictEqual((semaphore as any).permits, 3);
});

test("Semaphore - order", async () => {
  const semaphore = new Semaphore(3);
  const promises = [];
  const order: number[] = [];
  async function doStuff(id: number) {
    await semaphore.acquire();
    order.push(id);
    await new Promise((resolve) => setTimeout(resolve, Math.random() * 100 + 900));
    // await new Promise((resolve) => setTimeout(resolve, 1000));
    semaphore.release();
  }
  for (let i = 0; i < 10; i++) {
    promises.push(doStuff(i));
  }
  await Promise.all(promises);
  assert.strictEqual((semaphore as any).permits, 3);
  assert.deepStrictEqual(order, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
});
