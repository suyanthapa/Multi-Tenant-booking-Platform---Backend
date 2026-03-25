# Jest Configuration Journey — Auth Service

A complete record of every issue encountered while setting up Jest with TypeScript in a Node.js microservice, and how each was resolved.

---

## Project Stack

| Tool         | Version  |
| ------------ | -------- |
| Node.js      | v24.6.0  |
| Jest         | 29.7.0   |
| ts-jest      | 29.4.6   |
| TypeScript   | 5.x      |
| ts-node      | 10.9.2   |
| Package type | CommonJS |

---

## Issue 1 — `ts-jest` Preset Not Found

### Error

```
Preset ts-jest not found relative to rootDir
```

### Why It Happened

`ts-jest` was not installed. The `jest.config.ts` referenced the preset before the package existed in `node_modules`.

### Fix

```bash
npm install --save-dev ts-jest @types/jest
```

---

## Issue 2 — Jest Config `.ts` File Fails to Load

### Error

```
Warning: Failed to load the ES module: jest.config.ts.
Make sure to set "type": "module" or use the .mjs extension.
```

### Why It Happened

Jest tries to load `jest.config.ts` **before** any TypeScript transformer is set up. This is a classic chicken-and-egg problem:

```
Jest needs jest.config.ts to set up ts-jest
But ts-jest is needed to read jest.config.ts
💥 deadlock
```

### The Three Solutions

| Config File       | Requires                 | Best For                    |
| ----------------- | ------------------------ | --------------------------- |
| `jest.config.cjs` | Nothing extra            | `"type": "module"` projects |
| `jest.config.js`  | `"type": "commonjs"`     | CJS projects                |
| `jest.config.ts`  | `ts-node` pre-registered | Full TS projects            |

### Fix Used

Since this project uses `"type": "commonjs"`, kept `jest.config.ts` and ensured `ts-node` was installed so it could bootstrap the TypeScript loader before Jest started.

---

## Issue 3 — `jest.config.ts` Using `export default` in a CommonJS Project

### Error

```
Cannot find module 'jest-util'
```

### Why It Happened

`jest.config.ts` used ESM syntax in a CommonJS project:

```typescript
// ❌ ESM syntax — wrong for "type": "commonjs"
export default config;
```

This caused Jest to silently fail loading the config, which cascaded into `jest-util` resolution errors.

### Fix

Changed to CommonJS export syntax:

```typescript
// ✅ CJS syntax — correct for "type": "commonjs"
module.exports = config;
```

---

## Issue 4 — Windows PowerShell `.bin/jest` Bash Script Error

### Error

```
SyntaxError: missing ) after argument list
basedir=$(dirname "$(echo "$0" | sed -e 's,\\,/,g')")
```

### Why It Happened

`node_modules/.bin/jest` is a **bash shell script**. It doesn't work in Windows PowerShell — only on Mac/Linux.

### Fix

Point directly to the Jest JavaScript entry file instead:

```json
// ❌ Bash script — fails on Windows
"test": "node --experimental-vm-modules node_modules/.bin/jest"

// ✅ JS file — works on all platforms
"test": "node --experimental-vm-modules ./node_modules/jest/bin/jest.js"
```

| Path                            | Type        | Works On         |
| ------------------------------- | ----------- | ---------------- |
| `node_modules/.bin/jest`        | Bash script | Mac/Linux only   |
| `node_modules/.bin/jest.cmd`    | CMD script  | Windows CMD only |
| `node_modules/jest/bin/jest.js` | JS file     | ✅ All platforms |

---

## Issue 5 — Multiple Jest Configurations Found

### Error

```
Multiple configurations found:
  * jest.config.ts
  * `jest` key in package.json
Implicit config resolution does not allow multiple configuration files.
```

### Why It Happened

Jest config existed in two places at the same time — `jest.config.ts` AND a `jest` key inside `package.json`.

### Fix

Remove the `jest` key from `package.json` entirely. All config should live in one place — `jest.config.ts`:

```json
// ❌ Remove this from package.json
"jest": {
  "extensionsToTreatAsEsm": [".ts"]
}
```

---

## Issue 6 — Jest 30 + ts-jest 29 Version Mismatch

### Error

```
Preset ts-jest/presets/default/esm not found relative to rootDir
```

### Why It Happened

`ts-jest` version 29 does not support Jest version 30. `ts-jest 30` does not exist yet.

```json
// ❌ Mismatch
"jest": "^30.3.0",   // Jest 30
"ts-jest": "^29.4.6" // ts-jest 29 — incompatible
```

### Fix

Downgrade Jest to version 29 to match ts-jest:

```bash
npm install --save-dev jest@^29.0.0 @types/jest@^29.0.0
```

|                 | Jest 29          | Jest 30              |
| --------------- | ---------------- | -------------------- |
| ts-jest support | ✅ Full          | ❌ Doesn't exist yet |
| Stability       | ✅ Battle tested | ⚠️ Brand new         |
| Recommended     | ✅ Yes           | ❌ Not yet           |

---

## Final Working Configuration

### `package.json`

```json
{
  "type": "commonjs",
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  }
}
```

### `jest.config.ts`

```typescript
import type { JestConfigWithTsJest } from "ts-jest";

const config: JestConfigWithTsJest = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/src"],
  testMatch: ["**/*.test.ts", "**/*.spec.ts"],
  transform: {
    "^.+\\.ts$": [
      "ts-jest",
      {
        tsconfig: "tsconfig.json",
      },
    ],
  },
};

module.exports = config;
```

### `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "moduleResolution": "node",
    "esModuleInterop": true,
    "strict": true,
    "sourceMap": true
  }
}
```

### Required Packages

```bash
npm install --save-dev jest@^29.7.0 ts-jest@^29.4.6 @types/jest@^29.5.0 ts-node@^10.9.2
```

---

## Quick Diagnosis Guide

| Error                                      | Likely Cause                                            | Fix                                           |
| ------------------------------------------ | ------------------------------------------------------- | --------------------------------------------- |
| `Preset ts-jest not found`                 | ts-jest not installed OR version mismatch with Jest     | `npm install ts-jest` or match versions       |
| `Failed to load ES module: jest.config.ts` | ESM/CJS mismatch in config loading                      | Use `module.exports` not `export default`     |
| `Multiple configurations found`            | Jest config in both `jest.config.ts` AND `package.json` | Remove `jest` key from `package.json`         |
| `missing ) after argument list`            | Using bash `.bin/jest` script on Windows                | Use `./node_modules/jest/bin/jest.js` instead |
| `Cannot find module 'jest-util'`           | Corrupted node_modules or config load failure           | Clean reinstall + fix `module.exports`        |
| `Preset .../esm not found`                 | Jest 30 + ts-jest 29 mismatch                           | Downgrade to `jest@29`                        |

---

## Lessons Learned

1. **Always match Jest and ts-jest major versions** — they must be compatible
2. **`jest.config.ts` requires `ts-node`** to bootstrap TypeScript loading before Jest initializes
3. **Use `module.exports` in jest.config.ts** when `"type": "commonjs"` — never `export default`
4. **On Windows, never use `node_modules/.bin/jest`** — it's a bash script; use the `.js` entry directly
5. **One config location only** — either `jest.config.ts` OR `package.json` jest key, never both
6. **CommonJS is the right choice for backend Node.js** — ESM support in Jest/ts-jest is still experimental
7. **Clean installs solve many mysterious errors** — version switching corrupts `node_modules`
