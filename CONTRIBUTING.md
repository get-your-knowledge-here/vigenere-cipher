# Contributing to @gykh/vigenere-cipher

Thank you for your interest in contributing to `@gykh/vigenere-cipher`!

## Principles

* **Zero External Dependencies**: This project purposefully maintains zero runtime dependencies. All logic relies strictly on Node.js built-ins.
* **Compatibility**: Node.js `>= 18.0.0`.
* **Testing**: All features and fixes must include corresponding tests using the built-in Node test runner (`node --test`).

## Development Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/get-your-knowledge-here/vigenere-cipher.git
   cd vigenere-cipher
   ```

2. Run the test suite:
   ```bash
   node --test
   ```

## Pull Request Guidelines

1. Ensure code is formatted cleanly and adheres to existing style.
2. If introducing new functions or changing signatures, update:
   - `index.d.ts` (TypeScript types)
   - `index.mjs` (ESM export mappings)
   - `README.md` (documentation and examples)
   - `test/` (unit tests)
3. Ensure all tests pass before submitting.
