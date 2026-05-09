#!/usr/bin/env node
// check-figma-page.js — find a page by name in a Figma file
// Used by companion to locate the target page before generating wireframes.
// Uses Figma REST API GET /files/:key — requires FIGMA_ACCESS_TOKEN in env.
//
// Usage: node check-figma-page.js <fileKey> <pageName>
// pageName search is case-insensitive and tolerant of emoji prefixes
//
// Output on PASS:
//   PASS
//   # PAGE_ID: <id>
//   # PAGE_NAME: <exact name as it appears in Figma>
//
// Output on FAIL:
//   FAIL
//   - [figma:pages] page "<pageName>" not found (rule: page must exist before generating wireframes)
//   # AVAILABLE_PAGES: ["Cover", "Drafts", "Curadoria de sinais", ...]
//
// Exit code: 0 for PASS, 1 for FAIL

const https = require('https')
const process = require('process')

const [,, fileKey, pageName] = process.argv

if (!fileKey || !pageName) {
  console.log('FAIL')
  console.log('- [args] usage: node check-figma-page.js <fileKey> <pageName> (rule: both arguments required)')
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
  let data
  try {
    data = await get(
      `https://api.figma.com/v1/files/${fileKey}?depth=1`,
      { 'X-Figma-Token': token }
    )
  } catch (e) {
    console.log('FAIL')
    console.log(`- [figma:api] request failed: ${e.message} (rule: Figma API must be reachable)`)
    process.exit(1)
  }

  const pages = (data.document && data.document.children) || []
  const search = pageName.toLowerCase()

  // Match: name contains the search string (tolerates emoji prefixes)
  const found = pages.find(p => p.type === 'CANVAS' && p.name.toLowerCase().includes(search))

  if (found) {
    console.log('PASS')
    console.log(`# PAGE_ID: ${found.id}`)
    console.log(`# PAGE_NAME: ${found.name}`)
    process.exit(0)
  } else {
    const available = pages.filter(p => p.type === 'CANVAS').map(p => p.name)
    console.log('FAIL')
    console.log(`- [figma:pages] page "${pageName}" not found (rule: page must exist before generating wireframes)`)
    console.log(`# AVAILABLE_PAGES: ${JSON.stringify(available)}`)
    process.exit(1)
  }
}

main()
