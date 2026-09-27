/// <reference types="node" />

import { Transform } from "stream";

export interface CrackResult {
  /** Recovered keyword, uppercase */
  key: string;
  /** Ciphertext decrypted with the recovered key */
  text: string;
}

export interface CrackOptions {
  /** Longest key length to try (1 - 100). Default 20. */
  maxKeyLength?: number;
}

/**
 * Encrypt a string using Vigenère Cipher.
 * @param str Plaintext, max 1000 characters.
 * @param key Keyword, letters A-Z (any case).
 */
export function encryptString(str: string, key: string): string;

/**
 * Decrypt a string using Vigenère Cipher.
 * @param str Ciphertext, max 1000 characters.
 * @param key Keyword used during encryption.
 */
export function decryptString(str: string, key: string): string;

/**
 * Recover the key and plaintext of English ciphertext without the key.
 * Works best with 100+ letters of ciphertext.
 * @param str Ciphertext, max 1000 characters.
 */
export function crack(str: string, options?: CrackOptions): CrackResult;

/**
 * Encrypt a buffer using Vigenère Cipher.
 * @param buffer Input buffer, max 1000 bytes.
 * @param key Keyword, letters A-Z (any case).
 */
export function encrypt(buffer: Buffer, key: string): Buffer;

/**
 * Decrypt a buffer using Vigenère Cipher.
 * @param buffer Input buffer, max 1000 bytes.
 * @param key Keyword used during encryption.
 */
export function decrypt(buffer: Buffer, key: string): Buffer;

/** Transform stream that encrypts chunks; the key position carries across chunks. */
export class EncryptTransform extends Transform {
  constructor(key: string);
}

/** Transform stream that decrypts chunks; the key position carries across chunks. */
export class DecryptTransform extends Transform {
  constructor(key: string);
}

declare const vigenereCipher: {
  encrypt: typeof encrypt;
  decrypt: typeof decrypt;
  encryptString: typeof encryptString;
  decryptString: typeof decryptString;
  crack: typeof crack;
  EncryptTransform: typeof EncryptTransform;
  DecryptTransform: typeof DecryptTransform;
};

export default vigenereCipher;
