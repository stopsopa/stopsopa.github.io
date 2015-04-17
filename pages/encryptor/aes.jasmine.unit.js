/**
 NODE_OPTIONS="" NODE_API_PORT=4273 /bin/bash jasmine/test.sh \
      --stay \
      --env .env \
      --filter "grep aes.jasmine.unit" 

  NODE_OPTIONS="" /bin/bash test.sh pages/encryptor/aes.jasmine.unit.js

      see more in xx.cjs
 */

// import * as browserAes from "./aes-cbc-browser.js";

// Instead of wrapping everything in an async IIFE, we'll handle the dynamic imports differently
const isNode = typeof global !== "undefined" && Object.prototype.toString.call(global.process) === "[object process]";

// Set up a promise that will resolve to the correct lib
const getLib = async () => {
  let lib;

  if (isNode) {
    // This module should be excluded from the bundler
    // and it is excluded in jasmine/esbuild.js
    lib = await import("./aes-cbc-node.js");
  } else {
    lib = await import("./aes-cbc-browser.js");
  }

  return lib;
};

// Define message outside the tests
const message = `Lorem ipsum dolor sit amet, consectetur adipiscing elit. 
Etiam molestie pulvinar consequat. 
Phasellus vitae dolor fringilla, elementum risus sit amet, vulputate lorem. 
Sed venenatis facilisis orci, suscipit iaculis risus. 
Ut mollis dictum fringilla. 
Vestibulum quis pharetra purus, non blandit ex.`;

