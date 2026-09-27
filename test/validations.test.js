const { test } = require("node:test");
const assert = require("node:assert");
const {
  encrypt,
  encryptString,
  decryptString,
  crack,
  EncryptTransform,
} = require("../index");

test("key is required", () => {
  assert.throws(() => encryptString("hello"), { name: "TypeError", message: "Key is required" });
  assert.throws(() => encryptString("hello", ""), { message: "Key is required" });
});

test("key must be letters only", () => {
  for (const key of [3, "abc1", "two words", "é", {}]) {
    assert.throws(() => encryptString("hello", key), {
      name: "TypeError",
      message: "Key should contain only letters A-Z",
    });
  }
});

test("key length is capped", () => {
  assert.throws(() => encryptString("hello", "a".repeat(101)), { name: "RangeError" });
});

test("string is required and must be a string", () => {
  assert.throws(() => decryptString("", "KEY"), { message: "Str is required" });
  assert.throws(() => decryptString(42, "KEY"), { message: "Str is invalid" });
});

test("in-memory input is limited to 1000 characters", () => {
  assert.throws(() => encryptString("a".repeat(1001), "KEY"), { name: "RangeError" });
  assert.throws(() => encrypt(Buffer.alloc(1001), "KEY"), { name: "RangeError" });
});

test("buffer is required and must be a non-empty Buffer", () => {
  assert.throws(() => encrypt(null, "KEY"), { message: "Buffer is required" });
  assert.throws(() => encrypt("text", "KEY"), { message: "Buffer is invalid" });
  assert.throws(() => encrypt(Buffer.alloc(0), "KEY"), { message: "Buffer is invalid" });
});

test("crack validates maxKeyLength", () => {
  assert.throws(() => crack("abcdef", { maxKeyLength: 0 }), { name: "RangeError" });
  assert.throws(() => crack("abcdef", { maxKeyLength: 1.5 }), { name: "RangeError" });
});

test("crack handles very short input without throwing", () => {
  assert.strictEqual(typeof crack("a").key, "string");
  assert.strictEqual(crack("123!").text, "123!");
});

test("transforms validate the key", () => {
  assert.throws(() => new EncryptTransform(5), { name: "TypeError" });
});
