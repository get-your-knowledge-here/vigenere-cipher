"use strict";

const {
  VigenereCipherTransform,
  cipherBuffer,
  cipherString,
  crackString,
  keyToShifts,
} = require("./cipher");
const {
  ensureValidForBuffer,
  ensureValidForString,
  ensureValidStringOnly,
  ensureValidKey,
  ensureValidMaxKeyLength,
} = require("./validate");

const DEFAULT_MAX_KEY_LENGTH = 20;

/**
 * Encrypt a string using Vigenère Cipher
 *
 * @param {string} str
 * @param {string} key Keyword, letters A-Z
 * @returns string
 */
function encryptString(str, key) {
  ensureValidForString(str, key);

  return cipherString(str, keyToShifts(key, 1));
}

/**
 * Decrypt a string using Vigenère Cipher
 *
 * @param {string} str
 * @param {string} key Keyword, letters A-Z
 * @returns string
 */
function decryptString(str, key) {
  ensureValidForString(str, key);

  return cipherString(str, keyToShifts(key, -1));
}

/**
 * Recover the key and plaintext of English ciphertext without the key.
 * Works best with 100+ letters of ciphertext.
 *
 * @param {string} str Encrypted string
 * @param {{ maxKeyLength?: number }} [options]
 * @returns {{ key: string, text: string }}
 */
function crack(str, options = {}) {
  ensureValidStringOnly(str);
  const { maxKeyLength = DEFAULT_MAX_KEY_LENGTH } = options;
  ensureValidMaxKeyLength(maxKeyLength);

  return crackString(str, maxKeyLength);
}

/**
 * Encrypt a buffer array using Vigenère Cipher
 *
 * @param {Buffer} buffer
 * @param {string} key Keyword, letters A-Z
 * @returns buffer
 */
function encrypt(buffer, key) {
  ensureValidForBuffer(buffer, key);
  return cipherBuffer(buffer, keyToShifts(key, 1));
}

/**
 * Decrypt a buffer array using Vigenère Cipher
 *
 * @param {Buffer} buffer
 * @param {string} key Keyword, letters A-Z
 * @returns buffer
 */
function decrypt(buffer, key) {
  ensureValidForBuffer(buffer, key);
  return cipherBuffer(buffer, keyToShifts(key, -1));
}

class EncryptTransform extends VigenereCipherTransform {
  /**
   * Transform stream for encryption using Vigenère Cipher
   *
   * @param {string} key Keyword, letters A-Z
   */
  constructor(key) {
    super();
    ensureValidKey(key);
    this.shifts = keyToShifts(key, 1);
  }
}

class DecryptTransform extends VigenereCipherTransform {
  /**
   * Transform stream for decryption using Vigenère Cipher
   *
   * @param {string} key Keyword, letters A-Z
   */
  constructor(key) {
    super();
    ensureValidKey(key);
    this.shifts = keyToShifts(key, -1);
  }
}

module.exports = {
  encrypt,
  decrypt,
  encryptString,
  decryptString,
  crack,
  EncryptTransform,
  DecryptTransform,
};
