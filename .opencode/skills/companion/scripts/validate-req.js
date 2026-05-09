#!/usr/bin/env node

// validate-req.js — unified REQ validator
// Runs all 15 REQ checks (A-00 through A-14) in a single process.
// Usage: node validate-req.js <req-file> [requirements-dir]
// If requirements-dir is omitted, checks A-02 (id-unique) and A-11 (in-index) are skipped.

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
        // Possible YAML block array — look ahead for "  - item" lines
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
        // Inline array: ["a", "b"] or [a, b]
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
 * Find the first H1 heading after frontmatter.
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
// A-00: validate-req-filename
// Checks the basename of the file matches REQ-NNN-<kebab-case-title>.md.
// Inserted FIRST because it operates solely on the path — no file content needed —
// and a wrong filename is a hard structural error that should fail before any
// parsing is attempted. This keeps frontmatter checks (A-01+) focused on content.
// Rule: REQ guidelines §2 filename convention
// =============================================================================
function checkFilename(reqFile) {
  const findings = [];
  const basename  = path.basename(reqFile);

  if (!/^REQ-\d{3}-.+\.md$/.test(basename)) {
    findings.push(`- [${basename}:0] filename does not match REQ-NNN-<kebab-case-title>.md pattern (rule: REQ guidelines §2 filename convention)`);
  }

  return findings;
}

// =============================================================================
// A-01: validate-req-frontmatter
// Checks all mandatory frontmatter fields are present and non-empty.
// Rule: REQ guidelines §1.1, §1.3
// =============================================================================
function checkFrontmatter(lines, reqFile) {
  const findings = [];

  if (!lines[0] || lines[0].trim() !== '---') {
    findings.push(`- [${reqFile}:1] No YAML frontmatter block found — file must start with --- (rule: REQ guidelines §1.1)`);
    return findings;
  }

  const { fields } = parseFrontmatter(lines);
  const MANDATORY = ['id', 'title', 'status', 'domain', 'milestone', 'priority', 'author'];

  for (const field of MANDATORY) {
    if (!fields.has(field)) {
      findings.push(`- [${reqFile}:1] Mandatory frontmatter field '${field}' is missing (rule: REQ guidelines §1.1)`);
      continue;
    }
    const val = fields.get(field);
    const isEmpty = Array.isArray(val) ? val.length === 0 : val === '';
    if (isEmpty) {
      findings.push(`- [${reqFile}:1] Mandatory frontmatter field '${field}' is present but empty (rule: REQ guidelines §1.1)`);
    }
  }

  // author must contain at least one human name (not only Agent: entries)
  if (fields.has('author')) {
    const authorVal = fields.get('author');
    const authors   = Array.isArray(authorVal) ? authorVal : [authorVal];
    const nonAgent  = authors.filter(a => a && !a.startsWith('Agent:'));
    if (nonAgent.length === 0) {
      findings.push(`- [${reqFile}:1] 'author' must contain at least one human name (not just Agent entries) (rule: REQ guidelines §1.3)`);
    }
  }

  return findings;
}

// =============================================================================
// A-02: validate-req-id-unique  (requires requirementsDir)
// Checks that the REQ id appears in exactly one index-<domain>.md.
// Rule: REQ guidelines §1.4
// =============================================================================
function checkIdUnique(lines, reqFile, requirementsDir) {
  const findings = [];
  const { value: reqId, lineNum } = extractFrontmatterField(lines, 'id');

  if (!reqId) {
    findings.push(`- [${reqFile}:1] Frontmatter field 'id' not found — cannot check uniqueness (rule: REQ guidelines §1.4)`);
    return findings;
  }

  const absReqDir = path.resolve(requirementsDir);
  if (!fs.existsSync(absReqDir)) {
    findings.push(`- [${requirementsDir}:0] Requirements directory not found (rule: REQ guidelines §1.4)`);
    return findings;
  }

  const indexFiles = fs.readdirSync(absReqDir).filter(f => /^index-[a-z-]+\.md$/.test(f));
  const foundIn    = [];
  const escapedId  = reqId.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
  const pattern    = new RegExp(`\\b${escapedId}\\b`);

  for (const indexFile of indexFiles) {
    const content = fs.readFileSync(path.join(absReqDir, indexFile), 'utf8');
    if (pattern.test(content)) foundIn.push(indexFile);
  }

  if (foundIn.length === 0) {
    findings.push(`- [${reqFile}:${lineNum}] REQ id '${reqId}' does not appear in any index-<domain>.md file under '${requirementsDir}' (rule: REQ guidelines §1.4)`);
  } else if (foundIn.length > 1) {
    findings.push(`- [${reqFile}:${lineNum}] REQ id '${reqId}' appears in ${foundIn.length} index files (${foundIn.join(', ')}) — must appear in exactly one (rule: REQ guidelines §1.4)`);
  }

  return findings;
}

