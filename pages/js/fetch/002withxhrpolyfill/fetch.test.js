import { fetchData, fetchJson, mockFetch } from "./fetch.js";

describe("fetch.js", () => {
  describe("fetchData", () => {
    it("passing env", (done) => {
      mockFetch((...args) => [...args]);

      (async function () {
        try {
          const data = await fetchData("/testurl", {
            env: "dev",
          });

          expect(data).toEqual(["/testurl", { headers: { "X-Target-Env": "dev" } }]);

          return done();
        } catch (e) {
          return done({
            general_test_error: e,
          });
        }
      })();
    });

    it("wrong env", (done) => {
      mockFetch((...args) => [...args]);

      (async function () {
        try {
          await fetchData("/testurl", {
            env: "wrong",
          });

          return done(`That shouldn't happen - wrong env`);
        } catch (e) {
          expect(String(e)).toEqual(
            "Error: fetch.ts fetchData error: env value >wrong< is not on the list of allowed values >dev,test,prod<, path parem: >/testurl<"
          );

          return done();
        }
      })();
    });

    it("env not provided", (done) => {
      mockFetch((...args) => [...args]);

      (async function () {
        try {
          await fetchData("/testurl");

          return done(`That shouldn't happen - env not provided`);
        } catch (e) {
          expect(String(e)).toEqual(
            "Error: fetch.ts fetchData error: env parameter not provided, should be one of >dev,test,prod<, path parem: >/testurl<"
          );

          return done();
        }
      })();
    });

    it("go for polyfil", (done) => {
      mockFetch((...args) => [...args]);

      process.env.NEXT_PUBLIC_AJAX_FETCH = true;

      (async function () {
        try {
          const data = await fetchData("/testurl", {
            env: "dev",
          });

          expect(data).toEqual(["/testurl", { headers: { "X-Target-Env": "dev" } }]);

          return done();
        } catch (e) {
          return done({
            general_test_error: e,
          });
        }
      })();
    });

    it("go for native", (done) => {
      mockFetch((...args) => [...args]);

      process.env.NEXT_PUBLIC_AJAX_FETCH = false;

      (async function () {
        try {
          const data = await fetchData("/testurl", {
            env: "dev",
          });

          expect(data).toEqual(["/testurl", { headers: { "X-Target-Env": "dev" } }]);

          return done();
        } catch (e) {
          return done({
            general_test_error: e,
          });
        }
      })();
    });

    it("path not a string", (done) => {
      mockFetch((...args) => [...args]);

      (async function () {
        try {
          await fetchData(67);

          return done(`That shouldn't happen - env not provided`);
        } catch (e) {
          expect(String(e)).toEqual("Error: fetch.ts fetchData error: path parameter should be a string");

          return done();
        }
      })();
    });
  });
  describe("fetchJson", () => {
    it("with body", (done) => {
      mockFetch((...args) => ({ json: () => [...args] }));

      (async function () {
        try {
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

          return done();
        } catch (e) {
          return done({
            general_test_error: e,
          });
        }
      })();
    });

    it("no body", (done) => {
      mockFetch((...args) => ({ json: () => [...args] }));

      (async function () {
        try {
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

          return done();
        } catch (e) {
          return done({
            general_test_error: e,
          });
        }
      })();
    });

    it("raw response", (done) => {
      mockFetch(() => ({ json: "json function not executed" }));

      (async function () {
        try {
          const data = await fetchJson("/testurl", {
            env: "dev",
            raw: true,
          });

          expect(data).toEqual({
            json: "json function not executed",
          });

          return done();
        } catch (e) {
          return done({
            general_test_error: e,
          });
        }
      })();
    });
  });
});
