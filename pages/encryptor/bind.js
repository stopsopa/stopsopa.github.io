import { generateKey, encryptMessage, decryptMessage } from "./aes-cbc-browser.js";

const parent = document.querySelector("#encryptor");
const generateButton = parent.querySelector(".generate");
const inputKey = parent.querySelector(".key");
const inputMessage = parent.querySelector(".message");
const inputEncrypted = parent.querySelector(".encrypted");
const inputDecrypted = parent.querySelector(".decrypted");
const encryptButton = parent.querySelector(".encrypt");
const decryptButton = parent.querySelector(".decrypt");

generateButton.addEventListener("click", async () => {
  try {
    const base64Key = await generateKey();
    inputKey.value = base64Key;
  } catch (e) {
    alert("Error generating key: " + e.message);
  }
});
encryptButton.addEventListener("click", async () => {
  try {
    const humanReadable = await encryptMessage(inputKey.value, inputMessage.value);

    inputEncrypted.value = humanReadable;
  } catch (e) {
    alert("Error generating key: " + e.message);
  }
});

decryptButton.addEventListener("click", async () => {
  try {
    const decrypted = await decryptMessage(inputKey.value, inputEncrypted.value);

    inputDecrypted.value = decrypted;
  } catch (e) {
    console.log(e);
    console.log({
      message: e.message,
      stack: e.stack.split("\n").slice(0, 5).join("\n"),
    });
    inputDecrypted.value = `Error: ${e.message}\n\nstack:\n${e.stack}`;
  }
});
