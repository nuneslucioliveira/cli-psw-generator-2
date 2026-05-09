#!/usr/bin/env node
// check-ux-intent-present.js — check if ## UX Intent section exists and is non-empty
// Used by companion before generating Figma wireframes from a REQ.
// FAIL means the section is absent or empty — cannot generate wireframes without intent.
//
// Usage: node check-ux-intent-present.js <req-file>
//
// Output on PASS:
//   PASS
//   # UX_INTENT_LINE: N (line where the section starts)
//
// Output on FAIL:
//   FAIL
//   - [req-file:0] "## UX Intent" section is absent (rule: UX Intent required for wireframe generation)
//   or
//   - [req-file:N] "## UX Intent" section is empty (rule: UX Intent must have content for wireframe generation)
//
// Exit code: 0 for PASS, 1 for FAIL

const fs = require('fs')
const path = require('path')
const process = require('process')

const [,, reqFile] = process.argv
const filename = reqFile ? path.basename(reqFile) : '<unknown>'

if (!reqFile) {
  console.log('FAIL')
  console.log('- [args] usage: node check-ux-intent-present.js <req-file> (rule: argument required)')
  process.exit(1)
}

if (!fs.existsSync(reqFile)) {
  console.log('FAIL')
  console.log(`- [${filename}:0] file not found at path: ${reqFile} (rule: REQ file must exist)`)
  process.exit(1)
}

const content = fs.readFileSync(reqFile, 'utf8')
const lines = content.split('\n')

// Find "## UX Intent" heading (case-insensitive, tolerates optional number prefix, trailing whitespace)
// Matches: "## UX Intent", "## 7. UX Intent", "## 7.UX Intent"
let sectionLine = -1
for (let i = 0; i < lines.length; i++) {
  if (/^##\s+(?:\d+\.\s*)?UX Intent\s*$/i.test(lines[i])) {
    sectionLine = i + 1 // 1-indexed
    break
  }
}

if (sectionLine === -1) {
  console.log('FAIL')
  console.log(`- [${filename}:0] "## UX Intent" section is absent (rule: UX Intent required for wireframe generation)`)
  process.exit(1)
}

// Check if section has non-empty content before the next ## heading
let hasContent = false
for (let i = sectionLine; i < lines.length; i++) {
  const line = lines[i].trim()
  if (line.startsWith('## ')) break // next section reached
  if (line.length > 0 && line !== '---') {
    hasContent = true
    break
  }
}

if (!hasContent) {
  console.log('FAIL')
  console.log(`- [${filename}:${sectionLine}] "## UX Intent" section is empty (rule: UX Intent must have content for wireframe generation)`)
  process.exit(1)
}

console.log('PASS')
console.log(`# UX_INTENT_LINE: ${sectionLine}`)
process.exit(0)
