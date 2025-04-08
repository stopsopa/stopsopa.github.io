/**
 NODE_API_PORT=4273 /bin/bash jasmine/test.sh \
      --stay \
      --env .env \
      --filter "grep aes.jasmine.unit" 

      see more in xx.cjs
 */

import * as browserAes from "./aes-gcm-browser.js";

const { splitByLength, generateKey, encryptMessage, decryptMessage } = browserAes;

const message = `Lorem ipsum dolor sit amet, consectetur adipiscing elit. 
Etiam molestie pulvinar consequat. 
Phasellus vitae dolor fringilla, elementum risus sit amet, vulputate lorem. 
Sed venenatis facilisis orci, suscipit iaculis risus. 
Ut mollis dictum fringilla. 
Vestibulum quis pharetra purus, non blandit ex.`;

describe("aes256", () => {
  describe("splitByLength", () => {
    it("split", (done) => {
      const str = "1234567890qwertyuiopasdfghjklzxcvbnmQWERTYUIOPASDFGHJKLZXCVBNM";

      const parts = splitByLength(str, 10);

      expect(parts).toEqual(["1234567890", "qwertyuiop", "asdfghjklz", "xcvbnmQWER", "TYUIOPASDF", "GHJKLZXCVB", "NM"]);

      expect(parts.join("")).toEqual(str);

      done();
    });

    it("empty string", (done) => {
      const str = "";

      const parts = splitByLength(str, 10);

      expect(parts).toEqual([]);

      expect(parts.join("")).toEqual(str);

      done();
    });

    it("letter", (done) => {
      const str = "a";

      const parts = splitByLength(str, 10);

      expect(parts).toEqual(["a"]);

      expect(parts.join("")).toEqual(str);

      done();
    });

    it("4", (done) => {
      const str = "12345678";

      const parts = splitByLength(str, 4);

      expect(parts).toEqual(["1234", "5678"]);

      expect(parts.join("")).toEqual(str);

      done();
    });
  });

  describe("aes-gcm-browser", () => {
    it("aes-gcm-browser encrypt & decrypt", async () => {
      const key = await generateKey();

      const encrypted = await encryptMessage(key, message);

      expect(encrypted).toContain(":[v1:");

      expect(encrypted).toContain("::");

      expect(encrypted).toContain(":]:");

      const decrypted = await decryptMessage(key, encrypted);

      console.log("decrypted", decrypted);

      expect(decrypted).toEqual(message);
    });
  });

  describe("aes-gcm-browser", () => {
    it("aes-gcm-browser encrypt & decrypt", async () => {
      const key = await generateKey();

      const encrypted = await encryptMessage(key, message);

      expect(encrypted).toContain(":[v1:");

      expect(encrypted).toContain("::");

      expect(encrypted).toContain(":]:");

      const decrypted = await decryptMessage(key, encrypted);

      expect(decrypted).toEqual(message);
    });

    it("aes-gcm-browser encrypt & decrypt fixed key", async () => {
      const key = "oAPwnZ9eq4C5nh4YskdmeS/fCIJn6NgdxbgtvY6glfs=";

      const encrypted = await encryptMessage(key, message, {
        iv: "tfMxjk+55TktDfMD",
      });

      console.log("encrypted", encrypted);

      const expected = `:[v1:c0ad3::tfMxjk+55TktDfMD::
6JDIz5M7YO8fazPcZhylQV1Bb3MhVgauT9ahdY9GM1hU6A4tw3aN9loGsz49MJnVwhXNqJ655Js4dBXnT7QwpH3L7yM2CB4SsxRQVAupqe0A7F
YGzYDuVVDK+PoYK+x4J2m+zZdSgToC4Lvy1P3KexzJXp7lbeZ/bDHypFFE0GAH2rsisyz656ize6MkOJyw7RM64lmcF6zO/Ds3fhVAeCD1Y5KY
YIDRaXLWoLRhW+2TNMfJgHYSXuFMessGTEtpl5v4zCvfooIpaxLQ+JuV6MMXRy03G84Jz11kVltqNqb+WywbORInQ8t9sRw45Zmgk/nsrHaIaH
FdaJCz9y20x7Ib83bsVcOYLI6/9yAPF1lu9wIxqLkVYBBHrF0yWo0VTf24OUIgD9nZ28iQ+e1e1Vhjnp213tKdmU0QZzP/:]:`;

      console.log("expected", expected);

      expect(expected).toEqual(encrypted);

      const decrypted = await decryptMessage(key, encrypted);

      expect(decrypted).toEqual(message);
    });
  });
});
