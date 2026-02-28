#!/usr/bin/env node

/* global console, process */

import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const VERSION_RE =
  /^\d+\.\d+\.\d+(?:-[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/;

function fail(message) {
  console.error(`Error: ${message}`);
  process.exit(1);
}

const nextVersion = process.argv[2];

if (!nextVersion) {
  fail("missing version argument. Usage: npm run version:bump -- <version>");
}

if (!VERSION_RE.test(nextVersion)) {
  fail(`invalid semantic version "${nextVersion}"`);
}

const root = process.cwd();
const files = {
  packageJson: resolve(root, "package.json"),
  tauriConf: resolve(root, "src-tauri/tauri.conf.json"),
  cargoToml: resolve(root, "src-tauri/Cargo.toml"),
};

function updateJsonVersion(filePath) {
  const raw = readFileSync(filePath, "utf8");
  const parsed = JSON.parse(raw);

  if (typeof parsed.version !== "string") {
    fail(`missing string "version" field in ${filePath}`);
  }

  const previousVersion = parsed.version;
  parsed.version = nextVersion;
  writeFileSync(filePath, `${JSON.stringify(parsed, null, 2)}\n`);
  return previousVersion;
}

function updateCargoPackageVersion(filePath) {
  const raw = readFileSync(filePath, "utf8");
  const pattern = /(\[package\][\s\S]*?^\s*version\s*=\s*")([^"]+)(")/m;
  const match = raw.match(pattern);

  if (!match) {
    fail(`could not find [package] version in ${filePath}`);
  }

  const previousVersion = match[2];
  const updated = raw.replace(pattern, `$1${nextVersion}$3`);
  writeFileSync(filePath, updated);
  return previousVersion;
}

const previous = {
  packageJson: updateJsonVersion(files.packageJson),
  tauriConf: updateJsonVersion(files.tauriConf),
  cargoToml: updateCargoPackageVersion(files.cargoToml),
};

console.log(`Updated version to ${nextVersion}:`);
console.log(`- package.json: ${previous.packageJson} -> ${nextVersion}`);
console.log(`- src-tauri/tauri.conf.json: ${previous.tauriConf} -> ${nextVersion}`);
console.log(`- src-tauri/Cargo.toml: ${previous.cargoToml} -> ${nextVersion}`);