// Register the tests synchronously
describe("aes256", () => {
  describe("splitByLength", () => {
    it("split", async () => {
      const { splitByLength } = await getLib();

      const str = "1234567890qwertyuiopasdfghjklzxcvbnmQWERTYUIOPASDFGHJKLZXCVBNM";

      const parts = splitByLength(str, 10);

      expect(parts).toEqual(["1234567890", "qwertyuiop", "asdfghjklz", "xcvbnmQWER", "TYUIOPASDF", "GHJKLZXCVB", "NM"]);

      expect(parts.join("")).toEqual(str);
    });

    it("empty string", async () => {
      const { splitByLength } = await getLib();

      const str = "";

      const parts = splitByLength(str, 10);

      expect(parts).toEqual([]);

      expect(parts.join("")).toEqual(str);
    });

    it("letter", async () => {
      const { splitByLength } = await getLib();

      const str = "a";

      const parts = splitByLength(str, 10);

      expect(parts).toEqual(["a"]);

      expect(parts.join("")).toEqual(str);
    });

    it("4", async () => {
      const { splitByLength } = await getLib();

      const str = "12345678";

      const parts = splitByLength(str, 4);

      expect(parts).toEqual(["1234", "5678"]);

      expect(parts.join("")).toEqual(str);
    });
  });

  describe(`aes-cbc-${isNode ? "node" : "browser"}.js encryption`, () => {
    it("encrypt & decrypt", async () => {
      const { generateKey, encryptMessage, decryptMessage } = await getLib();

      const key = await generateKey();

      const encrypted = await encryptMessage(key, message);

      expect(encrypted).toContain(":[v1:");
      expect(encrypted).toContain("::");
      expect(encrypted).toContain(":]:");

      const decrypted = await decryptMessage(key, encrypted);

      expect(decrypted).toEqual(message);
    });

    it("encrypt & decrypt fixed iv - execute in browser and node", async () => {
      const { encryptMessage, decryptMessage } = await getLib();

      const key = "17sfLCu35124RKPPNDVczmQE49T2oCwm08cKhmL5DL4=";

      const encrypted = await encryptMessage(key, message, {
        iv: "YP/vPE/DnAcHHMZTke6/Ag==",
      });

      const expected = `:[v1:c0ad3::YP/vPE/DnAcHHMZTke6/Ag==::
q0IxJzScLdYktc1C0pP7/PtMk6ykdgH4k21S4KDNc2S4C3Dg4l7LONIgLumIcBEpnmIVkmlebLtObWo6GfQwdUmjSoqRMBuRFnWm0rsWM2nBcb
Fth3y1p9F2hWA3iKZD3fGeLUSfGHF0RD0MJ4YBZcBqnuSkVN8rgqOLdf77mka6i4r1Ie7TByDNpohs7sKgGSGaulKxwwYgu9GCjYvuRLy0UQjX
Lw0dkx7P+8K8/JVDlyCB5H5MfXGl7e3r+GYCCH98PM3s0Y7HvaGDyAsxyjIRIdOmeZEo7xzE59W0M0EV3n5ytXDM/GqkZkK4Y0G7BBxw+Q7CEr
3PNACmvDGnSLlm6PJO7HUQmil1obHPWwsIMUKMR20qSR0Cr7Bj5Eyzx04nrkB+8fTSfR1xve6tfg==:]:`;

      expect(encrypted).toEqual(expected);

      const decrypted = await decryptMessage(key, encrypted);

      expect(decrypted).toEqual(message);
    });

    it("decrypt fixed message - encrypted in browser", async () => {
      const { decryptMessage } = await getLib();

      const key = "Ujfyy2C373S7kocvp6DQkue+fyKMcPwlO3pfm2ZCM8s=";

      const encrypted = `:[v1:c0ad3::+MhyaHrk2M1X3gWO0fZbuA==::
NEdPQIh0VbAPHrnZr/6FSkWUPM7hBwk821/ufG0skHxK/bfAtu+yGMorgGxUuZT8QYw/TyuaDI8Xoz5HGh+cgCCHfRW2ebZc/1XwrX7pjioiCR
iKYd3lpv/oPW54ZgdoUl0VxlPgJcMIaMet0Qk9whaWiR1nouqIkpKznbkU/i0182X4XghaUbHJySOSEAF5sc1grWmY4yW6OgDc/IYT0aS4s4HH
Svx0ZMVSlGqxCHOhDTzxSLIesV6qAnbhY3vVEC8M4aBMnfPZhOi6P0pue2Pw04aMHV6M4KmDjw5xdIwj0atX/2p551ulA4G7Q299AzxPkIlLLo
EEgeebWM5587QiR/eiZi/uCtEOhZGj4dIU/JkhJhzEF2Dkrj6Da6XXCZZ9Vb9ylJfTIt7lNcxv4A==:]:`;

      const expected = message;

      const decrypted = await decryptMessage(key, encrypted);

      expect(decrypted).toEqual(expected);
    });

    it("decrypt fixed message - encrypted in node", async () => {
      const { decryptMessage } = await getLib();

      const key = "ZC1+LPMZ5Xcsm5yN46tSbv+q01Jgr1EBxpBA8h046zk=";

      const encrypted = `:[v1:c0ad3::cnglp+hcV7rlNNDmDrbXag==::
CIilFcpjqsgzItf6VnLOPrcwHwR3wJebiNChv0lvFsqG4XsLzzFicThZrkQCsOs9TB8YWpKIvJAYWJYrMbEGh0k+7EunpENI+PdyWtXjOo6fO3
y5dbCxTYJgePuE+9BWDpyvVrXm59SnWGCcjXhVjXpih8XDwTfAN9IQVS2R1BK+YBnpL0ZpQdJlzgUVxEtXNm6zLo/+hDFiThZSeiwWuigYolLA
m/zNm3C2ScKI/ZpIHf9D6mU9m8RfbmoYyn5JpaKoZ0DzouSGINwsrDo1TIZG4MBqntYA3yMATdpmliolW8R5MdeieZ0P/1FDmhNwb4nFVaoCFZ
0UxsuDLM0pQb49AgZYSkFmEusDdu9yNMLap8NLexj6xAOQDsdC1UIenFWCKuuCtqSxtuQqXG134g==:]:`;

      const expected = message;

      const decrypted = await decryptMessage(key, encrypted);

      expect(decrypted).toEqual(expected);
    });
  });
});
