/**
 * Node.js implementation of AES-CBC encryption/decryption
 * Using Node.js crypto module instead of browser's SubtleCrypto
 */

const crypto = require("crypto");

function encodeMessage(message) {
  return Buffer.from(message, "utf8");
}

export function splitByLength(str, length) {
  const result = [];
  for (let i = 0; i < str.length; i += length) {
    result.push(str.slice(i, i + length));
  }
  return result;
}

export async function hashSHA256(message) {
  const hash = crypto.createHash("sha256");
  hash.update(message);
  return hash.digest("hex");
}

export async function encryptMessage(base64Key, message, opt) {
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
    // For AES-CBC we need 16 bytes IV
    iv = crypto.randomBytes(16);
  }

  const key = await importKeyFromBase64(base64Key);

  // Create cipher using key and iv
  const cipher = crypto.createCipheriv("aes-256-cbc", key, Buffer.from(iv));

  // Encrypt the message
  let ciphertext = Buffer.concat([cipher.update(encoded), cipher.final()]);

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

  const iv = Buffer.from(fromHuman(ivHuman));
  const ciphertext = Buffer.from(fromHuman(ciphertextHuman));

  // Create decipher
  const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);

  // Decrypt the ciphertext
  let decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);

  const message = decrypted.toString("utf8");

  const hash = await hashSHA256(message);

  const cut = hash.substring(0, 5);

  if (cut !== hashPart) {
    throw new Error(`decryptMessage error: hash does not match, original >${hashPart}<, calculated >${cut}<`);
  }

  return message;
}

async function exportKeyToBase64(key) {
  return key.toString("base64");
}

async function importKeyFromBase64(base64Key) {
  return Buffer.from(base64Key, "base64");
}

/**
 * Convert buffer to a human-readable Base64 string.
 */
export function forHuman(buffer) {
  return Buffer.from(buffer).toString("base64");
}

/**
 * Convert a human-readable Base64 string back to buffer.
 */
export function fromHuman(humanReadable) {
  return Buffer.from(humanReadable, "base64");
}

export const generateKey = async () => {
  // Generate a random 32-byte key (256 bits for AES-256)
  const key = crypto.randomBytes(32);
  const base64Key = await exportKeyToBase64(key);
  return base64Key;
};
