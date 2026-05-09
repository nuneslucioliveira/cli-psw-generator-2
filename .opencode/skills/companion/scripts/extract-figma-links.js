#!/usr/bin/env node
// extract-figma-links.js — extract Figma links from the ## UX Spec section of a REQ file
// Used by companion (implement-issue Step 0) to detect design fidelity context.
//
// Usage: node extract-figma-links.js <req-file>
//
// Output on PASS (ux-spec is complete AND at least one Figma link found):
//   PASS
//   # UX_SPEC_STATUS: complete
//   # FIGMA_LINKS: <json-array-of-objects>
//   Each object: { "label": "View in Figma", "url": "https://figma.com/design/...", "fileKey": "...", "nodeId": "..." }
//
// Output on SKIP (ux-spec is not complete or absent — no design fidelity context):
//   SKIP
//   # UX_SPEC_STATUS: in-progress | absent
//   # REASON: ux-spec not complete — design fidelity context not available
//
// Output on FAIL (ux-spec is complete but no Figma links found in ## UX Spec section):
//   FAIL
//   - [req-file:N] ux-spec is "complete" but no Figma links found in ## UX Spec section
//   # UX_SPEC_STATUS: complete
//   # REASON: Designer signed off but no Figma link is present — cannot extract design context
//
// Exit code: 0 for PASS or SKIP, 1 for FAIL
//
// Note: SKIP is exit code 0 — it is not an error. The caller should check the first line
// to distinguish PASS (design fidelity active) from SKIP (no design fidelity context).

const fs = require('fs')
const path = require('path')
const process = require('process')

const [,, reqFile] = process.argv
const filename = reqFile ? path.basename(reqFile) : '<unknown>'

if (!reqFile) {
  console.log('FAIL')
  console.log('- [args] usage: node extract-figma-links.js <req-file> (rule: argument required)')
  process.exit(1)
}

if (!fs.existsSync(reqFile)) {
  console.log('FAIL')
  console.log(`- [${filename}:0] file not found at path: ${reqFile} (rule: REQ file must exist)`)
  process.exit(1)
}

const content = fs.readFileSync(reqFile, 'utf8')

// --- 1. Extract ux-spec value from frontmatter ---
const fmMatch = content.match(/^---\n([\s\S]*?)\n---/)
let uxSpecValue = null

if (fmMatch) {
  const frontmatter = fmMatch[1]
  const lines = frontmatter.split('\n')
  for (const line of lines) {
    const match = line.match(/^ux-spec\s*:\s*(.+)$/)
    if (match) {
      uxSpecValue = match[1].trim().replace(/^["']|["']$/g, '')
      break
    }
  }
}

// Not complete — no design fidelity context, not an error
if (uxSpecValue !== 'complete') {
  const status = uxSpecValue === null ? 'absent' : uxSpecValue
  console.log('SKIP')
  console.log(`# UX_SPEC_STATUS: ${status}`)
  console.log('# REASON: ux-spec not complete — design fidelity context not available')
  process.exit(0)
}

// --- 2. Extract ## UX Spec section ---
// Match from "## UX Spec" (case-insensitive) to the next ## heading or end of file
// Matches "## UX Spec" or "## 7. UX Spec" or "## N. UX Spec" (optional number prefix).
// Captures everything after the heading line until the next H2 (line starting with ##
// followed by a space and a non-# character) or the end of file.
// Uses a line-anchored split strategy to avoid lookahead issues with lazy quantifiers.
const uxSpecHeadingPattern = /^##\s+(?:\d+\.\s+)?UX Spec\s*$/im
const headingMatch = uxSpecHeadingPattern.exec(content)
let uxSpecSectionMatch = null
if (headingMatch) {
  const afterHeading = content.slice(headingMatch.index + headingMatch[0].length)
  // Stop at next H2: a line that starts with "## " (not "###")
  const nextH2 = afterHeading.search(/\n## [^#]/)
  const sectionContent = nextH2 === -1 ? afterHeading : afterHeading.slice(0, nextH2)
  uxSpecSectionMatch = [null, sectionContent]
}

if (!uxSpecSectionMatch) {
  console.log('FAIL')
  console.log(`- [${filename}] ux-spec is "complete" but ## UX Spec section not found in document`)
  console.log('# UX_SPEC_STATUS: complete')
  console.log('# REASON: Designer signed off but ## UX Spec section is missing — cannot extract design context')
  process.exit(1)
}

const uxSpecSection = uxSpecSectionMatch[1]

// --- 3. Extract all Figma links from the UX Spec section ---
// Matches both:
//   [View in Figma](https://figma.com/design/fileKey/Name?node-id=1-2)
//   [anything](https://www.figma.com/design/fileKey/...)
//   [anything](https://figma.com/design/fileKey/...)
const linkPattern = /\[([^\]]*)\]\((https?:\/\/(?:www\.)?figma\.com\/design\/([^/]+)\/[^)]*[?&]node-id=([^)&\s]+)[^)]*)\)/gi

const links = []
let match
while ((match = linkPattern.exec(uxSpecSection)) !== null) {
  const [, label, url, fileKey, rawNodeId] = match
  // Normalise node-id: Figma URLs use hyphens (1-2), API uses colons (1:2)
  const nodeId = rawNodeId.replace(/-/g, ':')
  links.push({ label, url, fileKey, nodeId })
}

if (links.length === 0) {
  console.log('FAIL')
  console.log(`- [${filename}] ux-spec is "complete" but no Figma links found in ## UX Spec section`)
  console.log('# UX_SPEC_STATUS: complete')
  console.log('# REASON: Designer signed off but no Figma link is present — cannot extract design context')
  process.exit(1)
}

console.log('PASS')
console.log('# UX_SPEC_STATUS: complete')
console.log(`# FIGMA_LINKS: ${JSON.stringify(links)}`)
process.exit(0)
