const { test } = require("node:test");
const assert = require("node:assert");
const { Readable } = require("node:stream");
const { pipeline } = require("node:stream/promises");
const {
  encrypt,
  decrypt,
  encryptString,
  decryptString,
  crack,
  EncryptTransform,
  DecryptTransform,
} = require("../index");

const PLAIN =
  "It is a truth universally acknowledged, that a single man in possession of a good fortune, must be in want of a wife. However little known the feelings or views of such a man may be on his first entering a neighbourhood, this truth is so well fixed in the minds of the surrounding families, that he is considered the rightful property of some one or other of their daughters.";

test("classic example: ATTACKATDAWN with LEMON", () => {
  assert.strictEqual(encryptString("ATTACKATDAWN", "LEMON"), "LXFOPVEFRNHR");
  assert.strictEqual(decryptString("LXFOPVEFRNHR", "LEMON"), "ATTACKATDAWN");
});

test("preserves case, spaces, digits and punctuation", () => {
  const encrypted = encryptString("Attack at dawn! 123", "lemon");
  assert.strictEqual(encrypted, "Lxfopv ef rnhr! 123");
  assert.strictEqual(decryptString(encrypted, "LEMON"), "Attack at dawn! 123");
});

test("key only advances on letters", () => {
  assert.strictEqual(encryptString("a b", "BC"), "b d");
});

test("key A is the identity", () => {
  assert.strictEqual(encryptString("Hello, World", "A"), "Hello, World");
});

test("single-letter key matches a Caesar shift", () => {
  assert.strictEqual(encryptString("Hello, World", "D"), "Khoor, Zruog");
});

test("buffers round-trip", () => {
  const buffer = Buffer.from("Hello, World! 123");
  const encrypted = encrypt(buffer, "KEY");
  assert.strictEqual(encrypted.toString(), encryptString("Hello, World! 123", "KEY"));
  assert.ok(decrypt(encrypted, "KEY").equals(buffer));
});

test("streams keep the key position across chunks", async () => {
  const chunks = ["Attack ", "at", " dawn"];
  const out = [];
  await pipeline(Readable.from(chunks.map((c) => Buffer.from(c))), new EncryptTransform("LEMON"), async function* (source) {
    for await (const chunk of source) out.push(chunk);
  });
  const encrypted = Buffer.concat(out).toString();
  assert.strictEqual(encrypted, encryptString("Attack at dawn", "LEMON"));

  const back = [];
  await pipeline(Readable.from([Buffer.from(encrypted)]), new DecryptTransform("LEMON"), async function* (source) {
    for await (const chunk of source) back.push(chunk);
  });
  assert.strictEqual(Buffer.concat(back).toString(), "Attack at dawn");
});

test("crack recovers the key and plaintext", () => {
  for (const key of ["LEMON", "CIPHER", "SECRETKEY"]) {
    const result = crack(encryptString(PLAIN, key));
    assert.strictEqual(result.key, key);
    assert.strictEqual(result.text, PLAIN);
  }
});

test("crack respects maxKeyLength", () => {
  const result = crack(encryptString(PLAIN, "LEMON"), { maxKeyLength: 3 });
  assert.ok(result.key.length <= 3);
});