// =============================================================================
// A-03: validate-req-title-match
// Checks frontmatter title equals H1 text after stripping "REQ-NNN — " prefix.
// Rule: REQ guidelines §2.3
// =============================================================================
function checkTitleMatch(lines, reqFile) {
  const findings = [];
  const { value: fmTitle } = extractFrontmatterField(lines, 'title');

  if (!fmTitle) {
    findings.push(`- [${reqFile}:1] Frontmatter field 'title' not found — cannot check title match (rule: REQ guidelines §2.3)`);
    return findings;
  }

  const { text: h1Text, lineNum: h1Line } = findH1Text(lines);
  if (!h1Text) {
    findings.push(`- [${reqFile}:1] No H1 heading found in document body (rule: REQ guidelines §2.3)`);
    return findings;
  }

  // Strip "REQ-NNN — " prefix (em-dash U+2014; also tolerate plain hyphen for better error msg)
  const stripped = h1Text.replace(/^REQ-\d{3}\s+[—\-]\s+/, '');
  if (stripped !== fmTitle) {
    findings.push(
      `- [${reqFile}:${h1Line}] H1 title after stripping 'REQ-NNN — ' prefix is '${stripped}' but frontmatter 'title' is '${fmTitle}' — they must match exactly (rule: REQ guidelines §2.3)`
    );
  }

  return findings;
}

// =============================================================================
// A-04: validate-req-h1-format
// Checks H1 uses em-dash (U+2014) as separator, not hyphen-minus or colon.
// Rule: REQ guidelines §2.3
// =============================================================================
function checkH1Format(lines, reqFile) {
  const findings = [];
  const { line: h1Line, lineNum } = findH1Line(lines);

  if (!h1Line) {
    findings.push(`- [${reqFile}:1] No H1 heading found in document body (rule: REQ guidelines §2.3)`);
    return findings;
  }

  // Expected pattern: # REQ-NNN — Title  (U+2014 em-dash)
  const emDashPattern = /^#\s+REQ-\d{3}\s+\u2014\s+\S/;

  if (!emDashPattern.test(h1Line)) {
    if (/^#\s+REQ-\d{3}\s*:\s*/.test(h1Line)) {
      findings.push(`- [${reqFile}:${lineNum}] H1 uses a colon ':' as separator — must use em-dash '—' (U+2014) (rule: REQ guidelines §2.3)`);
    } else if (/^#\s+REQ-\d{3}\s+-\s+/.test(h1Line)) {
      findings.push(`- [${reqFile}:${lineNum}] H1 uses a hyphen-minus '-' as separator — must use em-dash '—' (U+2014) (rule: REQ guidelines §2.3)`);
    } else if (!/^#\s+REQ-\d{3}/.test(h1Line)) {
      findings.push(`- [${reqFile}:${lineNum}] H1 does not start with '# REQ-NNN' pattern: '${h1Line.slice(0, 80)}' (rule: REQ guidelines §2.3)`);
    } else {
      findings.push(`- [${reqFile}:${lineNum}] H1 separator is not a proper em-dash '—' (U+2014): '${h1Line.slice(0, 80)}' (rule: REQ guidelines §2.3)`);
    }
  }

  return findings;
}

// =============================================================================
// A-05: validate-req-status
// Checks 'status' is one of the valid lifecycle values.
// Rule: REQ guidelines §3
// =============================================================================
function checkStatus(lines, reqFile) {
  const findings = [];
  const VALID = new Set(['draft', 'accepted', 'implemented', 'delivered', 'cancelled', 'superseded']);
  const { value: status, lineNum } = extractFrontmatterField(lines, 'status');

  if (!status) {
    findings.push(`- [${reqFile}:1] Frontmatter field 'status' not found (rule: REQ guidelines §3)`);
    return findings;
  }

  if (!VALID.has(status)) {
    findings.push(`- [${reqFile}:${lineNum}] 'status' is '${status}' — must be one of: ${[...VALID].join(', ')} (rule: REQ guidelines §3)`);
  }

  return findings;
}

