#!/usr/bin/env node
/**
 * B-03: check-req-accepted.js
 * Usage: node check-req-accepted.js <req-file>
 * Checks that the REQ has status: accepted.
 * Rule: SDD hard-stops / Plan phase gate
 * Exit 0 = PASS, Exit 1 = FAIL
 */

'use strict';

const fs   = require('fs');
const path = require('path');

// ---------------------------------------------------------------------------
// Minimal scalar frontmatter field extractor
// ---------------------------------------------------------------------------
function extractFrontmatterField(lines, key) {
  if (!lines[0] || lines[0].trim() !== '---') return { value: null, lineNum: 0 };
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === '---') break;
    const m = lines[i].match(new RegExp(`^${key}:\\s*(.*)`));
    if (m) return { value: m[1].trim().replace(/^["']|["']$/g, ''), lineNum: i + 1 };
  }
  return { value: null, lineNum: 0 };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
function main() {
  const [,, reqFile] = process.argv;

  if (!reqFile) {
    console.error('Usage: check-req-accepted.js <req-file>');
    process.exit(1);
  }

  const absPath = path.resolve(reqFile);
  if (!fs.existsSync(absPath)) {
    console.log('FAIL');
    console.log(`- [${reqFile}:0] File not found (rule: SDD hard-stops)`);
    process.exit(1);
  }

  const lines = fs.readFileSync(absPath, 'utf8').split('\n');
  const { value: status, lineNum } = extractFrontmatterField(lines, 'status');

  if (!status) {
    console.log('FAIL');
    console.log(`- [${reqFile}:1] Frontmatter field 'status' not found — REQ status must be 'accepted' to proceed (rule: SDD hard-stops)`);
    process.exit(1);
  }

  if (status !== 'accepted') {
    console.log('FAIL');
    console.log(
      `- [${reqFile}:${lineNum}] REQ status is '${status}' — must be 'accepted' before implementation can begin; the Plan phase gate requires an accepted REQ (rule: SDD hard-stops)`
    );
    process.exit(1);
  }

  console.log('PASS');
  process.exit(0);
}

main();
