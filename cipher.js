const { Transform } = require("stream");

const UPPER_A = 65;
const UPPER_Z = 90;
const LOWER_A = 97;
const LOWER_Z = 122;
const ALPHABET_LENGTH = 26;

// Relative frequency of A-Z in English text
const ENGLISH_FREQ = [
  0.08167, 0.01492, 0.02782, 0.04253, 0.12702, 0.02228, 0.02015, 0.06094,
  0.06966, 0.00153, 0.00772, 0.04025, 0.02406, 0.06749, 0.07507, 0.01929,
  0.00095, 0.05987, 0.06327, 0.09056, 0.02758, 0.00978, 0.0236, 0.0015,
  0.01974, 0.00074,
];

/**
 * Convert a letter key into shift values (A = 0 ... Z = 25)
 *
 * @param {string} key
 * @param {number} direction 1 to encrypt, -1 to decrypt
 * @returns {number[]} normalized shifts
 */
function keyToShifts(key, direction) {
  const shifts = [];
  for (let i = 0; i < key.length; i++) {
    const shift = (key.charCodeAt(i) | 0x20) - LOWER_A;
    shifts.push((direction * shift + ALPHABET_LENGTH) % ALPHABET_LENGTH);
  }
  return shifts;
}

/**
 * Shift a character code by an already-normalized shift (0 - 25).
 * Returns -1 for non-letters so callers know not to advance the key.
 *
 * @param {number} code
 * @param {number} shift
 */
function shiftLetter(code, shift) {
  if (code >= UPPER_A && code <= UPPER_Z) {
    return UPPER_A + ((code - UPPER_A + shift) % ALPHABET_LENGTH);
  }

  if (code >= LOWER_A && code <= LOWER_Z) {
    return LOWER_A + ((code - LOWER_A + shift) % ALPHABET_LENGTH);
  }

  return -1;
}

/**
 * Apply the shifts to a string. The key only advances on letters, so
 * spaces, digits and punctuation are preserved untouched.
 *
 * @param {string} str
 * @param {number[]} shifts
 * @param {number} [offset] key position to start from
 */
function cipherString(str, shifts, offset = 0) {
  let result = "";
  let pos = offset;
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    const shifted = shiftLetter(code, shifts[pos % shifts.length]);
    if (shifted === -1) {
      result += str[i];
    } else {
      result += String.fromCharCode(shifted);
      pos++;
    }
  }
  return result;
}

/**
 * @param {Buffer} buffer
 * @param {number[]} shifts
 * @param {number} [offset] key position to start from
 * @returns {{ buffer: Buffer, offset: number }}
 */
function cipherBufferAt(buffer, shifts, offset = 0) {
  const out = Buffer.allocUnsafe(buffer.length);
  let pos = offset;
  for (let i = 0; i < buffer.length; i++) {
    const shifted = shiftLetter(buffer[i], shifts[pos % shifts.length]);
    if (shifted === -1) {
      out[i] = buffer[i];
    } else {
      out[i] = shifted;
      pos++;
    }
  }
  return { buffer: out, offset: pos % shifts.length };
}

function cipherBuffer(buffer, shifts) {
  return cipherBufferAt(buffer, shifts).buffer;
}

class VigenereCipherTransform extends Transform {
  /**
   * @param {number[]} shifts
   */
  set shifts(shifts) {
    this._shifts = shifts;
    this._offset = 0;
  }

  /**
   * The key position carries over between chunks, so streamed output
   * matches encrypting the whole input at once.
   *
   * @param {Buffer} chunk
   * @param {BufferEncoding} _encoding
   * @param {import("stream").TransformCallback} callback
   */
  _transform(chunk, _encoding, callback) {
    const { buffer, offset } = cipherBufferAt(chunk, this._shifts, this._offset);
    this._offset = offset;
    this.push(buffer);
    callback();
  }
}

/**
 * Index of coincidence of a list of letter indexes (0 - 25)
 *
 * @param {number[]} letters
 */
function indexOfCoincidence(letters) {
  const n = letters.length;
  if (n < 2) return 0;
  const counts = new Array(ALPHABET_LENGTH).fill(0);
  for (const l of letters) counts[l]++;
  let sum = 0;
  for (const c of counts) sum += c * (c - 1);
  return sum / (n * (n - 1));
}

/**
 * Find the Caesar shift of one key column by chi-squared against English
 *
 * @param {number[]} column
 */
function bestShift(column) {
  const counts = new Array(ALPHABET_LENGTH).fill(0);
  for (const l of column) counts[l]++;
  let best = 0;
  let bestScore = Infinity;
  for (let shift = 0; shift < ALPHABET_LENGTH; shift++) {
    let score = 0;
    for (let i = 0; i < ALPHABET_LENGTH; i++) {
      const expected = ENGLISH_FREQ[i] * column.length;
      const observed = counts[(i + shift) % ALPHABET_LENGTH];
      score += ((observed - expected) ** 2) / expected;
    }
    if (score < bestScore) {
      bestScore = score;
      best = shift;
    }
  }
  return best;
}

/**
 * Recover the key of an English Vigenère ciphertext without knowing it:
 * guess the key length with the index of coincidence, then solve each
 * column as a Caesar cipher with frequency analysis.
 *
 * @param {string} str
 * @param {number} maxKeyLength
 * @returns {{ key: string, text: string }}
 */
function crackString(str, maxKeyLength) {
  const letters = [];
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i) | 0x20;
    if (code >= LOWER_A && code <= LOWER_Z) letters.push(code - LOWER_A);
  }

  const limit = Math.max(1, Math.min(maxKeyLength, Math.floor(letters.length / 2)));
  const scores = [];
  for (let len = 1; len <= limit; len++) {
    let total = 0;
    for (let col = 0; col < len; col++) {
      const column = [];
      for (let i = col; i < letters.length; i += len) column.push(letters[i]);
      total += indexOfCoincidence(column);
    }
    scores.push(total / len);
  }

  // Multiples of the real key length score just as well, so take the
  // shortest length that is close to the best score.
  const top = Math.max(...scores);
  const keyLength = scores.findIndex((s) => s >= top * 0.9) + 1;

  let key = "";
  for (let col = 0; col < keyLength; col++) {
    const column = [];
    for (let i = col; i < letters.length; i += keyLength) column.push(letters[i]);
    key += String.fromCharCode(UPPER_A + bestShift(column));
  }

  return { key, text: cipherString(str, keyToShifts(key, -1)) };
}

module.exports = {
  VigenereCipherTransform,
  cipherBuffer,
  cipherString,
  crackString,
  keyToShifts,
};
