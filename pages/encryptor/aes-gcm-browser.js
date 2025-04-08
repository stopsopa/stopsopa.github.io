/**
 * from:
 *      https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/encrypt#aes-gcm_2
 *      https://mdn.github.io/dom-examples/web-crypto/encrypt-decrypt/index.html
 */

const enc = new TextEncoder();
const dec = new TextDecoder();

const isSubtleCryptoAvailable = window.isSecureContext && !!window.crypto?.subtle;

function isAvailable() {
  if (!isSubtleCryptoAvailable) {
    throw new Error(`Web Crypto API is not available in this context.`);
  }
}

function encodeMessage(message) {
  return enc.encode(message);
}

export function splitByLength(str, length) {
  const result = [];
  for (let i = 0; i < str.length; i += length) {
    result.push(str.slice(i, i + length));
  }
  return result;
}

export async function hashSHA256(message) {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  return hashHex;
}

export async function encryptMessage(base64Key, message, opt) {
  isAvailable();

  let { columns, iv } = {
    columns: 110,
    ...opt,
  };

  if (typeof columns !== "number" || columns < 10) {
    throw new Error(`encryptMessage error: columns is not a number`);
  }

  if (typeof base64Key === "undefined") {
    throw new Error(`encryptMessage error: base64Key is undefined`);
  }
  if (typeof message !== "string") {
    throw new Error(`encryptMessage error: message is not a string`);
  }
  const encoded = encodeMessage(message);

  if (iv) {
    console.log("iv", iv);
    
    iv = fromHuman(iv);
  } else {
    // IMPORTANT: The iv must never be reused with a given key.
    iv = window.crypto.getRandomValues(new Uint8Array(12));
  }


  const key = await importKeyFromBase64(base64Key);

  const ciphertext = await window.crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: iv,
    },
    key,
    encoded
  );

  const hash = await hashSHA256(message);

  const encrypted =
    ":[v1:" +
    hash.substring(0, 5) +
    "::" +
    forHuman(iv) +
    "::\n" +
    splitByLength(forHuman(ciphertext), columns).join("\n") +
    ":]:";

  return encrypted;
}

export async function decryptMessage(base64Key, humanReadable) {
  isAvailable();

  if (typeof base64Key !== "string") {
    throw new Error(`decryptMessage error: base64Key is not a string`);
  }
  if (typeof humanReadable !== "string") {
    throw new Error(`decryptMessage error: humanReadable is not a string`);
  }

  const key = await importKeyFromBase64(base64Key);

  if (!(humanReadable.indexOf("::") > 0)) {
    throw new Error(`decryptMessage error: humanReadable is not in the correct format`);
  }

  if (humanReadable.startsWith(":[v1:") === false) {
    throw new Error(`decryptMessage error: humanReadable does not start with ":[v1:"`);
  }

  if (humanReadable.endsWith(":]:") === false) {
    throw new Error(`decryptMessage error: humanReadable does not end with ":]:"`);
  }

  // cut off the ":[v1:" and ":]:"
  humanReadable = humanReadable.substring(5, humanReadable.length - 3);

  const parts = humanReadable.split("::");

  if (!Array.isArray(parts) || parts.length !== 3) {
    throw new Error(`decryptMessage error: humanReadable is not in the correct format`);
  }

  const [hashPart, ivHuman, ciphertextHuman] = parts;

  if (hashPart.length < 5) {
    throw new Error(`decryptMessage error: hashPart is too short`);
  }

  if (ivHuman.length < 5) {
    throw new Error(`decryptMessage error: ivHuman is too short`);
  }

  if (ciphertextHuman.length < 5) {
    throw new Error(`decryptMessage error: ciphertextHuman is too short`);
  }

  const iv = fromHuman(ivHuman);

  const ciphertext = fromHuman(ciphertextHuman);

  let decrypted = await window.crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv,
    },
    key,
    ciphertext
  );

  const message = dec.decode(decrypted);

  const hash = await hashSHA256(message);

  const cut = hash.substring(0, 5);

  if (cut !== hashPart) {
    throw new Error(`decryptMessage error: hash does not match, original >${hashPart}<, calculated >${cut}<`);
  }

  return message;
}

async function exportKeyToBase64(key) {
  const exportedKey = await window.crypto.subtle.exportKey("raw", key);

  const string = String.fromCharCode(...new Uint8Array(exportedKey));

  return btoa(string);
}

async function importKeyFromBase64(base64Key) {
  const rawKey = Uint8Array.from(atob(base64Key), (c) => c.charCodeAt(0));

  return window.crypto.subtle.importKey("raw", rawKey, { name: "AES-GCM" }, true, ["encrypt", "decrypt"]);
}

/**
 * Convert ciphertext to a human-readable Base64 string.
 * https://base64.guru/learn/base64-characters
 */
export function forHuman(ciphertext) {
  const string = String.fromCharCode(...new Uint8Array(ciphertext));

  const base64 = btoa(string);

  return base64;
}

/**
 * Convert a human-readable Base64 string back to ciphertext.
 */
export function fromHuman(humanReadable) {
  const raw = atob(humanReadable);
  const buffer = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) {
    buffer[i] = raw.charCodeAt(i);
  }
  return buffer.buffer;
}

export const generateKey = async () => {
  isAvailable();

  const key = await window.crypto.subtle.generateKey(
    {
      name: "AES-GCM",
      length: 256,
    },
    true,
    ["encrypt", "decrypt"]
  );

  const base64Key = await exportKeyToBase64(key);

  return base64Key;
};
