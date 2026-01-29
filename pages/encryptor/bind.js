import { generateKey, encryptMessage, decryptMessage } from "./aes-cbc-browser.js";

const parent = document.querySelector("#encryptor");
const generateButton = parent.querySelector(".generate");
const inputKey = parent.querySelector(".key");
const show = parent.querySelector(".show");
const clearKeyBtn = parent.querySelector(".clear");
const inputMessage = parent.querySelector(".message");
const inputEncrypted = parent.querySelector(".encrypted");
const inputDecrypted = parent.querySelector(".decrypted");
const zeroMd = parent.querySelector(".decrypted-md");

const encryptButton = parent.querySelector(".encrypt");
const decryptButton = parent.querySelector(".decrypt");
const copyBtn = parent.querySelector(".copy-btn");
const copyLinkBtn = parent.querySelector(".copy-link-btn");
const sharingLink = parent.querySelector(".sharing-link");
const linkGroup = parent.querySelector(".link-group");
const loremBtn = parent.querySelector(".lorem-btn");
const form = parent.querySelector("form");

let highlightAnimationId = null;
const highlightDecrypted = () => {
  const target = document.querySelector("#d");
  if (!target || !inputDecrypted.value.trim()) return;

  target.scrollIntoView({ behavior: "smooth", block: "center" });

  // Wait for smooth scroll to finish before starting animation
  setTimeout(() => {
    // Stop any existing animation
    if (highlightAnimationId) {
      clearInterval(highlightAnimationId);
    }

    // Manual fade effect using direct style manipulation
    let opacity = 0.8;
    const startTime = Date.now();
    const duration = 3000; // 3 seconds

    // Set initial red glow
    inputDecrypted.style.boxShadow = `0 0 20px 8px rgba(255, 0, 0, ${opacity}), 0 0 0 4px rgba(255, 0, 0, 0.6)`;
    inputDecrypted.style.borderColor = "#ff0000";

    highlightAnimationId = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = elapsed / duration;

      if (progress >= 1) {
        // Animation complete - reset to default
        clearInterval(highlightAnimationId);
        highlightAnimationId = null;
        inputDecrypted.style.boxShadow = "";
        inputDecrypted.style.borderColor = "";
      } else {
        // Calculate fading opacity
        const currentOpacity = 0.8 * (1 - progress);
        const ringOpacity = 0.6 * (1 - progress);
        inputDecrypted.style.boxShadow = `0 0 20px 8px rgba(255, 0, 0, ${currentOpacity}), 0 0 0 4px rgba(255, 0, 0, ${ringOpacity})`;

        // Fade border color
        const redValue = Math.round(255 * (1 - progress) + 187 * progress); // 187 is #bbb in decimal
        inputDecrypted.style.borderColor = `rgb(${redValue}, ${Math.round(187 * progress)}, ${Math.round(
          187 * progress
        )})`;
      }
    }, 16); // ~60fps
  }, 600);
};

const updateDecryptedOutput = (val) => {
  inputDecrypted.value = val;
  if (val) {
    const script = document.createElement("script");
    script.type = "text/markdown";
    script.textContent = val;
    zeroMd.innerHTML = "";
    zeroMd.appendChild(script);
  } else {
    zeroMd.innerHTML = "";
  }
};

const STORAGE_KEY = "encryptor_key";

const updateCopyBtnVisibility = () => {
  copyBtn.style.display = inputEncrypted.value.trim() ? "inline-block" : "none";
};

const updateURL = (encryptedValue) => {
  const url = new URL(window.location.href);
  if (encryptedValue) {
    url.searchParams.set("enc", encryptedValue);
    sharingLink.href = url.toString();
    sharingLink.textContent = "Direct link to this message";
    linkGroup.style.display = "flex";
  } else {
    url.searchParams.delete("enc");
    sharingLink.href = "#";
    sharingLink.textContent = "";
    linkGroup.style.display = "none";
  }
  window.history.replaceState({}, "", url.toString());
};

