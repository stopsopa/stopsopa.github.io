/**
 NODE_API_PORT=4273 /bin/bash jasmine/test.sh \
      --stay \
      --env .env \
      --filter "grep aes.jasmine.unit" 

      see more in xx.cjs
 */

// import * as browserAes from "./aes-cbc-browser.js";

// Instead of wrapping everything in an async IIFE, we'll handle the dynamic imports differently
const isNode = typeof global !== "undefined" && Object.prototype.toString.call(global.process) === "[object process]";

// Set up a promise that will resolve to the correct lib
const getLib = async () => {
  let lib;

  if (isNode) {
    // Import the module that should be excluded from bundling
    lib = await import("./aes-cbc-node.js");
  } else {
    lib = await import("./aes-cbc-browser.js");
  }

  var e = lib;

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
  // Store lib once we've loaded it
  let lib;

  // Use beforeAll to load the lib before any tests run
  beforeAll(async () => {
    lib = await getLib();
  });

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

  describe("aes-cbc-browser encryption", () => {
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

    it("encrypt & decrypt fixed key", async () => {
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
  });
});
