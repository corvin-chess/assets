#!/usr/bin/env node
/**
 * Assert assets README matches README_STYLE repository template rules (CV-022/CV-110).
 */
import { readFileSync, existsSync } from "node:fs"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(__dirname, "..")
const workspaceRoot = resolve(repoRoot, "..")
const readmePath = join(repoRoot, "README.md")
const licensePath = join(repoRoot, "LICENSE")
const stylePath = join(workspaceRoot, "README_STYLE.md")
const reposPath = join(workspaceRoot, "REPOS.md")

const REPO = "assets"
const SKILL = "github"
const LICENSE_ID = "CC BY-SA 4.0"
const CLOSING =
  "Original pieces, boards, and sounds so every Corvin client shares one honest face."

const PLANNED_AREAS =
  /^(Move\/capture\/check\/game-end sounds|Brand mark \+ IBM Plex self-host|Implementation)$/i

const BUILT_AREAS =
  /^(README|LICENSE|CI verify gate|Corvid piece SVGs|Ravenboard colors)$/i

const fail = (msg) => {
  console.error(`FAIL: ${msg}`)
  process.exitCode = 1
}

const ok = (msg) => console.log(`OK: ${msg}`)

if (!existsSync(readmePath)) {
  fail(`missing ${readmePath}`)
  process.exit(1)
}

const readme = readFileSync(readmePath, "utf8")

const emojiRe = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u
if (emojiRe.test(readme)) {
  fail("emoji found in README")
} else {
  ok("no emoji")
}

const requiredSections = [
  "OVERVIEW",
  "GETTING+STARTED",
  "DEVELOPMENT",
  "TESTING",
  "ARCHITECTURE",
  "STATUS",
]
for (const section of requiredSections) {
  if (!readme.includes(`lines=${section}`)) {
    fail(`missing typing SVG section title: ${section}`)
  }
}
if (!process.exitCode) ok("required section typing titles present")

const sectionAlts = [
  "Overview",
  "Getting Started",
  "Development",
  "Testing",
  "Architecture",
  "Status",
]
for (const alt of sectionAlts) {
  if (!readme.includes(`alt="${alt}"`)) {
    fail(`missing section alt text: ${alt}`)
  }
}
if (!process.exitCode) ok("section alt texts present")

if (!readme.includes(`https://github.com/corvin-chess/${REPO}`)) {
  fail(`missing self link https://github.com/corvin-chess/${REPO}`)
} else {
  ok("self repository link present")
}

if (!readme.includes(`i=${SKILL}&theme=dark`)) {
  fail(`skill icon must be i=${SKILL}&theme=dark`)
} else {
  ok(`skill icon i=${SKILL} theme=dark`)
}

if (!readme.includes("i=github&theme=dark")) {
  fail("GitHub skill icon with theme=dark missing")
} else {
  ok("GitHub skill icon present")
}

const palette = ["0b0d12", "161b2b", "2f3d63", "8fa3d9", "c9a227", "e6e9f2"]
for (const hex of palette) {
  if (!readme.toLowerCase().includes(hex.toLowerCase())) {
    fail(`palette hex missing: ${hex}`)
  }
}
if (!process.exitCode) ok("DESIGN.md palette hexes present")

if (!readme.includes("capsule-render.vercel.app")) {
  fail("capsule-render header/footer missing")
} else {
  ok("capsule-render present")
}

if (!readme.includes("readme-typing-svg.demolab.com")) {
  fail("typing SVG missing")
} else {
  ok("typing SVG present")
}