// =============================================================================
// A-06: validate-req-domain
// Checks 'domain' is one of the valid values dynamically extracted from indices.
// Rule: REQ guidelines §1.1
// =============================================================================
function checkDomain(lines, reqFile, requirementsDir) {
  const findings = [];
  const { value: domain, lineNum } = extractFrontmatterField(lines, 'domain');

  if (!domain) {
    findings.push(`- [${reqFile}:1] Frontmatter field 'domain' not found (rule: REQ guidelines §1.1)`);
    return findings;
  }

  let validDomains = new Set();
  if (requirementsDir && fs.existsSync(path.resolve(requirementsDir))) {
    const indexFiles = fs.readdirSync(path.resolve(requirementsDir)).filter(f => /^index-[a-z-]+\.md$/.test(f));
    indexFiles.forEach(f => {
      const match = f.match(/^index-([a-z-]+)\.md$/);
      if (match) validDomains.add(match[1]);
    });
  }

  // Fallback if directory isn't readable or has no index files yet
  if (validDomains.size === 0) {
    return findings;
  }

  if (!validDomains.has(domain)) {
    findings.push(`- [${reqFile}:${lineNum}] 'domain' is '${domain}' — must be one of: ${[...validDomains].join(', ')} (rule: REQ guidelines §1.1)`);
  }

  return findings;
}

// =============================================================================
// A-07: validate-req-priority
// Checks 'priority' is one of the MoSCoW values.
// Rule: REQ guidelines §1.1
// =============================================================================
function checkPriority(lines, reqFile) {
  const findings = [];
  const VALID = new Set(['must', 'should', 'could', 'wont']);
  const { value: priority, lineNum } = extractFrontmatterField(lines, 'priority');

  if (!priority) {
    findings.push(`- [${reqFile}:1] Frontmatter field 'priority' not found (rule: REQ guidelines §1.1)`);
    return findings;
  }

  if (!VALID.has(priority)) {
    findings.push(`- [${reqFile}:${lineNum}] 'priority' is '${priority}' — must be one of: ${[...VALID].join(', ')} (MoSCoW values; rule: REQ guidelines §1.1)`);
  }

  return findings;
}

// =============================================================================
// A-08: validate-req-rfc2119
// Detects lowercase RFC 2119 keywords inside the Functional Requirements section.
// Rule: REQ guidelines §4.1
// =============================================================================
function checkRfc2119(lines, reqFile) {
  const findings  = [];
  const bodyStart = findBodyStart(lines);

  // Find the Functional Requirements section (## 2. ...) and its line range
  const frHeadingPattern = /^##\s+(2[.\s]|Functional Requirements)/i;
  const nextH2Pattern    = /^##\s+/;
  let frStart = -1;
  let frEnd   = lines.length;

  for (let i = bodyStart; i < lines.length; i++) {
    if (frStart === -1 && frHeadingPattern.test(lines[i])) {
      frStart = i + 1;
      continue;
    }
    if (frStart !== -1 && nextH2Pattern.test(lines[i])) {
      frEnd = i;
      break;
    }
  }

  // No FR section — structural error caught by A-13; PASS here
  if (frStart === -1) return findings;

  // RFC 2119 lowercase keyword patterns (order matters: "shall not" before "shall")
  const LOWERCASE_KEYWORDS = [
    /\bshall not\b/g,
    /\bshall\b/g,
    /\bshould not\b/g,
    /\bshould\b/g,
    /\bmay not\b/g,
    /\bmay\b/g,
  ];

  for (let i = frStart; i < frEnd; i++) {
    const line    = lines[i];
    const lineNum = i + 1;

    for (const kwRegex of LOWERCASE_KEYWORDS) {
      kwRegex.lastIndex = 0;
      let match;
      while ((match = kwRegex.exec(line)) !== null) {
        if (match[0] === match[0].toLowerCase()) {
          findings.push(
            `- [${reqFile}:${lineNum}] Lowercase RFC 2119 keyword '${match[0]}' — must be capitalised '${match[0].toUpperCase()}' in Functional Requirements (rule: REQ guidelines §4.1)`
          );
        }
      }
    }
  }

  return findings;
}

