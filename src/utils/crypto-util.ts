// crypto-util.ts
// AES-GCM encryption of API payloads with the browser Web Crypto API.
// The envelope { iv, data } is base64 text, so it can be sent as JSON.
//
//   const envelope = await encryptPayload(body, encryptionKey);
//   const result = await decryptResponse<UserType>(response, encryptionKey);
//
// The key text must have at least 32 characters (the first 32 are used).

const KEY_LENGTH = 32;
const IV_LENGTH = 12;

export interface EncryptedEnvelope {
  iv: string;
  data: string;
}

const cachedKeys = new Map<string, CryptoKey>();

/** Imports (once) the AES key for a key text. */
async function readCryptoKey(keyText: string): Promise<CryptoKey> {
  const cachedKey = cachedKeys.get(keyText);
  if (cachedKey) {
    return cachedKey;
  }
  const encoder = new TextEncoder();
  const encodedKey = encoder.encode(keyText);
  const rawKey = encodedKey.slice(0, KEY_LENGTH);
  const algorithm = { name: "AES-GCM" };
  const usages: KeyUsage[] = ["encrypt", "decrypt"];
  const importedKey = await crypto.subtle.importKey("raw", rawKey, algorithm, false, usages);
  cachedKeys.set(keyText, importedKey);
  return importedKey;
}

/** Bytes -> base64 text. */
export function bytesToBase64(bytes: Uint8Array): string {
  let binaryText = "";
  for (const byte of bytes) {
    binaryText += String.fromCharCode(byte);
  }
  return btoa(binaryText);
}

/** Base64 text -> bytes. */
export function base64ToBytes(base64Text: string): Uint8Array<ArrayBuffer> {
  const binaryText = atob(base64Text);
  const bytes = new Uint8Array(binaryText.length);
  for (let index = 0; index < binaryText.length; index += 1) {
    bytes[index] = binaryText.charCodeAt(index);
  }
  return bytes;
}

/** Encrypts any JSON value. */
export async function encryptPayload(payload: unknown, keyText: string): Promise<EncryptedEnvelope> {
  const key = await readCryptoKey(keyText);
  const emptyIv = new Uint8Array(IV_LENGTH);
  const iv = crypto.getRandomValues(emptyIv);
  const encoder = new TextEncoder();
  const payloadText = JSON.stringify(payload);
  const encodedPayload = encoder.encode(payloadText);
  const algorithm = { name: "AES-GCM", iv: iv };
  const encryptedBuffer = await crypto.subtle.encrypt(algorithm, key, encodedPayload);
  const encryptedBytes = new Uint8Array(encryptedBuffer);
  return { iv: bytesToBase64(iv), data: bytesToBase64(encryptedBytes) };
}

/** Decrypts an envelope back into the JSON value. */
export async function decryptResponse<TResult>(envelope: EncryptedEnvelope, keyText: string): Promise<TResult> {
  const key = await readCryptoKey(keyText);
  const iv = base64ToBytes(envelope.iv);
  const encryptedBytes = base64ToBytes(envelope.data);
  const algorithm = { name: "AES-GCM", iv: iv };
  const decryptedBuffer = await crypto.subtle.decrypt(algorithm, key, encryptedBytes);
  const decoder = new TextDecoder();
  const decryptedText = decoder.decode(decryptedBuffer);
  return JSON.parse(decryptedText) as TResult;
}

/** true when a value looks like { iv: string, data: string }. */
export function isEncryptedEnvelope(value: unknown): value is EncryptedEnvelope {
  if (!value || typeof value !== "object") {
    return false;
  }
  const record = value as Record<string, unknown>;
  return typeof record.iv === "string" && typeof record.data === "string";
}
