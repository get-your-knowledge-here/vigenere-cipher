# @gykh/vigenere-cipher

[![Vigenère Cipher Decoder & Encoder](https://raw.githubusercontent.com/get-your-knowledge-here/vigenere-cipher/main/docs/assets/og-image.jpg)](https://get-your-knowledge-here.github.io/vigenere-cipher/)

> A fast, zero-dependency Vigenère cipher implementation in Node.js supporting Strings, Buffers, Streams, and key-cracking by frequency analysis.

[![npm version](https://img.shields.io/npm/v/@gykh/vigenere-cipher.svg?style=flat-square)](https://www.npmjs.com/package/@gykh/vigenere-cipher)
[![npm downloads](https://img.shields.io/npm/dm/@gykh/vigenere-cipher.svg?style=flat-square)](https://www.npmjs.com/package/@gykh/vigenere-cipher)
[![CI Tests](https://img.shields.io/github/actions/workflow/status/get-your-knowledge-here/vigenere-cipher/test.yml?branch=main&label=tests&style=flat-square)](https://github.com/get-your-knowledge-here/vigenere-cipher/actions)
[![node version](https://img.shields.io/node/v/@gykh/vigenere-cipher.svg?style=flat-square)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-3178C6?style=flat-square&logo=typescript&logoColor=white)](./index.d.ts)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](./LICENSE)
[![Zero Dependencies](https://img.shields.io/badge/dependencies-0-brightgreen.svg?style=flat-square)](./package.json)

**[Try it live in your browser →](https://get-your-knowledge-here.github.io/vigenere-cipher/)** Encrypt, decrypt and crack the key, no install needed. · **[Watch the 30s video](https://youtube.com/shorts/rZkRROJNB_s)**

More short package videos on [@qckx](https://www.youtube.com/@qckx). Sibling package: [@gykh/caesar-cipher](https://github.com/get-your-knowledge-here/caesar-cipher).

---

## Contents

- [Features](#features)
- [Install](#install)
- [Usage](#usage)
- [API Reference](#api-reference)
- [How the cracker works](#how-the-cracker-works)

## Features

- 🚀 **Zero Dependencies**: Pure native Node.js implementation.
- 🔑 **Keyword cipher**: Each letter of the key picks a different Caesar shift, so the same letter encrypts differently along the message.
- 🔄 **Multi-Format Support**: Encrypt and decrypt Strings, Buffers, and Node.js Streams.
- 🌊 **Chunk-safe streams**: The key position carries across chunks, so streamed output matches encrypting all at once.
- 🕵️ **Cracking**: `crack(str)` recovers an unknown key from English ciphertext using the index of coincidence and chi-squared frequency analysis.
- 📦 **Dual ESM & CommonJS** with full TypeScript types.

---

## Install

```sh
pnpm add @gykh/vigenere-cipher
# or
npm install @gykh/vigenere-cipher
# or
yarn add @gykh/vigenere-cipher
```

*Requires Node.js 18 or newer.*

---

## Usage

Letters `A-Z` / `a-z` are shifted by the matching key letter (`A` = 0, `B` = 1 … `Z` = 25) and keep their case. Spaces, digits and punctuation are preserved and **do not** advance the key.

### 1. Strings (ESM & CommonJS)

```js
// ESM
import { encryptString, decryptString, crack } from "@gykh/vigenere-cipher";

// CommonJS
// const { encryptString, decryptString, crack } = require("@gykh/vigenere-cipher");

encryptString("ATTACKATDAWN", "LEMON"); // "LXFOPVEFRNHR"
decryptString("LXFOPVEFRNHR", "LEMON"); // "ATTACKATDAWN"

encryptString("Attack at dawn! 123", "lemon"); // "Lxfopv ef rnhr! 123"
```

### 2. Crack an unknown key

```js
const secret = encryptString(longEnglishText, "CIPHER");

const { key, text } = crack(secret);
console.log(key);  // "CIPHER"
console.log(text); // the original text
```

Cracking is statistical: it needs English text and works best with **100+ letters** of ciphertext. Short messages may return a wrong key.

### 3. Buffers

```js
import { encrypt, decrypt } from "@gykh/vigenere-cipher";
import { readFile } from "fs/promises";

const buffer = await readFile("sample.txt");

const encryptedBuffer = encrypt(buffer, "LEMON");
const decryptedBuffer = decrypt(encryptedBuffer, "LEMON");

console.log(buffer.equals(decryptedBuffer)); // true
```

### 4. Streams (For Large Files)

For files or streams exceeding 1000 characters/bytes, use the streaming transform classes:

```js
import { EncryptTransform, DecryptTransform } from "@gykh/vigenere-cipher";
import fs from "fs";
import { pipeline } from "stream/promises";

await pipeline(
  fs.createReadStream("large-input.txt"),
  new EncryptTransform("LEMON"),
  fs.createWriteStream("large-encrypted.txt")
);

await pipeline(
  fs.createReadStream("large-encrypted.txt"),
  new DecryptTransform("LEMON"),
  fs.createWriteStream("large-decrypted.txt")
);
```

---

## API Reference

### `encryptString(str, key)`
* **`str`** (`string`, max 1000 chars): Plaintext.
* **`key`** (`string`, 1–100 letters A-Z, any case): Keyword.
* **Returns**: `string`

### `decryptString(str, key)`
* **`str`** (`string`, max 1000 chars): Ciphertext.
* **`key`** (`string`): Keyword used during encryption.
* **Returns**: `string`

### `crack(str, options?)`
Recovers the key of English ciphertext without knowing it.
* **`str`** (`string`, max 1000 chars): Ciphertext.
* **`options.maxKeyLength`** (`number`, 1–100, default `20`): Longest key length to try.
* **Returns**: `{ key: string, text: string }`, where `key` is uppercase.

### `encrypt(buffer, key)` / `decrypt(buffer, key)`
* **`buffer`** (`Buffer`, max 1000 bytes): Input buffer.
* **`key`** (`string`): Keyword.
* **Returns**: `Buffer`

### `new EncryptTransform(key)` / `new DecryptTransform(key)`
Node.js `stream.Transform` subclasses. The key position carries over between chunks.

> [!NOTE]
> The string and buffer functions and `crack` enforce an input limit of **1000 characters/bytes**. For larger data, pipe through `EncryptTransform` / `DecryptTransform`.

---

## How the cracker works

1. **Find the key length.** For each candidate length *n*, split the letters into *n* columns. When *n* is right, each column is a plain Caesar cipher and its [index of coincidence](https://en.wikipedia.org/wiki/Index_of_coincidence) jumps to English levels (≈ 0.066 vs ≈ 0.038 for random text). The shortest length close to the best score wins, since multiples of the key length score equally well.
2. **Solve each column.** Try all 26 shifts per column and keep the one whose letter counts best match English (lowest chi-squared).
3. **Decrypt** with the recovered key.

The Vigenère cipher is **not secure**. It resisted attack for three centuries but is broken in milliseconds today. Use it for learning, puzzles and CTFs, not for protecting data.

---

## Developer

- **Sylvester Das** — [Website](https://www.sylvesterdas.com) • [MiniFyn](https://www.minifyn.com) • [Buy Me A Coffee](https://www.buymeacoffee.com/sylvester.das)

---

## License

[MIT](./LICENSE) © 2026 [get-your-knowledge-here](https://github.com/get-your-knowledge-here)
