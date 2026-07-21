import { readdir, readFile, stat } from "node:fs/promises"
import { relative, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const projectDirectory = resolve(fileURLToPath(new URL("..", import.meta.url)))
const distDirectory = resolve(projectDirectory, "dist")
const maxFiles = 20_000
const maxFileSize = 25 * 1024 * 1024

function fail(message) {
  throw new Error(`Deployment contract failed: ${message}`)
}

async function walk(directory) {
  const paths = []
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = resolve(directory, entry.name)
    if (entry.isDirectory()) paths.push(...await walk(path))
    else if (entry.isFile()) paths.push(path)
  }
  return paths
}

async function readRequired(path) {
  try {
    return await readFile(path, "utf8")
  } catch {
    fail(`missing ${relative(projectDirectory, path)}`)
  }
}

const configText = await readRequired(resolve(projectDirectory, "wrangler.jsonc"))
const config = JSON.parse(configText)
if (config.name !== "gymiquest") fail("wrangler project name must be gymiquest")
if (config.pages_build_output_dir !== "./dist") fail("wrangler output directory must be ./dist")
if (!/^\d{4}-\d{2}-\d{2}$/.test(config.compatibility_date ?? "")) {
  fail("wrangler compatibility_date must use YYYY-MM-DD")
}

const headers = await readRequired(resolve(distDirectory, "_headers"))
const privacyHtml = await readRequired(resolve(distDirectory, "datenschutz.html"))
for (const required of [
  "Content-Security-Policy: default-src 'self'",
  "frame-ancestors 'none'",
  "Permissions-Policy:",
  "Referrer-Policy: no-referrer",
  "X-Content-Type-Options: nosniff",
  "X-Frame-Options: DENY",
  "/assets/*",
  "Cache-Control: public, max-age=31536000, immutable",
  "/sw.js",
  "Cache-Control: no-cache, no-store, must-revalidate",
]) {
  if (!headers.includes(required)) fail(`dist/_headers is missing ${JSON.stringify(required)}`)
}

for (const required of [
  "Dein Lernen bleibt auf deinem Gerät.",
  "Was die App nicht überträgt",
  "Private offizielle Prüfungs-PDFs",
  "lokale Freigabeprotokoll",
  "Technische Produktinformation",
]) {
  if (!privacyHtml.includes(required)) {
    fail(`dist/datenschutz.html is missing ${JSON.stringify(required)}`)
  }
}

const files = await walk(distDirectory)
if (files.length > maxFiles) fail(`dist contains ${files.length} files; Cloudflare Pages allows ${maxFiles}`)

let totalBytes = 0
for (const path of files) {
  const pathFromDist = relative(distDirectory, path)
  const lowerPath = pathFromDist.toLowerCase()
  const fileStat = await stat(path)
  totalBytes += fileStat.size

  if (fileStat.size > maxFileSize) {
    fail(`${pathFromDist} exceeds the 25 MiB Cloudflare Pages file limit`)
  }
  if (lowerPath.endsWith(".pdf")) {
    fail(`${pathFromDist} is a PDF; official exam files must stay device-local`)
  }
  if (lowerPath.endsWith(".gqbackup")) {
    fail(`${pathFromDist} is a learner backup and must never be public`)
  }
  if (lowerPath.endsWith(".map")) {
    fail(`${pathFromDist} is a source map and is not part of the public release contract`)
  }
}

console.log(
  `Deployment contract verified: ${files.length} public files, ${(totalBytes / 1024 / 1024).toFixed(2)} MiB, secure headers, visible data-handling disclosure, no PDFs, backups, or source maps.`,
)
