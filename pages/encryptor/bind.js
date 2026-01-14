import { generateKey, encryptMessage, decryptMessage } from "./aes-cbc-browser.js";

const parent = document.querySelector("#encryptor");
const generateButton = parent.querySelector(".generate");
const inputKey = parent.querySelector(".key");
const show = parent.querySelector(".show");
const inputMessage = parent.querySelector(".message");
const inputEncrypted = parent.querySelector(".encrypted");
const inputDecrypted = parent.querySelector(".decrypted");
const encryptButton = parent.querySelector(".encrypt");
const decryptButton = parent.querySelector(".decrypt");
const copyBtn = parent.querySelector(".copy-btn");
const copyLinkBtn = parent.querySelector(".copy-link-btn");
const sharingLink = parent.querySelector(".sharing-link");
const linkRow = parent.querySelector(".link-row");
const loremBtn = parent.querySelector(".lorem-btn");
const form = parent.querySelector("form");

const updateCopyBtnVisibility = () => {
  copyBtn.style.display = inputEncrypted.value.trim() ? "inline-block" : "none";
};

const updateURL = (encryptedValue) => {
  const url = new URL(window.location.href);
  if (encryptedValue) {
    url.searchParams.set("enc", encryptedValue);
    sharingLink.href = url.toString();
    sharingLink.textContent = "Direct link to this message";
    linkRow.style.display = "flex";
  } else {
    url.searchParams.delete("enc");
    sharingLink.href = "#";
    sharingLink.textContent = "";
    linkRow.style.display = "none";
  }
  window.history.replaceState({}, "", url.toString());
};

const doEncrypt = async () => {
  try {
    const key = inputKey.value.trim();
    const msg = inputMessage.value.trim();

    if (!key || !msg) {
      inputEncrypted.value = "";
      updateCopyBtnVisibility();
      updateURL("");
      return;
    }

    const humanReadable = await encryptMessage(key, msg);
    inputEncrypted.value = humanReadable;
    updateCopyBtnVisibility();
    updateURL(humanReadable);
  } catch (e) {
    console.error("Encryption error:", e);
  }
};

inputMessage.addEventListener("input", doEncrypt);
inputKey.addEventListener("input", doEncrypt);
inputEncrypted.addEventListener("input", updateCopyBtnVisibility);
inputEncrypted.addEventListener("focus", () => inputEncrypted.select());
inputEncrypted.addEventListener("click", () => inputEncrypted.select());
form.addEventListener("submit", (e) => {
  e.preventDefault();
  return false;
});

show.addEventListener("click", () => {
  const secure = inputKey.type === "password";
  inputKey.type = secure ? "text" : "password";
  show.textContent = secure ? "hide" : "show";
});

generateButton.addEventListener("click", async () => {
  try {
    const base64Key = await generateKey();
    inputKey.value = base64Key;
  } catch (e) {
    alert("Error generating key: " + e.message);
  }
});
encryptButton.addEventListener("click", doEncrypt);

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
loremBtn.addEventListener("click", () => {
  inputMessage.value = `Lorem ipsum dolor sit amet, consectetur adipiscing elit.
Etiam molestie pulvinar consequat.
Phasellus vitae dolor fringilla, elementum risus sit amet, vulputate lorem.`;
});

copyBtn.addEventListener("click", () => {
  inputEncrypted.select();
  document.execCommand("copy");
  const originalText = copyBtn.textContent;
  copyBtn.textContent = "✅ Copied!";
  setTimeout(() => {
    copyBtn.textContent = originalText;
  }, 2000);
});

copyLinkBtn.addEventListener("click", () => {
  const text = sharingLink.textContent;
  const dummy = document.createElement("textarea");
  document.body.appendChild(dummy);
  dummy.value = text;
  dummy.select();
  document.execCommand("copy");
  document.body.removeChild(dummy);

  const originalText = copyLinkBtn.textContent;
  copyLinkBtn.textContent = "✅ Copied!";
  setTimeout(() => {
    copyLinkBtn.textContent = originalText;
  }, 2000);
});

// On Load: Check if 'enc' param exists
const params = new URLSearchParams(window.location.search);
const encParam = params.get("enc");
if (encParam) {
  inputEncrypted.value = encParam;
  updateCopyBtnVisibility();
  updateURL(encParam);
}