// =============================================================================
// A-09: validate-req-ac-coverage
// Checks every active REQ-F-NNN has at least one AC-NNN in the document.
// Rule: REQ guidelines §2.6
//
// NOTE: This check emits ATTENTION lines to stdout rather than contributing to
// a FAIL result. AC coverage requires domain judgment — the script can detect
// missing IDs but cannot verify that an AC correctly represents its FR or that
// ACs are not duplicated. ATTENTION lines are printed even when the overall
// result is PASS so reviewers can verify coverage manually.
// =============================================================================
function checkAcCoverage(lines, reqFile) {
  const findings  = [];
  const bodyStart = findBodyStart(lines);

  // Collect active FR definitions
  const frIds         = new Map(); // frId → { lineNum, removed }
  const frDefPattern  = /\bREQ-F-(\d{3})\b/g;
  const removedHint   = /\*\(removed|removed\s*—|^\s*-\s+\*\(removed/i;

  for (let i = bodyStart; i < lines.length; i++) {
    const line    = lines[i];
    const lineNum = i + 1;
    frDefPattern.lastIndex = 0;
    let match;

    while ((match = frDefPattern.exec(line)) !== null) {
      const frId         = `REQ-F-${match[1]}`;
      const isDefinition = /\*\*REQ-F-\d{3}/.test(line) ||
                           /^[-*]\s+\*\*REQ-F-\d{3}/.test(line.trim()) ||
                           /^-\s+\*\*REQ-F-\d{3}/.test(line.trim());

      if (isDefinition && !frIds.has(frId)) {
        frIds.set(frId, { lineNum, removed: removedHint.test(line) });
      }
    }
  }

  // Collect AC-NNN identifiers
  const acIds     = new Set();
  const acPattern = /\bAC-(\d{3})\b/g;

  for (let i = bodyStart; i < lines.length; i++) {
    acPattern.lastIndex = 0;
    let match;
    while ((match = acPattern.exec(lines[i])) !== null) {
      acIds.add(`AC-${match[1]}`);
    }
  }

  const activeFrs = [...frIds.entries()].filter(([, v]) => !v.removed);

  // No active FRs — structural issue caught by A-13; PASS here
  if (activeFrs.length === 0) return findings;

  if (acIds.size === 0) {
    console.log(
      `# ATTENTION: [${reqFile}:1] No AC-NNN identifiers found in document — ${activeFrs.length} active FR(s) require at least one AC each — verify AC coverage manually (rule: REQ guidelines §2.6)`
    );
  } else if (acIds.size < activeFrs.length) {
    activeFrs.forEach(([frId, { lineNum }]) => {
      console.log(
        `# ATTENTION: [${reqFile}:${lineNum}] ${frId} has no corresponding AC — verify AC coverage manually (rule: REQ guidelines §2.6)`
      );
    });
  }

  return findings;
}

// =============================================================================
// A-10: validate-req-no-tbd
// When status ∈ {accepted, implemented, delivered}, body must not contain
// TBD, TO-DO, or [to be defined].
// Rule: REQ guidelines §3
// =============================================================================
function checkNoTbd(lines, reqFile) {
  const findings = [];
  const BLOCKING = new Set(['accepted', 'implemented', 'delivered']);
  const { value: status } = extractFrontmatterField(lines, 'status');

  if (!status || !BLOCKING.has(status)) return findings;

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
          `- [${reqFile}:${lineNum}] Forbidden placeholder '${label}' found — not allowed when status is '${status}' (rule: REQ guidelines §3)`
        );
      }
    }
  }

  return findings;
}

