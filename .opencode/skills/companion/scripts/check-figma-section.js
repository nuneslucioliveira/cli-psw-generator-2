#!/usr/bin/env node
// check-figma-section.js — check if a Section for a REQ already exists on a Figma page
// Used by companion before creating wireframes to detect duplicate Sections.
// Convention: Section names follow "REQ-NNN - name" pattern.
// Uses Figma REST API GET /files/:key/nodes — requires FIGMA_ACCESS_TOKEN in env.
//
// Usage: node check-figma-section.js <fileKey> <pageId> <reqId>
// reqId format: REQ-NNN (e.g. REQ-001)
//
// Output on PASS (no duplicate):
//   PASS
//   # No existing Section found for REQ-NNN on this page
//
// Output on FAIL (duplicate found):
//   FAIL
//   - [figma:section] Section "REQ-NNN - <name>" already exists on this page (rule: no duplicate Sections per REQ)
//   # EXISTING_NODE_ID: <id>
//   # EXISTING_NAME: <name>
//   # FIGMA_LINK: https://www.figma.com/design/<fileKey>/?node-id=<id>
//
// Exit code: 0 for PASS, 1 for FAIL (duplicate found or error)

const https = require('https')
const process = require('process')

const [,, fileKey, pageId, reqId] = process.argv

if (!fileKey || !pageId || !reqId) {
  console.log('FAIL')
  console.log('- [args] usage: node check-figma-section.js <fileKey> <pageId> <reqId> (rule: all arguments required)')
  process.exit(1)
}

if (!/^REQ-\d{3}$/i.test(reqId)) {
  console.log('FAIL')
  console.log(`- [args] reqId "${reqId}" does not match REQ-NNN format (rule: reqId must be REQ-NNN)`)
  process.exit(1)
}

const token = process.env.FIGMA_ACCESS_TOKEN
if (!token) {
  console.log('FAIL')
  console.log('- [environment] FIGMA_ACCESS_TOKEN not set (rule: Figma API requires authentication)')
  process.exit(1)
}

function get(url, headers) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers }, (res) => {
      let body = ''
      res.on('data', chunk => body += chunk)
      res.on('end', () => {
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode}: ${body.slice(0, 200)}`))
          return
        }
        try { resolve(JSON.parse(body)) }
        catch (e) { reject(new Error('Invalid JSON response')) }
      })
    })
    req.on('error', reject)
  })
}

async function main() {
  // Encode pageId for URL (replace : with %3A)
  const encodedPageId = pageId.replace(/:/g, '%3A')
  let data
  try {
    data = await get(
      `https://api.figma.com/v1/files/${fileKey}/nodes?ids=${encodedPageId}&depth=1`,
      { 'X-Figma-Token': token }
    )
  } catch (e) {
    console.log('FAIL')
    console.log(`- [figma:api] request failed: ${e.message} (rule: Figma API must be reachable)`)
    process.exit(1)
  }

  const nodeKey = Object.keys(data.nodes || {})[0]
  if (!nodeKey) {
    console.log('FAIL')
    console.log(`- [figma:page] page "${pageId}" not found in file (rule: page must exist)`)
    process.exit(1)
  }

  const pageNode = data.nodes[nodeKey].document
  const children = pageNode.children || []

  // Find any SECTION whose name starts with the reqId (case-insensitive)
  const prefix = reqId.toUpperCase()
  const existing = children.find(
    c => c.type === 'SECTION' && c.name.toUpperCase().startsWith(prefix)
  )

  if (!existing) {
    console.log('PASS')
    console.log(`# No existing Section found for ${reqId} on this page`)
    process.exit(0)
  } else {
    // Format nodeId for Figma URL: replace : with -
    const urlNodeId = existing.id.replace(/:/g, '-')
    console.log('FAIL')
    console.log(`- [figma:section] Section "${existing.name}" already exists on this page (rule: no duplicate Sections per REQ)`)
    console.log(`# EXISTING_NODE_ID: ${existing.id}`)
    console.log(`# EXISTING_NAME: ${existing.name}`)
    console.log(`# FIGMA_LINK: https://www.figma.com/design/${fileKey}/?node-id=${urlNodeId}`)
    process.exit(1)
  }
}

main()
