import { caesarCypher, alpha, alphaLength } from "./moduleCaesarCypher.js";

const parent = document.querySelector("#encryptor");

const inputKey = parent.querySelector(".key input");
const curkey = parent.querySelector(".key .curkey");
const maxIndex = parent.querySelector(".key .maxIndex");
const up = parent.querySelector(".key .up");
const down = parent.querySelector(".key .down");

const alphabetInput = document.querySelector(".alphabet input");

const inputMessage = parent.querySelector(".message");
const inputEncrypted = parent.querySelector(".encrypted");
const inputDecrypted = parent.querySelector(".decrypted");
const encryptButton = parent.querySelector(".encrypt");
const decryptButton = parent.querySelector(".decrypt");

maxIndex.innerText = alphaLength;
alphabetInput.value = alpha;

let defaultKey = 8;
function setCurrentKey(key) {
  inputKey.value = key;
  curkey.innerText = key;
  // update url GET 'key' param
  const url = new URL(window.location);
  url.searchParams.set("key", key);
  window.history.replaceState({}, "", url);
  // save to localStorage
  localStorage.setItem("caesarKey", key);
}
inputKey.addEventListener("focus", () => inputKey.select());
inputKey.addEventListener("input", (e) => {
  const key = parseInt(e.target.value, 10);
  if (!isNaN(key)) {
    setCurrentKey(key);
  }
});
up.addEventListener("click", () => {
  const key = parseInt(inputKey.value, 10);
  if (!isNaN(key)) {
    const newKey = (key + 1) % alphaLength;
    setCurrentKey(newKey);
  }
});
down.addEventListener("click", () => {
  const key = parseInt(inputKey.value, 10);
  if (!isNaN(key)) {
    const newKey = (key - 1 + alphaLength) % alphaLength;
    setCurrentKey(newKey);
  }
});

// if there is GET key value specified then use it to setup defaultKey
const urlParams = new URLSearchParams(window.location.search);
const keyParam = urlParams.get("key");
if (keyParam) {
  const parsedKey = parseInt(keyParam, 10);
  if (!isNaN(parsedKey)) {
    defaultKey = parsedKey;
  }
}

// also try to get default value from localStorage from key 'caesarKey'
const localStorageKey = localStorage.getItem("caesarKey");
if (localStorageKey) {
  const parsedKey = parseInt(localStorageKey, 10);
  if (!isNaN(parsedKey)) {
    defaultKey = parsedKey;
  }
}

setCurrentKey(defaultKey);

encryptButton.addEventListener("click", async () => {
  try {
    inputEncrypted.value = caesarCypher(parseInt(inputKey.value, 10), inputMessage.value);
  } catch (e) {
    alert("Error generating key: " + e.message);
  }
});

inputMessage.addEventListener("input", (e) => {
  inputDecrypted.classList.remove("bggreen");
  inputDecrypted.classList.remove("bgred");
});

decryptButton.addEventListener("click", async () => {
  try {
    const decrypted = caesarCypher(-parseInt(inputKey.value, 10), inputEncrypted.value);

    if (decrypted === inputMessage.value) {
      inputDecrypted.classList.remove("bgred");
      inputDecrypted.classList.add("bggreen");
    } else {
      inputDecrypted.classList.remove("bggreen");
      inputDecrypted.classList.add("bgred");
    }

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