// =============================================================================
// A-11: validate-req-in-index  (requires requirementsDir)
// Checks the REQ file appears by filename in exactly one index-<domain>.md.
// Rule: REQ guidelines §6
// =============================================================================
function checkInIndex(lines, reqFile, requirementsDir) {
  const findings  = [];
  const absReqDir = path.resolve(requirementsDir);

  if (!fs.existsSync(absReqDir)) {
    findings.push(`- [${requirementsDir}:0] Requirements directory not found (rule: REQ guidelines §6)`);
    return findings;
  }

  const basename   = path.basename(path.resolve(reqFile));
  const indexFiles = fs.readdirSync(absReqDir).filter(f => /^index-[a-z-]+\.md$/.test(f));

  if (indexFiles.length === 0) {
    findings.push(`- [${requirementsDir}:0] No index-<domain>.md files found in requirements directory (rule: REQ guidelines §6)`);
    return findings;
  }

  const foundIn     = [];
  const escapedName = basename.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
  const pattern     = new RegExp(escapedName);

  for (const indexFile of indexFiles) {
    const content = fs.readFileSync(path.join(absReqDir, indexFile), 'utf8');
    if (pattern.test(content)) foundIn.push(indexFile);
  }

  if (foundIn.length === 0) {
    findings.push(`- [${reqFile}:0] File '${basename}' does not appear in any index-<domain>.md under '${requirementsDir}' (rule: REQ guidelines §6)`);
  } else if (foundIn.length > 1) {
    findings.push(`- [${reqFile}:0] File '${basename}' appears in ${foundIn.length} index files (${foundIn.join(', ')}) — must appear in exactly one (rule: REQ guidelines §6)`);
  }

  return findings;
}

