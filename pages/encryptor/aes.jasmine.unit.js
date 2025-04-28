/**
 NODE_API_PORT=4273 /bin/bash jasmine/test.sh \
      --stay \
      --env .env \
      --filter "grep aes.jasmine.unit" 

      see more in xx.cjs
 */

import * as browserAes from "./aes-cbc-browser.js";

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

  describe("aes-cbc-browser", () => {
    it("aes-cbc-browser encrypt & decrypt", async () => {
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

  describe("aes-cbc-browser", () => {
    it("aes-cbc-browser encrypt & decrypt", async () => {
      const key = await generateKey();

      const encrypted = await encryptMessage(key, message);

      expect(encrypted).toContain(":[v1:");

      expect(encrypted).toContain("::");

      expect(encrypted).toContain(":]:");

      const decrypted = await decryptMessage(key, encrypted);

      expect(decrypted).toEqual(message);
    });

    it("aes-cbc-browser encrypt & decrypt fixed key", async () => {
      const key = "17sfLCu35124RKPPNDVczmQE49T2oCwm08cKhmL5DL4=";

      const encrypted = await encryptMessage(key, message, {
        iv: "YP/vPE/DnAcHHMZTke6/Ag==",
      });

      console.log("encrypted", encrypted);

      const expected = `:[v1:c0ad3::YP/vPE/DnAcHHMZTke6/Ag==::
q0IxJzScLdYktc1C0pP7/PtMk6ykdgH4k21S4KDNc2S4C3Dg4l7LONIgLumIcBEpnmIVkmlebLtObWo6GfQwdUmjSoqRMBuRFnWm0rsWM2nBcb
Fth3y1p9F2hWA3iKZD3fGeLUSfGHF0RD0MJ4YBZcBqnuSkVN8rgqOLdf77mka6i4r1Ie7TByDNpohs7sKgGSGaulKxwwYgu9GCjYvuRLy0UQjX
Lw0dkx7P+8K8/JVDlyCB5H5MfXGl7e3r+GYCCH98PM3s0Y7HvaGDyAsxyjIRIdOmeZEo7xzE59W0M0EV3n5ytXDM/GqkZkK4Y0G7BBxw+Q7CEr
3PNACmvDGnSLlm6PJO7HUQmil1obHPWwsIMUKMR20qSR0Cr7Bj5Eyzx04nrkB+8fTSfR1xve6tfg==:]:`;

      console.log("expected", expected);

      expect(expected).toEqual(encrypted);

      const decrypted = await decryptMessage(key, encrypted);

      expect(decrypted).toEqual(message);
    });
  });
});
