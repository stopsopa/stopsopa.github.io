import crypto from 'crypto';

const enc = new TextEncoder();
const dec = new TextDecoder();

export function isAvailable() {
  if (!crypto || !crypto.webcrypto) {
    throw new Error(`Web Crypto API is not available in this context.`);
  }
}

export function encodeMessage(message) {
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
  const hashBuffer = await crypto.webcrypto.subtle.digest("SHA-256", data);
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
    iv = fromHuman(iv);
  } else {
    iv = crypto.randomBytes(12);
  }

  const key = await importKeyFromBase64(base64Key);

  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([cipher.update(encoded), cipher.final()]);
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

  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);

  const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);

  const message = dec.decode(decrypted);

  const hash = await hashSHA256(message);

  const cut = hash.substring(0, 5);

  if (cut !== hashPart) {
    throw new Error(`decryptMessage error: hash does not match, original >${hashPart}<, calculated >${cut}<`);
  }

  return message;
}

export async function exportKeyToBase64(key) {
  const exportedKey = await crypto.webcrypto.subtle.exportKey("raw", key);
  const base64Key = Buffer.from(exportedKey).toString("base64");
  return base64Key;
}

export async function importKeyFromBase64(base64Key) {
  const rawKey = Buffer.from(base64Key, "base64");
  return crypto.webcrypto.subtle.importKey(
    "raw",
    rawKey,
    { name: "AES-GCM" },
    true,
    ["encrypt", "decrypt"]
  );
}

export function forHuman(ciphertext) {
  return ciphertext.toString("base64");
}

export function fromHuman(humanReadable) {
  return Buffer.from(humanReadable, "base64");
}

export async function generateKey() {
  isAvailable();

  const key = await crypto.webcrypto.subtle.generateKey(
    {
      name: "AES-GCM",
      length: 256,
    },
    true,
    ["encrypt", "decrypt"]
  );

  const base64Key = await exportKeyToBase64(key);

  return base64Key;
}