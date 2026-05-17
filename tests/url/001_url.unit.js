import { describe, expect, test } from "vitest";
const basicUrl = "https://google.com/search/index.html?q=test&p=123#hash";
describe("errors", () => {
  test("empty string", () => {
    try {
      const u = new URL("");
      throw new Error(`Shouldn't happen`);
    } catch (e) {
      expect(String(e)).toBe("TypeError: Invalid URL");
      expect(e.input).toBe("");
      expect(e.code).toBe("ERR_INVALID_URL");
    }
  });
  test("just hostname", () => {
    try {
      const u = new URL("google.com");
      throw new Error(`Shouldn't happen`);
    } catch (e) {
      expect(String(e)).toBe("TypeError: Invalid URL");
      expect(e.input).toBe("google.com");
      expect(e.code).toBe("ERR_INVALID_URL");
    }
  });
  test("just hostname", () => {
    try {
      const u = new URL("//google.com");
      throw new Error(`Shouldn't happen`);
    } catch (e) {
      expect(String(e)).toBe("TypeError: Invalid URL");
      expect(e.input).toBe("//google.com");
      expect(e.code).toBe("ERR_INVALID_URL");
    }
  });
  test("just get params", () => {
    try {
      const u = new URL("a=b&c=d");
      throw new Error(`Shouldn't happen`);
    } catch (e) {
      expect(String(e)).toBe("TypeError: Invalid URL");
      expect(e.input).toBe("a=b&c=d");
      expect(e.code).toBe("ERR_INVALID_URL");
    }
  });
});
describe("hash", () => {
  test("get hash", () => {
    const u = new URL(basicUrl);
    expect(u.toString()).toBe("https://google.com/search/index.html?q=test&p=123#hash");
    expect(u.hash).toBe("#hash");
  });
  test("get hash - when not set", () => {
    const u = new URL(basicUrl.split("#")[0]);
    expect(u.toString()).toBe("https://google.com/search/index.html?q=test&p=123");
    expect(u.hash).toBe("");
  });
  test("get hash - when just #", () => {
    const u = new URL(basicUrl.split("#")[0] + "#");
    expect(u.toString()).toBe("https://google.com/search/index.html?q=test&p=123#");
    expect(u.hash).toBe("");
  });
});
describe("getters", () => {
  test("get origin", () => {
    const u = new URL(basicUrl);
    expect(u.origin).toBe("https://google.com");
  });
  test("get hostname", () => {
    const u = new URL(basicUrl);
    expect(u.hostname).toBe("google.com");
  });
  test("get pathname", () => {
    const u = new URL(basicUrl);
    expect(u.pathname).toBe("/search/index.html");
  });
});
describe("search params", () => {
  test("remove search", () => {
    const u = new URL(basicUrl);
    u.search = "";
    expect(u.toString()).toBe("https://google.com/search/index.html#hash");
  });
  test("query duplicates behavior", () => {
    const u = new URL(basicUrl);
    u.searchParams.append("a", "test2");
    u.searchParams.append("a", "test1");
    expect(u.searchParams.get("a")).toBe("test2");
    expect(u.searchParams.getAll("a")).toEqual(["test2", "test1"]);
    expect(u.searchParams.getAll("a").length).toBe(2);
    expect(u.searchParams.getAll("none").length).toBe(0);
    u.searchParams.delete("a");
    expect({
      a: u.toString(),
      b: u.toJSON(),
      c: u.href,
    }).toEqual({
      a: "https://google.com/search/index.html?q=test&p=123#hash",
      b: "https://google.com/search/index.html?q=test&p=123#hash",
      c: "https://google.com/search/index.html?q=test&p=123#hash",
    });
  });
  test("change just params", () => {
    const u = new URL(basicUrl);
    const p = new URLSearchParams(u.search);
    p.delete("p");
    p.set("a", "test1");
    p.set("a", "test2");
    u.search = p.toString();
    expect(p.toString()).toBe("q=test&a=test2");
    expect(u.toString()).toBe("https://google.com/search/index.html?q=test&a=test2#hash");
  });
  test("append", () => {
    const u = new URL(basicUrl);
    const p = new URLSearchParams(u.search);
    p.delete("p");
    p.append("a", "test1");
    p.append("a", "test2");
    u.search = p.toString();
    expect(p.toString()).toBe("q=test&a=test1&a=test2");
    expect(u.toString()).toBe("https://google.com/search/index.html?q=test&a=test1&a=test2#hash");
  });
  test("set after append", () => {
    const u = new URL(basicUrl);
    const p = new URLSearchParams(u.search);
    p.delete("p");
    p.append("a", "test1");
    p.append("a", "test2");
    p.set("a", "final");
    u.search = p.toString();
    expect(p.toString()).toBe("q=test&a=final");
    expect(u.toString()).toBe("https://google.com/search/index.html?q=test&a=final#hash");
  });
  test("sort", () => {
    const params = new URLSearchParams();
    params.append("b", "2");
    params.append("a", "z");
    params.append("a", "a");
    params.append("c", "3");
    params.sort();
    expect(params.toString()).toBe("a=z&a=a&b=2&c=3");
  });
  test("sort by key then value", () => {
    const params = new URLSearchParams();
    params.append("b", "2");
    params.append("a", "z");
    params.append("a", "a");
    params.append("c", "3");
    params.append("b", "1");
    const sorted = new URLSearchParams(
      [...params.entries()].sort(([k1, v1], [k2, v2]) => {
        if (k1 === k2) {
          return v1.localeCompare(v2);
        }
        return k1.localeCompare(k2);
      })
    );
    expect(sorted.toString()).toBe("a=a&a=z&b=1&b=2&c=3");
  });
});
describe("url parts", () => {
  test("change just domain", () => {
    const u = new URL(basicUrl);
    u.hostname = "google.co.uk";
    expect(u.toString()).toBe("https://google.co.uk/search/index.html?q=test&p=123#hash");
  });
  test("change just path", () => {
    const u = new URL(basicUrl);
    u.pathname = "/abc/def.html";
    expect(u.toString()).toBe("https://google.com/abc/def.html?q=test&p=123#hash");
  });
  test("change just index.html to page.jsp", () => {
    const u = new URL(basicUrl);
    const parts = u.pathname.split("/");
    parts.pop();
    parts.push("page.jsp");
    u.pathname = parts.join("/");
    expect(u.toString()).toBe("https://google.com/search/page.jsp?q=test&p=123#hash");
  });
  test("change protocol", () => {
    const u = new URL(basicUrl);
    u.protocol = "http:";
    expect(u.toString()).toBe("http://google.com/search/index.html?q=test&p=123#hash");
  });
});
describe("hash modifiers", () => {
  test("change hash", () => {
    const u = new URL(basicUrl);
    u.hash = "newhash";
    expect(u.toString()).toBe("https://google.com/search/index.html?q=test&p=123#newhash");
  });
  test("remove hash", () => {
    const u = new URL(basicUrl);
    u.hash = "";
    expect(u.toString()).toBe("https://google.com/search/index.html?q=test&p=123");
  });
});
test("set port", () => {
  const u = new URL(basicUrl);
  u.port = "8080";
  expect(u.toString()).toBe("https://google.com:8080/search/index.html?q=test&p=123#hash");
});
describe("auth", () => {
  test("set username", () => {
    const u = new URL(basicUrl);
    u.username = "test";
    expect(u.toString()).toBe("https://test@google.com/search/index.html?q=test&p=123#hash");
  });
  test("set password", () => {
    const u = new URL(basicUrl);
    u.password = "test";
    expect(u.toString()).toBe("https://:test@google.com/search/index.html?q=test&p=123#hash");
  });
  test("set username and password", () => {
    const u = new URL(basicUrl);
    u.username = "test";
    u.password = "test";
    expect(u.toString()).toBe("https://test:test@google.com/search/index.html?q=test&p=123#hash");
  });
});
