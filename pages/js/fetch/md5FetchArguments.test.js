import md5FetchArguments from "./md5FetchArguments";

describe("md5FetchArguments", () => {
  it("just url", (done) => {
    try {
      const result = md5FetchArguments("/url");

      const expected = "/url:GET:88e3e552c347c11170c425657ec793ec";

      expect(result).toEqual(expected);

      return done();
    } catch (e) {
      return done(`error shouldn't happen: ${e}`);
    }
  });
  it("just method post", (done) => {
    try {
      const result = md5FetchArguments("/url", { method: "post" });

      const expected = "/url:POST:da3e3e9450934ec332666abd9c4a1753";

      expect(result).toEqual(expected);

      return done();
    } catch (e) {
      return done(`error shouldn't happen: ${e}`);
    }
  });

  it("just method post with data", (done) => {
    try {
      const result = md5FetchArguments("/url", { method: "post", body: { data: "some data" } });

      const expected = "/url:POST:2dc8ec3ea67d5f680e5c475e3b15abc3";

      expect(result).toEqual(expected);

      return done();
    } catch (e) {
      return done(`error shouldn't happen: ${e}`);
    }
  });

  it("triggered multiple time should return the same md5", (done) => {
    try {
      const data = { method: "post", body: { data: "some data", second: "value" } };

      const one = md5FetchArguments("/url", data);

      const two = md5FetchArguments("/url", data);

      const three = md5FetchArguments("/url", data);

      const expected = "/url:POST:15790dd54d4b0f5e455b3cec613f0f0c";

      expect(one).toEqual(expected);

      expect(two).toEqual(expected);

      expect(three).toEqual(expected);

      return done();
    } catch (e) {
      return done(`error shouldn't happen: ${e}`);
    }
  });

  it("the same structure in different order should produce the same md5", (done) => {
    try {
      const one = md5FetchArguments("/url", { method: "post", body: { data: "some data", second: "value" } });

      const two = md5FetchArguments("/url", { body: { second: "value", data: "some data" }, method: "POST" });

      expect(one).toEqual("/url:POST:15790dd54d4b0f5e455b3cec613f0f0c");

      expect(one).toEqual(two);

      return done();
    } catch (e) {
      return done(`error shouldn't happen: ${e}`);
    }
  });
});
