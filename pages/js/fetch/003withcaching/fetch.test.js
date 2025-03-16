import { fetchData, fetchJson, mockFetch, inspectCache, clearCache } from "./fetch";

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

describe("fetch.js", () => {
  describe("fetchData", () => {
    it("passing env", async () => {
      mockFetch((...args) => [...args]);

      const data = await fetchData("/testurl", {
        env: "dev",
      });

      expect(data).toEqual(["/testurl", { headers: { "X-Target-Env": "dev" } }]);
    });

    it("wrong env", async () => {
      mockFetch((...args) => [...args]);

      await expect(fetchData("/testurl", { env: "wrong" })).rejects.toThrow(
        "fetch.ts fetchData error: env value >wrong< is not on the list of allowed values >dev,test,prod<, path parem: >/testurl<"
      );
    });

    it("env not provided", async () => {
      mockFetch((...args) => [...args]);

      await expect(fetchData("/testurl")).rejects.toThrow(
        "fetch.ts fetchData error: env parameter not provided, should be one of >dev,test,prod<, path parem: >/testurl<"
      );
    });

    it("go for polyfil", async () => {
      mockFetch((...args) => [...args]);

      process.env.NEXT_PUBLIC_AJAX_FETCH = true;

      const data = await fetchData("/testurl", {
        env: "dev",
      });

      expect(data).toEqual(["/testurl", { headers: { "X-Target-Env": "dev" } }]);
    });

    it("go for native", async () => {
      mockFetch((...args) => [...args]);

      process.env.NEXT_PUBLIC_AJAX_FETCH = false;

      const data = await fetchData("/testurl", {
        env: "dev",
      });

      expect(data).toEqual(["/testurl", { headers: { "X-Target-Env": "dev" } }]);
    });

    it("path not a string", async () => {
      mockFetch((...args) => [...args]);

      await expect(fetchData(67)).rejects.toThrow("fetch.ts fetchData error: path parameter should be a string");
    });
  });

  describe("fetchJson", () => {
    it("with body", async () => {
      mockFetch((...args) => ({ json: () => [...args] }));

      const data = await fetchJson("/testurl", {
        env: "dev",
        body: {
          some: "data",
        },
      });

      expect(data).toEqual([
        "/testurl",
        {
          body: '{\n    "some": "data"\n}',
          headers: {
            "Content-Type": "application/json; charset=utf-8",
            Accept: "application/json",
            "X-Target-Env": "dev",
          },
          method: "POST",
        },
      ]);
    });

    it("no body", async () => {
      mockFetch((...args) => ({ json: () => [...args] }));

      const data = await fetchJson("/testurl", {
        env: "dev",
      });

      expect(data).toEqual([
        "/testurl",
        {
          headers: {
            "Content-Type": "application/json; charset=utf-8",
            Accept: "application/json",
            "X-Target-Env": "dev",
          },
        },
      ]);
    });

    it("raw response", async () => {
      mockFetch(() => ({ json: "json function not executed" }));

      const data = await fetchJson("/testurl", {
        env: "dev",
        raw: true,
      });

      expect(data).toEqual({
        json: "json function not executed",
      });
    });
  });

  describe("cache", () => {
    it("two requests - no cache", async () => {
      let i = 0;
      mockFetch((...args) => [...args, i++]);

      clearCache();

      const result = [];
      let res;

      res = await fetchData("/test", {
        env: "dev",
      });

      result.push(res);

      res = await fetchData("/test", {
        env: "dev",
      });

      result.push(res);

      const expected = [
        [
          "/test",
          {
            headers: {
              "X-Target-Env": "dev",
            },
          },
          0,
        ],
        [
          "/test",
          {
            headers: {
              "X-Target-Env": "dev",
            },
          },
          1,
        ],
      ];

      expect(result).toEqual(expected);
    });

    it("two requests - cache on", async () => {
      let i = 0;
      mockFetch((...args) => [...args, i++]);

      clearCache();

      const result = [];
      let res;

      res = await fetchData("/test", {
        env: "dev",
        cacheSec: 1000,
      });

      result.push(res);

      res = await fetchData("/test", {
        env: "dev",
        cacheSec: 1000,
      });

      result.push(res);

      const expected = [
        [
          "/test",
          {
            headers: {
              "X-Target-Env": "dev",
            },
          },
          0,
        ],
        [
          "/test",
          {
            headers: {
              "X-Target-Env": "dev",
            },
          },
          0,
        ],
      ];

      expect(result).toEqual(expected);

      const cache = inspectCache();

      const justHashAndcacheSecFromCache = Object.entries(cache).map(
        // eslint-disable-next-line no-unused-vars
        ([hash, [createdDateObject, cacheSec, promise]]) => {
          return [hash, cacheSec];
        }
      );

      expect(justHashAndcacheSecFromCache).toEqual([["/test:GET:9bfa905e2cfe4bf39c47714900437bb0", 1000]]);
    });

    it("two requests - wait for expiration", async () => {
      let i = 0;
      mockFetch((...args) => [...args, i++]);

      clearCache();

      const result = [];
      let res;

      res = await fetchData("/test", {
        env: "dev",
        cacheSec: 0.1, // keep in cache for 100 miliseconds
      });

      result.push(res);

      await delay(200); // wait 200 to make promise in cache expire

      res = await fetchData("/test", {
        env: "dev",
        cacheSec: 0.1, // the same arguments to fetch to hit the same (non existing) element in the cache
      });

      result.push(res);

      const expected = [
        [
          "/test",
          {
            headers: {
              "X-Target-Env": "dev",
            },
          },
          0,
        ],
        [
          "/test",
          {
            headers: {
              "X-Target-Env": "dev",
            },
          },
          1, // this number here indicates that value didn't came from cache
        ],
      ];

      expect(result).toEqual(expected);

      const cache = inspectCache();

      const justHashAndcacheSecFromCache = Object.entries(cache).map(
        // eslint-disable-next-line no-unused-vars
        ([hash, [createdDateObject, cacheSec, promise]]) => {
          return [hash, cacheSec];
        }
      );

      expect(justHashAndcacheSecFromCache).toEqual([["/test:GET:9bfa905e2cfe4bf39c47714900437bb0", 0.1]]);
    });

    it("cacheSec - wrong value", async () => {
      await expect(
        fetchData("/test", {
          env: "dev",
          cacheSec: -1,
        })
      ).rejects.toThrow(
        "fetch.ts fetchData error: cacheSec value >-1< seems not right, should be number of seconds for how long promise should be held in the cache, path parem: >/test<"
      );
    });
  });
});