const headerTypingMatch = readme.match(
  /readme-typing-svg\.demolab\.com\?[^"']*lines=([^"'&]+)/
)
if (!headerTypingMatch) {
  fail("could not parse header typing lines=")
} else {
  const linesParam = headerTypingMatch[1]
  if (/\s/.test(linesParam)) {
    fail("typing SVG lines= contains raw whitespace; encode spaces as +")
  }
  if (!linesParam.startsWith(`${REPO};`)) {
    fail(`typing SVG lines= must start with ${REPO};`)
  }
  ok(`typing SVG lines= encoded and starts with ${REPO};`)
}

if (!readme.includes(`<i>${CLOSING}</i>`)) {
  fail("closing sentence missing or altered")
} else {
  ok("closing sentence matches README_STYLE assets example")
}

if (!readme.includes(LICENSE_ID)) {
  fail(`license section must state ${LICENSE_ID}`)
} else {
  ok(`license named ${LICENSE_ID}`)
}

const statusTableMatch = readme.match(
  /\|\s*Area\s*\|\s*State\s*\|[\s\S]*?(?=<img src="https:\/\/capsule-render)/
)
if (!statusTableMatch) {
  fail("STATUS table missing or malformed")
} else {
  const table = statusTableMatch[0]
  const stateCells = [...table.matchAll(/\|\s*([^|\n]+)\s*\|\s*([^|\n]+)\s*\|/g)]
  let sawReadmeBuilt = false
  let sawLicenseBuilt = false
  let sawCiBuilt = false
  let sawCorvidBuilt = false
  let sawRavenboardBuilt = false
  let sawImplPlanned = false
  for (const [, areaRaw, stateRaw] of stateCells) {
    const area = areaRaw.trim()
    const state = stateRaw.trim()
    if (/^area$/i.test(area) && /^state$/i.test(state)) continue
    if (/^-+$/.test(area)) continue
    if (!/^(Planned|Built)$/i.test(state)) {
      fail(`STATUS row "${area}" must be Planned or Built; got "${state}"`)
      continue
    }
    if (/^README$/i.test(area) && /^Built$/i.test(state)) {
      sawReadmeBuilt = true
    }
    if (/^LICENSE$/i.test(area) && /^Built$/i.test(state)) {
      sawLicenseBuilt = true
    }
    if (/^CI verify gate$/i.test(area) && /^Built$/i.test(state)) {
      sawCiBuilt = true
    }
    if (/^Corvid piece SVGs$/i.test(area) && /^Built$/i.test(state)) {
      sawCorvidBuilt = true
    }
    if (/^Ravenboard colors$/i.test(area) && /^Built$/i.test(state)) {
      sawRavenboardBuilt = true
    }
    if (BUILT_AREAS.test(area) && !/^Built$/i.test(state)) {
      fail(`STATUS row "${area}" must be Built; got "${state}"`)
    }
    if (PLANNED_AREAS.test(area) && !/^Planned$/i.test(state)) {
      fail(`STATUS row "${area}" must stay Planned until that work ships; got "${state}"`)
    }
    if (/^Implementation$/i.test(area) && /^Planned$/i.test(state)) {
      sawImplPlanned = true
    }
  }
  if (!sawReadmeBuilt) fail('STATUS must include "| README | Built |"')
  if (!sawLicenseBuilt) fail('STATUS must include "| LICENSE | Built |"')
  if (!sawCiBuilt) fail('STATUS must include "| CI verify gate | Built |"')
  if (!sawCorvidBuilt) fail('STATUS must include "| Corvid piece SVGs | Built |"')
  if (!sawRavenboardBuilt) fail('STATUS must include "| Ravenboard colors | Built |"')
  if (!sawImplPlanned) fail('STATUS must include "| Implementation | Planned |"')
  if (!process.exitCode) ok("STATUS rows use Planned/Built correctly")
}

if (
  !/Sounds, brand mark, and self-hosted IBM Plex font files are not in this repository yet/i.test(
    readme
  )
) {
  fail(
    'OVERVIEW must state "Sounds, brand mark, and self-hosted IBM Plex font files are not in this repository yet"'
  )
} else {
  ok("OVERVIEW states remaining Planned assets clearly")
}

if (!/Corvin-original/i.test(readme)) {
  fail("README must state Corvin-original assets")
} else {
  ok("Corvin-original assets wording present")
}

if (!/pieces\/corvid\//i.test(readme)) {
  fail("README must document pieces/corvid/ paths")
} else {
  ok("Corvid paths documented")
}

if (!/boards\/ravenboard\//i.test(readme)) {
  fail("README must document boards/ravenboard/ paths")
} else {
  ok("Ravenboard paths documented")
}

if (!/verify-assets\.mjs/i.test(readme)) {
  fail("TESTING must mention verify-assets.mjs")
} else {
  ok("verify-assets.mjs mentioned")
}

const claimedBuilt =
  /\b(Shipped|Live at|users online|ELO|CDN hits|asset count|\d+\s+SVGs|\d+\s+sounds|in production)\b/i
if (claimedBuilt.test(readme)) {
  fail("unverified performance or production claims found")
} else {
  ok("no unverified strength/production claims")
}

const forbiddenSources =
  /\b(Stockfish|Leela|lc0|Lichess|Chess\.com|cburnett|merida|staunty|wikipedia pieces|Google Fonts)\b/i
if (forbiddenSources.test(readme)) {
  fail("third-party asset or competitor name found; keep wording Corvin-only")
} else {
  ok("no third-party asset or competitor names")
}

const linkRe = /https:\/\/github\.com\/corvin-chess\/([A-Za-z0-9._-]+)/g
const linked = new Set()
let m
while ((m = linkRe.exec(readme)) !== null) {
  linked.add(m[1])
}

const knownRepos = new Set([
  "web",
  "server",
  "chess-core",
  "engine",
  "engine-train",
  "worker",
  "fairplay",
  "puzzles",
  "explorer",
  "broadcast",
  "design-system",
  "assets",
  "mobile",
  "sdk",
  "bots",
  "translations",
  "infra",
  "website",
  ".github",
])

for (const name of linked) {
  if (!knownRepos.has(name)) {
    fail(`link to unknown repo: ${name}`)
  }
}
if (!linked.has(REPO)) {
  fail(`missing link to ${REPO}`)
}
if (!process.exitCode) ok("all github.com/corvin-chess links are in REPOS set")

if (existsSync(reposPath)) {
  const reposDoc = readFileSync(reposPath, "utf8")
  if (!reposDoc.includes(`### ${REPO}`)) {
    fail(`REPOS.md missing ### ${REPO}`)
  } else {
    ok("REPOS.md documents assets")
  }
}

if (!existsSync(licensePath)) {
  fail("missing LICENSE")
} else {
  const license = readFileSync(licensePath, "utf8")
  if (!/Creative Commons Attribution-ShareAlike 4\.0 International/i.test(license)) {
    fail("LICENSE must be Creative Commons Attribution-ShareAlike 4.0 International")
  } else if (license.length < 10000) {
    fail("LICENSE looks truncated; expect full CC BY-SA 4.0 text")
  } else {
    ok("LICENSE present with full CC BY-SA 4.0 text")
  }
  if (emojiRe.test(license)) {
    fail("emoji found in LICENSE")
  }
}

if (existsSync(stylePath)) {
  const style = readFileSync(stylePath, "utf8")
  if (!style.includes("| assets | `github` |")) {
    fail("README_STYLE skill table missing assets/github")
  } else {
    ok("README_STYLE lists assets skill icon github")
  }
  if (!style.includes(CLOSING)) {
    fail("README_STYLE missing assets closing sentence example")
  } else {
    ok("closing sentence listed in README_STYLE")
  }
}

const requiredHeaderBits = [
  'alt="Corvin"',
  `alt="${REPO}"`,
  "section=footer",
  "## License",
]
for (const bit of requiredHeaderBits) {
  if (!readme.includes(bit)) {
    fail(`missing required README fragment: ${bit}`)
  }
}
if (!process.exitCode) ok("header, footer, license heading present")

if (!process.exitCode) {
  console.log("All CV-022 assets README checks passed.")
}
