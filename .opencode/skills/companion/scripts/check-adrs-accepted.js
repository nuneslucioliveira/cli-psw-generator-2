#!/usr/bin/env node
/**
 * B-02: check-adrs-accepted.js
 * Usage: node check-adrs-accepted.js <req-file>
 * Reads the 'related-adrs' frontmatter field from the REQ file.
 * For each ADR id listed, finds the corresponding ADR file under
 * docs/shared/architecture/adrs/ relative to the workspace root,
 * then checks that its status is 'accepted'.
 * Rule: SDD hard-stops — all governing ADRs must be accepted before implementation
 * Exit 0 = PASS, Exit 1 = FAIL
 */

'use strict';

const fs   = require('fs');
const path = require('path');

// ---------------------------------------------------------------------------
// Locate the workspace root by walking up from __dirname until we find
// docs/shared/architecture/adrs/ or a well-known project marker.
// Falls back to CWD if not found.
// ---------------------------------------------------------------------------
function findWorkspaceRoot(startDir) {
  let dir = startDir;
  for (let depth = 0; depth < 10; depth++) {
    if (fs.existsSync(path.join(dir, 'docs', 'shared', 'architecture', 'adrs'))) {
      return dir;
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  // Fallback: try CWD
  if (fs.existsSync(path.join(process.cwd(), 'docs', 'shared', 'architecture', 'adrs'))) {
    return process.cwd();
  }
  return null;
}

// ---------------------------------------------------------------------------
// Parse frontmatter to extract the related-adrs list
// Returns an array of ADR id strings (e.g. ["ADR-025", "ADR-027"])
// ---------------------------------------------------------------------------
function extractRelatedAdrs(lines) {
  if (!lines[0] || lines[0].trim() !== '---') return [];

  let inFrontmatter = true;
  const ids         = [];
  let inRelatedAdrs = false;

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim() === '---') break;

    // Start of related-adrs key
    const keyMatch = line.match(/^related-adrs:\s*(.*)/);
    if (keyMatch) {
      const inline = keyMatch[1].trim();
      if (inline.startsWith('[')) {
        // Inline array: [ADR-025, ADR-027] or []
        const inner = inline.replace(/^\[|\]$/g, '');
        if (inner.trim() !== '') {
          inner.split(',').forEach(s => {
            const id = s.trim().replace(/^["']|["']$/g, '');
            if (id) ids.push(id);
          });
        }
        inRelatedAdrs = false;
      } else if (inline === '') {
        inRelatedAdrs = true;
      }
      continue;
    }

    if (inRelatedAdrs) {
      const itemMatch = line.match(/^\s+-\s+(.*)/);
      if (itemMatch) {
        const id = itemMatch[1].trim().replace(/^["']|["']$/g, '');
        if (id) ids.push(id);
      } else if (/^[A-Za-z0-9_-]+:/.test(line)) {
        // Next key — stop collecting
        inRelatedAdrs = false;
      }
    }
  }
  return ids;
}

// ---------------------------------------------------------------------------
// Extract 'status' from an ADR file's frontmatter
// ---------------------------------------------------------------------------
function extractStatus(lines) {
  if (!lines[0] || lines[0].trim() !== '---') return null;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === '---') break;
    const m = lines[i].match(/^status:\s*(.*)/);
    if (m) return m[1].trim().replace(/^["']|["']$/g, '');
  }
  return null;
}

// ---------------------------------------------------------------------------
// Find the ADR file for a given id (e.g. ADR-025) in the adrs directory
// ---------------------------------------------------------------------------
function findAdrFile(adrsDir, adrId) {
  // Convert ADR-025 → NNN prefix 025
  const nnnMatch = adrId.match(/ADR-(\d+)/i);
  if (!nnnMatch) return null;
  const nnn = nnnMatch[1].padStart(3, '0');

  const entries = fs.readdirSync(adrsDir);
  const match   = entries.find(f => f.startsWith(`${nnn}-`) && f.endsWith('.md'));
  return match ? path.join(adrsDir, match) : null;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
function main() {
  const [,, reqFile] = process.argv;

  if (!reqFile) {
    console.error('Usage: check-adrs-accepted.js <req-file>');
    process.exit(1);
  }

  const absReqFile = path.resolve(reqFile);
  if (!fs.existsSync(absReqFile)) {
    console.log('FAIL');
    console.log(`- [${reqFile}:0] File not found (rule: SDD hard-stops)`);
    process.exit(1);
  }

  const lines      = fs.readFileSync(absReqFile, 'utf8').split('\n');
  const relatedAdrs = extractRelatedAdrs(lines);

  if (relatedAdrs.length === 0) {
    console.log('PASS');
    console.log('# NOTE: No related-adrs listed — nothing to check');
    process.exit(0);
  }

  // Find workspace root
  const wsRoot = findWorkspaceRoot(path.dirname(absReqFile));
  if (!wsRoot) {
    console.log('FAIL');
    console.log(`- [${reqFile}:0] Could not locate docs/shared/architecture/adrs/ from workspace root (rule: SDD hard-stops)`);
    process.exit(1);
  }

  const adrsDir = path.join(wsRoot, 'docs', 'shared', 'architecture', 'adrs');
  const findings = [];

  for (const adrId of relatedAdrs) {
    const adrFile = findAdrFile(adrsDir, adrId);

    if (!adrFile) {
      findings.push(
        `- [${reqFile}:0] ADR file for '${adrId}' not found in '${adrsDir}' — cannot verify status (rule: SDD hard-stops)`
      );
      continue;
    }

    const adrLines = fs.readFileSync(adrFile, 'utf8').split('\n');
    const status   = extractStatus(adrLines);

    if (!status) {
      findings.push(
        `- [${path.relative(wsRoot, adrFile)}:0] ADR '${adrId}' has no 'status' field in frontmatter (rule: SDD hard-stops)`
      );
    } else if (status !== 'accepted') {
      findings.push(
        `- [${path.relative(wsRoot, adrFile)}:0] ADR '${adrId}' has status '${status}' — must be 'accepted' before implementation can proceed (rule: SDD hard-stops)`
      );
    }
  }

  if (findings.length === 0) {
    console.log('PASS');
    process.exit(0);
  } else {
    console.log('FAIL');
    findings.forEach(f => console.log(f));
    process.exit(1);
  }
}

main();
