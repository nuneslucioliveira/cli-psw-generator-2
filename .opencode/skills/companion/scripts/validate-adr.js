#!/usr/bin/env node

// validate-adr.js — unified ADR validator
// Runs all 13 ADR checks (A-14b through A-26) in a single process.
// Usage: node validate-adr.js <adr-file> [adrs-dir]
// If adrs-dir is omitted, checks A-16 (id-unique) and A-25 (in-index) are skipped.

'use strict';

const fs   = require('fs');
const path = require('path');

// =============================================================================
// Shared helpers (used by multiple checks)
// =============================================================================

/**
 * Parse YAML-style frontmatter delimited by --- lines.
 * Returns { fields: Map<string, string|string[]>, endLine: number }
 * Handles scalars, YAML block arrays ("- item" lines), and inline arrays ([a, b]).
 */
function parseFrontmatter(lines) {
  const fields = new Map();
  if (!lines[0] || lines[0].trim() !== '---') return { fields, endLine: 0 };

  let i = 1;
  let endLine = lines.length;

  while (i < lines.length) {
    const line = lines[i];
    if (line.trim() === '---') { endLine = i; break; }

    const kvMatch = line.match(/^([A-Za-z0-9_-]+):\s*(.*)/);
    if (kvMatch) {
      const key   = kvMatch[1];
      const value = kvMatch[2].trim();

      if (value === '') {
        // Possible YAML block array
        const items = [];
        let j = i + 1;
        while (j < lines.length && /^\s+-\s+/.test(lines[j])) {
          items.push(lines[j].replace(/^\s+-\s+/, '').replace(/^["']|["']$/g, '').trim());
          j++;
        }
        if (items.length > 0) {
          fields.set(key, items);
          i = j;
          continue;
        }
        fields.set(key, '');
      } else if (value.startsWith('[')) {
        const inner = value.replace(/^\[|\]$/g, '');
        const items = inner.split(',').map(s => s.trim().replace(/^["']|["']$/g, '')).filter(Boolean);
        fields.set(key, items);
      } else {
        fields.set(key, value.replace(/^["']|["']$/g, ''));
      }
    }
    i++;
  }
  return { fields, endLine };
}

/**
 * Extract a single scalar frontmatter field by key.
 * Returns { value, lineNum } — value is null if not found.
 */
function extractFrontmatterField(lines, key) {
  if (!lines[0] || lines[0].trim() !== '---') return { value: null, lineNum: 0 };
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === '---') break;
    const m = lines[i].match(new RegExp(`^${key}:\\s*(.*)`));
    if (m) return { value: m[1].trim().replace(/^["']|["']$/g, ''), lineNum: i + 1 };
  }
  return { value: null, lineNum: 0 };
}

/**
 * Return the 0-based index of the first line after the closing --- of frontmatter.
 */
function findBodyStart(lines) {
  if (!lines[0] || lines[0].trim() !== '---') return 0;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === '---') return i + 1;
  }
  return 0;
}

/**
 * Find the first H1 heading text after frontmatter.
 * Returns { text, lineNum } — text is null if not found.
 */
function findH1Text(lines) {
  const bodyStart = findBodyStart(lines);
  for (let i = bodyStart; i < lines.length; i++) {
    const m = lines[i].match(/^#\s+(.+)/);
    if (m) return { text: m[1].trim(), lineNum: i + 1 };
  }
  return { text: null, lineNum: 0 };
}

/**
 * Find the first H1 raw line after frontmatter.
 * Returns { line, lineNum } — line is null if not found.
 */
function findH1Line(lines) {
  const bodyStart = findBodyStart(lines);
  for (let i = bodyStart; i < lines.length; i++) {
    if (/^#\s/.test(lines[i])) return { line: lines[i], lineNum: i + 1 };
  }
  return { line: null, lineNum: 0 };
}

// =============================================================================
// A-14b: validate-adr-filename
// Checks the basename of the file matches NNN-<kebab-case-title>.md.
// Inserted FIRST (same rationale as A-00 in validate-req.js): operates solely
// on the path, requires no file content, and a wrong filename is a hard structural
// error that should fail before any content parsing is attempted.
// Rule: ADR guidelines §2 filename convention
// =============================================================================
function checkFilename(adrFile) {
  const findings = [];
  const basename  = path.basename(adrFile);

  if (!/^[0-9]{3}-.+\.md$/.test(basename)) {
    findings.push(`- [${basename}:0] filename does not match NNN-<kebab-case-title>.md pattern (rule: ADR guidelines §2 filename convention)`);
  }

  return findings;
}

// =============================================================================
// A-15: validate-adr-frontmatter
// Checks all mandatory frontmatter fields are present and non-empty.
// Rule: ADR guidelines §1.1
// =============================================================================
function checkFrontmatter(lines, adrFile) {
  const findings = [];

  if (!lines[0] || lines[0].trim() !== '---') {
    findings.push(`- [${adrFile}:1] No YAML frontmatter block found — file must start with --- (rule: ADR guidelines §1.1)`);
    return findings;
  }

  const { fields } = parseFrontmatter(lines);
  const MANDATORY  = ['id', 'title', 'status', 'service', 'date', 'milestone', 'deciders'];

  for (const field of MANDATORY) {
    if (!fields.has(field)) {
      findings.push(`- [${adrFile}:1] Mandatory frontmatter field '${field}' is missing (rule: ADR guidelines §1.1)`);
      continue;
    }
    const val     = fields.get(field);
    const isEmpty = Array.isArray(val) ? val.length === 0 : val === '';
    if (isEmpty) {
      findings.push(`- [${adrFile}:1] Mandatory frontmatter field '${field}' is present but empty (rule: ADR guidelines §1.1)`);
    }
  }

  // deciders must contain at least one human name (not only Agent: entries)
  if (fields.has('deciders')) {
    const decVal    = fields.get('deciders');
    const deciders  = Array.isArray(decVal) ? decVal : [decVal];
    const nonAgents = deciders.filter(d => d && !d.startsWith('Agent:'));
    if (nonAgents.length === 0) {
      findings.push(`- [${adrFile}:1] 'deciders' must contain at least one human name (not just Agent entries) (rule: ADR guidelines §1.1)`);
    }
  }

  return findings;
}

// =============================================================================
// A-16: validate-adr-id-unique  (requires adrsDir)
// Checks that the ADR id appears in exactly one index-<service>.md.
// Rule: ADR guidelines §1.3
// =============================================================================
function checkIdUnique(lines, adrFile, adrsDir) {
  const findings = [];
  const { value: adrId, lineNum } = extractFrontmatterField(lines, 'id');

  if (!adrId) {
    findings.push(`- [${adrFile}:1] Frontmatter field 'id' not found — cannot check uniqueness (rule: ADR guidelines §1.3)`);
    return findings;
  }

  const absAdrsDir = path.resolve(adrsDir);
  if (!fs.existsSync(absAdrsDir)) {
    findings.push(`- [${adrsDir}:0] ADRs directory not found (rule: ADR guidelines §1.3)`);
    return findings;
  }

  const indexFiles = fs.readdirSync(absAdrsDir).filter(f => /^index-[a-z-]+\.md$/.test(f));
  const foundIn    = [];
  const escapedId  = adrId.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
  const pattern    = new RegExp(`\\b${escapedId}\\b`);

  for (const indexFile of indexFiles) {
    const content = fs.readFileSync(path.join(absAdrsDir, indexFile), 'utf8');
    if (pattern.test(content)) foundIn.push(indexFile);
  }

  if (foundIn.length === 0) {
    findings.push(`- [${adrFile}:${lineNum}] ADR id '${adrId}' does not appear in any index-<service>.md under '${adrsDir}' (rule: ADR guidelines §1.3)`);
  } else if (foundIn.length > 1) {
    findings.push(`- [${adrFile}:${lineNum}] ADR id '${adrId}' appears in ${foundIn.length} index files (${foundIn.join(', ')}) — must appear in exactly one (rule: ADR guidelines §1.3)`);
  }

  return findings;
}

// =============================================================================
// A-17: validate-adr-title-match
// Checks frontmatter title equals H1 text after stripping "ADR-NNN: " prefix.
// Rule: ADR guidelines §2.2
// =============================================================================
function checkTitleMatch(lines, adrFile) {
  const findings = [];
  const { value: fmTitle } = extractFrontmatterField(lines, 'title');

  if (!fmTitle) {
    findings.push(`- [${adrFile}:1] Frontmatter field 'title' not found — cannot check title match (rule: ADR guidelines §2.2)`);
    return findings;
  }

  const { text: h1Text, lineNum: h1Line } = findH1Text(lines);
  if (!h1Text) {
    findings.push(`- [${adrFile}:1] No H1 heading found in document body (rule: ADR guidelines §2.2)`);
    return findings;
  }

  // Strip "ADR-NNN: " prefix (colon is the ADR separator per guidelines §2.2)
  const stripped = h1Text.replace(/^ADR-\d{3}:\s+/, '');
  if (stripped !== fmTitle) {
    findings.push(
      `- [${adrFile}:${h1Line}] H1 title after stripping 'ADR-NNN: ' prefix is '${stripped}' but frontmatter 'title' is '${fmTitle}' — they must match exactly (rule: ADR guidelines §2.2)`
    );
  }

  return findings;
}

// =============================================================================
// A-18: validate-adr-h1-format
// Checks H1 uses a colon (:) as separator, not em-dash or hyphen-minus.
// Rule: ADR guidelines §2.2
// =============================================================================
function checkH1Format(lines, adrFile) {
  const findings = [];
  const { line: h1Line, lineNum } = findH1Line(lines);

  if (!h1Line) {
    findings.push(`- [${adrFile}:1] No H1 heading found in document body (rule: ADR guidelines §2.2)`);
    return findings;
  }

  // Expected: # ADR-NNN: Title
  const colonPattern = /^#\s+ADR-\d{3}:\s+\S/;

  if (!colonPattern.test(h1Line)) {
    if (/^#\s+ADR-\d{3}\s+\u2014\s+/.test(h1Line)) {
      findings.push(`- [${adrFile}:${lineNum}] H1 uses an em-dash '—' as separator — ADR headings must use a colon ':' (rule: ADR guidelines §2.2)`);
    } else if (/^#\s+ADR-\d{3}\s+-\s+/.test(h1Line)) {
      findings.push(`- [${adrFile}:${lineNum}] H1 uses a hyphen-minus '-' as separator — ADR headings must use a colon ':' (rule: ADR guidelines §2.2)`);
    } else if (!/^#\s+ADR-\d{3}/.test(h1Line)) {
      findings.push(`- [${adrFile}:${lineNum}] H1 does not start with '# ADR-NNN' pattern: '${h1Line.slice(0, 80)}' (rule: ADR guidelines §2.2)`);
    } else {
      findings.push(`- [${adrFile}:${lineNum}] H1 separator is not a colon ':': '${h1Line.slice(0, 80)}' — expected '# ADR-NNN: Title' (rule: ADR guidelines §2.2)`);
    }
  }

  return findings;
}

// =============================================================================
// A-19: validate-adr-status
// Checks 'status' ∈ {proposed, accepted, deprecated} or starts with
// "superseded by ADR-".
// Rule: ADR guidelines §3
// =============================================================================
function checkStatus(lines, adrFile) {
  const findings        = [];
  const VALID           = new Set(['proposed', 'accepted', 'deprecated']);
  const SUPERSEDED_RE   = /^superseded by ADR-/i;
  const { value: status, lineNum } = extractFrontmatterField(lines, 'status');

  if (!status) {
    findings.push(`- [${adrFile}:1] Frontmatter field 'status' not found (rule: ADR guidelines §3)`);
    return findings;
  }

  if (!VALID.has(status) && !SUPERSEDED_RE.test(status)) {
    findings.push(
      `- [${adrFile}:${lineNum}] 'status' is '${status}' — must be one of: ${[...VALID].join(', ')}, or start with 'superseded by ADR-' (rule: ADR guidelines §3)`
    );
  }

  return findings;
}

// =============================================================================
// A-20: validate-adr-service
// Checks 'service' is one of the valid values dynamically extracted from indices.
// Rule: ADR guidelines §1.1, §5
// =============================================================================
function checkService(lines, adrFile, adrsDir) {
  const findings = [];
  const { value: service, lineNum } = extractFrontmatterField(lines, 'service');

  if (!service) {
    findings.push(`- [${adrFile}:1] Frontmatter field 'service' not found (rule: ADR guidelines §1.1)`);
    return findings;
  }

  let validServices = new Set();
  if (adrsDir && fs.existsSync(path.resolve(adrsDir))) {
    const indexFiles = fs.readdirSync(path.resolve(adrsDir)).filter(f => /^index-[a-z-]+\.md$/.test(f));
    indexFiles.forEach(f => {
      const match = f.match(/^index-([a-z-]+)\.md$/);
      if (match) validServices.add(match[1]);
    });
  }

  // Fallback if directory isn't readable or has no index files yet
  if (validServices.size === 0) {
    return findings;
  }

  if (!validServices.has(service)) {
    findings.push(
      `- [${adrFile}:${lineNum}] 'service' is '${service}' — must be one of: ${[...validServices].join(', ')} (rule: ADR guidelines §1.1 §5)`
    );
  }

  return findings;
}

// =============================================================================
// A-21: validate-adr-milestone
// Checks 'milestone' is present. ADRs dated before 2026-04-17 are exempt.
// Rule: ADR guidelines §1.1
// =============================================================================
function checkMilestone(lines, adrFile) {
  const findings        = [];
  const THRESHOLD_DATE  = new Date('2026-04-17T00:00:00Z');
  const { value: dateStr, lineNum: dateLineNum } = extractFrontmatterField(lines, 'date');

  // Check exemption by date
  if (dateStr) {
    const adrDate = new Date(dateStr + 'T00:00:00Z');
    if (!isNaN(adrDate.getTime()) && adrDate < THRESHOLD_DATE) {
      // Exempt — PASS, but emit an informational note to stdout
      console.log(`# NOTE: [${path.basename(adrFile)}:${dateLineNum}] milestone absent but ADR dated ${dateStr} is exempt (pre-2026-04-17 legacy exception)`);
      return findings;
    }
  }

  // Not exempt — milestone must be present
  const { value: milestone } = extractFrontmatterField(lines, 'milestone');
  if (!milestone) {
    findings.push(
      `- [${adrFile}:1] Frontmatter field 'milestone' is missing — required for ADRs dated 2026-04-17 or later (rule: ADR guidelines §1.1)`
    );
  }

  return findings;
}

// =============================================================================
// A-22: validate-adr-options
// Checks "## Considered Options" has at least 2 numbered entries.
// Rule: ADR guidelines §2.3
// =============================================================================
function checkOptions(lines, adrFile) {
  const findings  = [];
  const bodyStart = findBodyStart(lines);

  const optionsPattern = /^##\s+(Considered Options)/i;
  const nextH2Pattern  = /^##\s+/;
  let sectionStart = -1;
  let sectionEnd   = lines.length;

  for (let i = bodyStart; i < lines.length; i++) {
    if (sectionStart === -1 && optionsPattern.test(lines[i])) {
      sectionStart = i + 1;
      continue;
    }
    if (sectionStart !== -1 && nextH2Pattern.test(lines[i])) {
      sectionEnd = i;
      break;
    }
  }

  if (sectionStart === -1) {
    findings.push(`- [${adrFile}:1] '## Considered Options' section not found (rule: ADR guidelines §2.3)`);
    return findings;
  }

  const numberedEntryPattern = /^\d+\.\s+/;
  let count = 0;

  for (let i = sectionStart; i < sectionEnd; i++) {
    const line = lines[i].trim();
    if (numberedEntryPattern.test(line) && line.length > 3) count++;
  }

  if (count < 2) {
    findings.push(
      `- [${adrFile}:${sectionStart + 1}] 'Considered Options' section has ${count} numbered entry/entries — at least 2 are required (rule: ADR guidelines §2.3)`
    );
  }

  return findings;
}

// =============================================================================
// A-23: validate-adr-bad-consequence
// Checks every **BAD:** entry in Consequences has a *Mitigated:* or
// *Acceptable:* sub-bullet immediately following it.
// Rule: ADR guidelines §2.4
// =============================================================================
function checkBadConsequence(lines, adrFile) {
  const findings  = [];
  const bodyStart = findBodyStart(lines);

  const BAD_PATTERN        = /^\s*-\s+\*\*BAD:\*\*/;
  const MITIGATION_PATTERN = /^\s{2,}-\s+\*(Mitigated|Acceptable):/;

  // Find ### Consequences section
  const consequencesPattern = /^###\s+Consequences/i;
  const nextH2Or3Pattern    = /^#{2,3}\s+/;
  let sectionStart = -1;
  let sectionEnd   = lines.length;

  for (let i = bodyStart; i < lines.length; i++) {
    if (sectionStart === -1 && consequencesPattern.test(lines[i])) {
      sectionStart = i + 1;
      continue;
    }
    if (sectionStart !== -1 && nextH2Or3Pattern.test(lines[i])) {
      sectionEnd = i;
      break;
    }
  }

  // No Consequences section — caught by A-26; PASS here
  if (sectionStart === -1) return findings;

  let badCount              = 0;
  let validBadCount         = 0;
  const badMissingSubBullet = [];

  for (let i = sectionStart; i < sectionEnd; i++) {
    if (!BAD_PATTERN.test(lines[i])) continue;

    badCount++;
    const lineNum = i + 1;
    let found = false;

    for (let j = i + 1; j < sectionEnd && j <= i + 5; j++) {
      const nextLine = lines[j];
      if (nextLine.trim() === '') continue;
      if (MITIGATION_PATTERN.test(nextLine)) found = true;
      break;
    }

    if (found) {
      validBadCount++;
    } else {
      badMissingSubBullet.push(lineNum);
    }
  }

  // No BAD entries at all — valid (Consequences MAY have zero BADs)
  if (badCount === 0) return findings;

  if (validBadCount === 0) {
    findings.push(
      `- [${adrFile}:${badMissingSubBullet[0]}] No **BAD:** entry has an immediately following *Mitigated:* or *Acceptable:* sub-bullet — at least one is required (rule: ADR guidelines §2.4)`
    );
    for (let k = 1; k < badMissingSubBullet.length; k++) {
      findings.push(
        `- [${adrFile}:${badMissingSubBullet[k]}] **BAD:** entry is missing its *Mitigated:* or *Acceptable:* sub-bullet (rule: ADR guidelines §2.4)`
      );
    }
  } else {
    // At least one valid BAD; report each missing sub-bullet (ALL BADs require one per §2.4)
    for (const ln of badMissingSubBullet) {
      findings.push(
        `- [${adrFile}:${ln}] **BAD:** entry is missing its required *Mitigated:* or *Acceptable:* sub-bullet (rule: ADR guidelines §2.4)`
      );
    }
  }

  return findings;
}

// =============================================================================
// A-24: validate-adr-no-tbd
// When status is 'accepted', body must not contain TBD, TO-DO, or
// [to be defined].
// Rule: ADR guidelines §3
// =============================================================================
function checkNoTbd(lines, adrFile) {
  const findings = [];
  const { value: status } = extractFrontmatterField(lines, 'status');

  // Only 'accepted' triggers the TBD blocker
  if (status !== 'accepted') return findings;

  const FORBIDDEN = [
    { re: /\bTBD\b/gi,            label: 'TBD' },
    { re: /\bTO-DO\b/gi,          label: 'TO-DO' },
    { re: /\[to be defined\]/gi,  label: '[to be defined]' },
  ];

  const bodyStart = findBodyStart(lines);

  for (let i = bodyStart; i < lines.length; i++) {
    const line    = lines[i];
    const lineNum = i + 1;
    for (const { re, label } of FORBIDDEN) {
      re.lastIndex = 0;
      if (re.test(line)) {
        findings.push(
          `- [${adrFile}:${lineNum}] Forbidden placeholder '${label}' found — not allowed when status is 'accepted' (rule: ADR guidelines §3)`
        );
      }
    }
  }

  return findings;
}

// =============================================================================
// A-25: validate-adr-in-index  (requires adrsDir)
// Checks the ADR file appears by filename in exactly one index-<service>.md.
// Rule: ADR guidelines §6
// =============================================================================
function checkInIndex(lines, adrFile, adrsDir) {
  const findings   = [];
  const absAdrsDir = path.resolve(adrsDir);

  if (!fs.existsSync(absAdrsDir)) {
    findings.push(`- [${adrsDir}:0] ADRs directory not found (rule: ADR guidelines §6)`);
    return findings;
  }

  const basename   = path.basename(path.resolve(adrFile));
  const indexFiles = fs.readdirSync(absAdrsDir).filter(f => /^index-[a-z-]+\.md$/.test(f));

  if (indexFiles.length === 0) {
    findings.push(`- [${adrsDir}:0] No index-<service>.md files found in ADRs directory (rule: ADR guidelines §6)`);
    return findings;
  }

  const foundIn     = [];
  const escapedName = basename.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
  const pattern     = new RegExp(escapedName);

  for (const indexFile of indexFiles) {
    const content = fs.readFileSync(path.join(absAdrsDir, indexFile), 'utf8');
    if (pattern.test(content)) foundIn.push(indexFile);
  }

  if (foundIn.length === 0) {
    findings.push(`- [${adrFile}:0] File '${basename}' does not appear in any index-<service>.md under '${adrsDir}' (rule: ADR guidelines §6)`);
  } else if (foundIn.length > 1) {
    findings.push(`- [${adrFile}:0] File '${basename}' appears in ${foundIn.length} index files (${foundIn.join(', ')}) — must appear in exactly one (rule: ADR guidelines §6)`);
  }

  return findings;
}

// =============================================================================
// A-26: validate-adr-sections
// Checks mandatory sections are present and in the required order.
// Rule: ADR guidelines §2.1
// =============================================================================
function checkSections(lines, adrFile) {
  const findings  = [];
  const bodyStart = findBodyStart(lines);

  const H2_SECTIONS = [
    { key: 'context',  label: 'Context and Problem Statement', patterns: [/context and problem statement/i] },
    { key: 'options',  label: 'Considered Options',            patterns: [/considered options/i] },
    { key: 'outcome',  label: 'Decision Outcome',              patterns: [/decision outcome/i] },
    { key: 'sources',  label: 'Sources',                       patterns: [/^sources$/i] },
  ];

  const CANONICAL_ORDER = ['context', 'options', 'outcome', 'sources'];

  // Collect H2 headings
  const h2Pattern = /^##\s+(.+)/;
  const h2Found   = []; // { key, label, lineNum }

  for (let i = bodyStart; i < lines.length; i++) {
    const m = h2Pattern.exec(lines[i]);
    if (!m) continue;
    const headingText = m[1].trim();
    const lineNum     = i + 1;

    for (const sec of H2_SECTIONS) {
      if (sec.patterns.some(p => p.test(headingText))) {
        h2Found.push({ key: sec.key, label: sec.label, lineNum });
        break;
      }
    }
  }

  // Check mandatory sections are present
  for (const sec of H2_SECTIONS) {
    if (!h2Found.find(h => h.key === sec.key)) {
      findings.push(`- [${adrFile}:1] Mandatory section '${sec.label}' (## heading) not found (rule: ADR guidelines §2.1)`);
    }
  }

  // Check relative order
  const appearedKeys   = h2Found.map(h => h.key);
  let lastCanonicalIdx = -1;

  for (const appeared of h2Found) {
    const canonIdx = CANONICAL_ORDER.indexOf(appeared.key);
    if (canonIdx === -1) continue;

    if (canonIdx < lastCanonicalIdx) {
      const expected = CANONICAL_ORDER
        .slice(canonIdx + 1, lastCanonicalIdx + 1)
        .filter(k => appearedKeys.includes(k))
        .map(k => H2_SECTIONS.find(s => s.key === k).label)
        .join(', ');
      findings.push(
        `- [${adrFile}:${appeared.lineNum}] Section '${appeared.label}' appears out of order — it must come before: ${expected || 'preceding sections'} (rule: ADR guidelines §2.1)`
      );
    } else {
      lastCanonicalIdx = canonIdx;
    }
  }

  // Check that ### Consequences exists within the Decision Outcome section
  const outcomeEntry = h2Found.find(h => h.key === 'outcome');
  const sourcesEntry = h2Found.find(h => h.key === 'sources');

  if (outcomeEntry) {
    const sectionEnd          = sourcesEntry ? sourcesEntry.lineNum : lines.length;
    const consequencesPattern = /^###\s+Consequences/i;
    let consequencesFound     = false;

    for (let i = outcomeEntry.lineNum; i < sectionEnd; i++) {
      if (consequencesPattern.test(lines[i])) {
        consequencesFound = true;
        break;
      }
    }

    if (!consequencesFound) {
      findings.push(
        `- [${adrFile}:${outcomeEntry.lineNum}] '### Consequences' sub-section not found within Decision Outcome section (rule: ADR guidelines §2.1)`
      );
    }
  }

  return findings;
}

// =============================================================================
// Main
// =============================================================================
function main() {
  const [,, adrFile, adrsDir] = process.argv;

  if (!adrFile) {
    console.error('Usage: validate-adr.js <adr-file> [adrs-dir]');
    process.exit(1);
  }

  const absPath = path.resolve(adrFile);
  if (!fs.existsSync(absPath)) {
    console.log('FAIL');
    console.log(`- [${adrFile}:0] File not found`);
    process.exit(1);
  }

  // Read the file ONCE
  const content = fs.readFileSync(absPath, 'utf8');
  const lines   = content.split('\n');

  // Accumulate all findings
  const allFindings = [];

  // A-14b — filename check (no file content required; runs before all other checks)
  allFindings.push(...checkFilename(adrFile));               // A-14b

  // A-15 through A-24, A-26 — always run
  allFindings.push(...checkFrontmatter(lines, adrFile));     // A-15
  allFindings.push(...checkTitleMatch(lines, adrFile));      // A-17
  allFindings.push(...checkH1Format(lines, adrFile));        // A-18
  allFindings.push(...checkStatus(lines, adrFile));          // A-19
  allFindings.push(...checkService(lines, adrFile, adrsDir)); // A-20 (Updated to pass adrsDir)
  allFindings.push(...checkMilestone(lines, adrFile));       // A-21
  allFindings.push(...checkOptions(lines, adrFile));         // A-22
  allFindings.push(...checkBadConsequence(lines, adrFile));  // A-23
  allFindings.push(...checkNoTbd(lines, adrFile));           // A-24
  allFindings.push(...checkSections(lines, adrFile));        // A-26

  // A-16 and A-25 — only run when adrsDir is provided
  if (adrsDir) {
    allFindings.push(...checkIdUnique(lines, adrFile, adrsDir));  // A-16
    allFindings.push(...checkInIndex(lines, adrFile, adrsDir));   // A-25
  }

  if (allFindings.length === 0) {
    console.log('PASS');
    process.exit(0);
  } else {
    console.log('FAIL');
    allFindings.forEach(f => console.log(f));
    process.exit(1);
  }
}

main();