const doDecrypt = async () => {
  const key = inputKey.value.trim();
  const enc = inputEncrypted.value.trim();

  if (!key || !enc) {
    updateDecryptedOutput("");
    return;
  }

  try {
    const decrypted = await decryptMessage(key, enc);
    updateDecryptedOutput(decrypted);
  } catch (e) {
    // Silently fail during typing to avoid noise
    updateDecryptedOutput("");
  }
};

const doEncrypt = async () => {
  const key = inputKey.value.trim();
  const msg = inputMessage.value.trim();

  if (!key || !msg) {
    // If msg is empty but key is present, we might still want to decrypt if enc is present
    // but the rule says do B then A. If B can't run, let's at least ensure URL is clean if msg is empty
    // HOWEVER: don't clear inputEncrypted here because user might have just pasted something there
    // and is now pasting the key.
    await doDecrypt();
    return;
  }

  try {
    const humanReadable = await encryptMessage(key, msg);
    if (inputEncrypted.value !== humanReadable) {
      inputEncrypted.value = humanReadable;
      updateCopyBtnVisibility();
      updateURL(humanReadable);
    }
    // Rule: immediately when encryption suceed do A
    await doDecrypt();
  } catch (e) {
    console.error("Encryption error:", e);
  }
};

inputMessage.addEventListener("input", () => {
  if (!inputMessage.value.trim()) {
    inputEncrypted.value = "";
    updateCopyBtnVisibility();
    updateURL("");
  }
  doEncrypt();
});
inputKey.addEventListener("input", async () => {
  const wasEmpty = !inputDecrypted.value.trim();
  localStorage.setItem(STORAGE_KEY, inputKey.value);
  await doEncrypt();
  // If we just decrypted something that was previously empty (e.g. key finally matched URL param), scroll to it
  if (wasEmpty && inputDecrypted.value.trim() && new URLSearchParams(window.location.search).has("enc")) {
    highlightDecrypted();
  }
});
inputEncrypted.addEventListener("input", () => {
  const val = inputEncrypted.value.trim();
  updateCopyBtnVisibility();
  updateURL(val);
  doDecrypt();
});
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

clearKeyBtn.addEventListener("click", () => {
  localStorage.removeItem(STORAGE_KEY);
  inputKey.value = "";
  doEncrypt();
});

generateButton.addEventListener("click", async () => {
  try {
    const base64Key = await generateKey();
    inputKey.value = base64Key;
    localStorage.setItem(STORAGE_KEY, base64Key);
    doEncrypt();
  } catch (e) {
    alert("Error generating key: " + e.message);
  }
});

encryptButton.addEventListener("click", doEncrypt);

decryptButton.addEventListener("click", async () => {
  const key = inputKey.value.trim();
  const enc = inputEncrypted.value.trim();
  if (!key || !enc) return;
  try {
    const decrypted = await decryptMessage(key, enc);
    updateDecryptedOutput(decrypted);
  } catch (e) {
    updateDecryptedOutput(`Error: ${e.message}\n\nstack:\n${e.stack}`);
  }
});

loremBtn.addEventListener("click", () => {
  inputMessage.value = `Lorem ipsum dolor sit amet, consectetur adipiscing elit.
Etiam molestie pulvinar consequat.
Phasellus vitae dolor fringilla, elementum risus sit amet, vulputate lorem.`;
  doEncrypt();
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
  const text = sharingLink.href;
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

// Initialization
(async () => {
  // 1. Load key from localStorage
  const savedKey = localStorage.getItem(STORAGE_KEY);
  if (savedKey) {
    inputKey.value = savedKey;
  }

  // 2. Load from URL param if present
  const params = new URLSearchParams(window.location.search);
  const encParam = params.get("enc");
  if (encParam) {
    inputEncrypted.value = encParam;
    updateCopyBtnVisibility();
    updateURL(encParam);
    // Task A: Decrypt what's in Encrypted Output
    await doDecrypt();

    // If decryption was successful (textarea not empty), scroll and highlight
    if (inputDecrypted.value.trim()) {
      highlightDecrypted();
    }
  } else {
    // If no URL param, check if there's an input message to encrypt (Task B then A)
    if (inputMessage.value.trim()) {
      await doEncrypt();
    }
  }
})();
