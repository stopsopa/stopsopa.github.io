import { fetchData, fetchJson, mockFetch } from "./fetch.js";

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

      await expect(fetchData(67)).rejects.toThrow(
        "fetch.ts fetchData error: path parameter should be a string"
      );
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
});