// =============================================================================
// A-12: validate-req-id-gaps
// Detects duplicate REQ-F-NNN or AC-NNN identifiers (gaps are valid).
// Rule: REQ guidelines §2.4, §2.6
// =============================================================================
function checkIdGaps(lines, reqFile) {
  const findings  = [];
  const bodyStart = findBodyStart(lines);

  // REQ-F-NNN duplicate detection (bold-formatted definitions only)
  const frPattern = /\*\*REQ-F-(\d{3})(?:-R\d+)?\*\*/g;
  const frSeenAt  = new Map(); // "REQ-F-NNN" → [lineNums]

  for (let i = bodyStart; i < lines.length; i++) {
    const line    = lines[i];
    const lineNum = i + 1;
    frPattern.lastIndex = 0;
    let match;

    while ((match = frPattern.exec(line)) !== null) {
      const baseId = `REQ-F-${match[1]}`;
      if (!frSeenAt.has(baseId)) frSeenAt.set(baseId, []);
      frSeenAt.get(baseId).push(lineNum);
    }
  }

  for (const [id, linesArr] of frSeenAt.entries()) {
    const defLines = linesArr.filter(ln => !/\*\(removed|removed\s*—/i.test(lines[ln - 1] || ''));
    if (defLines.length > 1) {
      findings.push(
        `- [${reqFile}:${defLines[1]}] Duplicate FR identifier '${id}' — first defined at line ${defLines[0]}, redefined at line ${defLines[1]} (rule: REQ guidelines gap rule §2.4)`
      );
    }
  }

  // AC-NNN duplicate detection (### AC-NNN headings only)
  const acHeadingPattern = /^###\s+AC-(\d{3})\b/;
  const acSeenAt         = new Map();

  for (let i = bodyStart; i < lines.length; i++) {
    const m = acHeadingPattern.exec(lines[i]);
    if (m) {
      const id = `AC-${m[1]}`;
      if (!acSeenAt.has(id)) acSeenAt.set(id, []);
      acSeenAt.get(id).push(i + 1);
    }
  }

  for (const [id, linesArr] of acSeenAt.entries()) {
    if (linesArr.length > 1) {
      findings.push(
        `- [${reqFile}:${linesArr[1]}] Duplicate AC identifier '${id}' — first defined at line ${linesArr[0]}, redefined at line ${linesArr[1]} (rule: REQ guidelines gap rule §2.6)`
      );
    }
  }

  return findings;
}

// =============================================================================
// A-13: validate-req-sections
// Checks mandatory sections are present and in the required order.
// Rule: REQ guidelines §2.1
// =============================================================================
function checkSections(lines, reqFile) {
  const findings  = [];
  const bodyStart = findBodyStart(lines);

  const SECTION_DEFS = [
    { key: 'problem_statement',      label: 'Problem Statement',           patterns: [/problem statement/i],                                    optional: false },
    { key: 'functional_requirements', label: 'Functional Requirements',    patterns: [/functional requirements/i],                              optional: false },
    { key: 'nfr',                    label: 'Non-Functional Requirements', patterns: [/non-functional requirements/i, /nonfunctional requirements/i], optional: true },
    { key: 'acceptance_criteria',    label: 'Acceptance Criteria',         patterns: [/acceptance criteria/i],                                  optional: false },
    { key: 'out_of_scope',           label: 'Out of Scope',                patterns: [/out of scope/i],                                         optional: false },
    { key: 'dependencies',           label: 'Dependencies',                patterns: [/^dependencies/i],                                        optional: false },
  ];

  const CANONICAL_ORDER = [
    'problem_statement', 'functional_requirements', 'nfr',
    'acceptance_criteria', 'out_of_scope', 'dependencies',
  ];

  // Collect H2 headings (## [N. ]Heading text)
  const h2Pattern = /^##\s+([\d.]+\s+)?(.+)/;
  const h2Found   = []; // { key, label, lineNum }

  for (let i = bodyStart; i < lines.length; i++) {
    const m = h2Pattern.exec(lines[i]);
    if (!m) continue;
    const headingText = m[2].trim();
    const lineNum     = i + 1;

    for (const sec of SECTION_DEFS) {
      if (sec.patterns.some(p => p.test(headingText))) {
        h2Found.push({ key: sec.key, label: sec.label, lineNum });
        break;
      }
    }
  }

  // Check mandatory sections are present
  for (const sec of SECTION_DEFS) {
    if (sec.optional) continue;
    if (!h2Found.find(h => h.key === sec.key)) {
      findings.push(`- [${reqFile}:1] Mandatory section '${sec.label}' (## heading) not found (rule: REQ guidelines §2.1)`);
    }
  }

  // Check relative order
  const appearedKeys    = h2Found.map(h => h.key);
  let lastCanonicalIdx  = -1;

  for (const appeared of h2Found) {
    const canonIdx = CANONICAL_ORDER.indexOf(appeared.key);
    if (canonIdx === -1) continue;

    if (canonIdx < lastCanonicalIdx) {
      const expected = CANONICAL_ORDER
        .slice(canonIdx + 1, lastCanonicalIdx + 1)
        .filter(k => appearedKeys.includes(k))
        .map(k => SECTION_DEFS.find(s => s.key === k).label)
        .join(', ');
      findings.push(
        `- [${reqFile}:${appeared.lineNum}] Section '${appeared.label}' appears out of order — it must come before: ${expected || 'preceding sections'} (rule: REQ guidelines §2.1)`
      );
    } else {
      lastCanonicalIdx = canonIdx;
    }
  }

  // Special rule: NFR (if present) must fall between FR and AC
  const nfrEntry = h2Found.find(h => h.key === 'nfr');
  const frEntry  = h2Found.find(h => h.key === 'functional_requirements');
  const acEntry  = h2Found.find(h => h.key === 'acceptance_criteria');

  if (nfrEntry && frEntry && acEntry) {
    if (!(frEntry.lineNum < nfrEntry.lineNum && nfrEntry.lineNum < acEntry.lineNum)) {
      findings.push(
        `- [${reqFile}:${nfrEntry.lineNum}] Non-Functional Requirements section must appear between Functional Requirements (line ${frEntry.lineNum}) and Acceptance Criteria (line ${acEntry.lineNum}) (rule: REQ guidelines §2.1)`
      );
    }
  }

  return findings;
}

// =============================================================================
// A-14: validate-req-nfr-format
// When a NFR section is present and non-empty, checks the required table headers.
// Rule: REQ guidelines §2.5
// =============================================================================
function checkNfrFormat(lines, reqFile) {
  const findings  = [];
  const bodyStart = findBodyStart(lines);

  const REQUIRED_HEADERS = [
    'ID',
    'Quality Attribute (ISO 25010)',
    'Metric',
    'Target',
    'Condition',
  ];

  // Find NFR section
  const nfrPattern    = /^##\s+(?:[\d.]+\s+)?Non-Functional Requirements/i;
  const nextH2Pattern = /^##\s+/;
  let nfrStart = -1;
  let nfrEnd   = lines.length;

  for (let i = bodyStart; i < lines.length; i++) {
    if (nfrStart === -1 && nfrPattern.test(lines[i])) {
      nfrStart = i;
      continue;
    }
    if (nfrStart !== -1 && nextH2Pattern.test(lines[i])) {
      nfrEnd = i;
      break;
    }
  }

  // No NFR section — optional, nothing to validate
  if (nfrStart === -1) return findings;

  // Check if section is effectively empty
  const nfrBody       = lines.slice(nfrStart + 1, nfrEnd);
  const nonEmptyLines = nfrBody.filter(l => l.trim() !== '' && !/^#/.test(l));
  if (nonEmptyLines.length === 0) return findings;

  // Find first table header row (5+ columns)
  const parseTableRow = line => {
    if (!line.startsWith('|')) return null;
    return line.split('|').slice(1, -1).map(c => c.trim());
  };

  let headerRow     = null;
  let headerLineNum = 0;

  for (let i = nfrStart + 1; i < nfrEnd; i++) {
    const cols = parseTableRow(lines[i]);
    if (cols && cols.length >= 5) {
      headerRow     = cols;
      headerLineNum = i + 1;
      break;
    }
  }

  if (!headerRow) {
    findings.push(
      `- [${reqFile}:${nfrStart + 1}] Non-Functional Requirements section is non-empty but no table found — expected table with headers: ${REQUIRED_HEADERS.join(' | ')} (rule: REQ guidelines §2.5)`
    );
    return findings;
  }

  for (let col = 0; col < REQUIRED_HEADERS.length; col++) {
    const expected = REQUIRED_HEADERS[col];
    const actual   = headerRow[col] !== undefined ? headerRow[col] : '(missing)';
    if (actual !== expected) {
      findings.push(
        `- [${reqFile}:${headerLineNum}] NFR table column ${col + 1} is '${actual}' but must be '${expected}' (rule: REQ guidelines §2.5)`
      );
    }
  }

  if (headerRow.length < REQUIRED_HEADERS.length) {
    findings.push(
      `- [${reqFile}:${headerLineNum}] NFR table has ${headerRow.length} column(s) but requires ${REQUIRED_HEADERS.length}: ${REQUIRED_HEADERS.join(' | ')} (rule: REQ guidelines §2.5)`
    );
  }

  return findings;
}

// =============================================================================
// Main
// =============================================================================
function main() {
  const [,, reqFile, requirementsDir] = process.argv;

  if (!reqFile) {
    console.error('Usage: validate-req.js <req-file> [requirements-dir]');
    process.exit(1);
  }

  const absPath = path.resolve(reqFile);
  if (!fs.existsSync(absPath)) {
    console.log('FAIL');
    console.log(`- [${reqFile}:0] File not found`);
    process.exit(1);
  }

  // Read the file ONCE
  const content = fs.readFileSync(absPath, 'utf8');
  const lines   = content.split('\n');

  // Accumulate all findings
  const allFindings = [];

  // A-00 — filename check (no file content required; runs before all other checks)
  allFindings.push(...checkFilename(reqFile));              // A-00

  // A-01 through A-10, A-12 through A-14 — always run
  allFindings.push(...checkFrontmatter(lines, reqFile));    // A-01
  allFindings.push(...checkTitleMatch(lines, reqFile));     // A-03
  allFindings.push(...checkH1Format(lines, reqFile));       // A-04
  allFindings.push(...checkStatus(lines, reqFile));         // A-05
  allFindings.push(...checkDomain(lines, reqFile, requirementsDir)); // A-06 (Updated to pass requirementsDir)
  allFindings.push(...checkPriority(lines, reqFile));       // A-07
  allFindings.push(...checkRfc2119(lines, reqFile));        // A-08
  checkAcCoverage(lines, reqFile);                           // A-09 — emits ATTENTION to stdout; never contributes to FAIL
  allFindings.push(...checkNoTbd(lines, reqFile));          // A-10
  allFindings.push(...checkIdGaps(lines, reqFile));         // A-12
  allFindings.push(...checkSections(lines, reqFile));       // A-13
  allFindings.push(...checkNfrFormat(lines, reqFile));      // A-14

  // A-02 and A-11 — only run when requirementsDir is provided
  if (requirementsDir) {
    allFindings.push(...checkIdUnique(lines, reqFile, requirementsDir));  // A-02
    allFindings.push(...checkInIndex(lines, reqFile, requirementsDir));   // A-11
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