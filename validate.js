const MAX_INPUT_LENGTH = 1000;
const MAX_KEY_LENGTH = 100;

/**
 * Check for valid key: letters A-Z only (any case)
 *
 * @param {string} key Keyword
 */
function ensureValidKey(key) {
  if (key === undefined || key === null || key === "") {
    throw new TypeError("Key is required");
  }

  if (typeof key !== "string" || !/^[A-Za-z]+$/.test(key)) {
    throw new TypeError("Key should contain only letters A-Z");
  }

  if (key.length > MAX_KEY_LENGTH) {
    throw new RangeError(`Key should be at most ${MAX_KEY_LENGTH} letters`);
  }
}

/**
 * Check that input does not exceed the in-memory size limit
 *
 * @param {number} length Input length in characters or bytes
 */
function ensureWithinLimit(length) {
  if (length > MAX_INPUT_LENGTH) {
    throw new RangeError(
      "Input too large, use EncryptTransform / DecryptTransform instead"
    );
  }
}

/**
 * Validation for string input without key (crack)
 *
 * @param {String} str String input value
 */
function ensureValidStringOnly(str) {
  if (!str) {
    throw new TypeError("Str is required");
  }

  if (typeof str !== "string") {
    throw new TypeError("Str is invalid");
  }

  ensureWithinLimit(str.length);
}

/**
 * Validation for encryptString and decryptString
 *
 * @param {String} str String input value
 * @param {string} key Keyword
 */
function ensureValidForString(str, key) {
  ensureValidStringOnly(str);
  ensureValidKey(key);
}

/**
 * Validation for encrypt and decrypt functions
 *
 * @param {Buffer} buffer Buffer input value
 * @param {string} key Keyword
 */
function ensureValidForBuffer(buffer, key) {
  if (!buffer) {
    throw new TypeError("Buffer is required");
  }

  if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
    throw new TypeError("Buffer is invalid");
  }

  ensureWithinLimit(buffer.length);
  ensureValidKey(key);
}

/**
 * Validation for the crack maxKeyLength option
 *
 * @param {number} maxKeyLength
 */
function ensureValidMaxKeyLength(maxKeyLength) {
  if (!Number.isInteger(maxKeyLength) || maxKeyLength < 1 || maxKeyLength > MAX_KEY_LENGTH) {
    throw new RangeError(`maxKeyLength should be an integer from 1 - ${MAX_KEY_LENGTH}`);
  }
}

module.exports = {
  MAX_INPUT_LENGTH,
  MAX_KEY_LENGTH,
  ensureValidKey,
  ensureValidForString,
  ensureValidForBuffer,
  ensureValidStringOnly,
  ensureValidMaxKeyLength,
};
