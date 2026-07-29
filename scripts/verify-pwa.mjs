import { readFile } from "node:fs/promises"
import { createHash } from "node:crypto"

const distDirectory = new URL("../dist/", import.meta.url)

function fail(message) {
  throw new Error(`PWA contract failed: ${message}`)
}

async function readDistFile(path, encoding) {
  try {
    return await readFile(new URL(path, distDirectory), encoding)
  } catch {
    fail(`missing dist/${path}; run the production build before verification`)
  }
}

function expectEqual(actual, expected, field) {
  if (actual !== expected) {
    fail(`${field} must be ${JSON.stringify(expected)}, received ${JSON.stringify(actual)}`)
  }
}

function expectHtml(html, fragment, label) {
  if (!html.includes(fragment)) {
    fail(`dist/index.html is missing ${label}`)
  }
}

function expectManifestIcon(manifest, expected) {
  const matchingIcon = manifest.icons?.find((icon) => icon.src === expected.src)
  if (!matchingIcon) {
    fail(`manifest is missing ${expected.src}`)
  }

  expectEqual(matchingIcon.sizes, expected.sizes, `${expected.src} sizes`)
  expectEqual(matchingIcon.type, "image/png", `${expected.src} type`)

  const purposes = new Set((matchingIcon.purpose ?? "any").split(/\s+/))
  if (!purposes.has(expected.purpose)) {
    fail(`${expected.src} must declare purpose ${expected.purpose}`)
  }
}

function pngDimensions(buffer, path) {
  const signature = "89504e470d0a1a0a"
  if (buffer.subarray(0, 8).toString("hex") !== signature) {
    fail(`${path} is not a valid PNG`)
  }

  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  }
}

async function expectPng(path, expectedSize) {
  const buffer = await readDistFile(path)
  const dimensions = pngDimensions(buffer, path)
  if (dimensions.width !== expectedSize || dimensions.height !== expectedSize) {
    fail(`${path} must be ${expectedSize}x${expectedSize}, received ${dimensions.width}x${dimensions.height}`)
  }
}

const manifestText = await readDistFile("manifest.webmanifest", "utf8")
const manifest = JSON.parse(manifestText)
const html = await readDistFile("index.html", "utf8")
const privacyHtml = await readDistFile("datenschutz.html", "utf8")
const serviceWorker = await readDistFile("sw.js", "utf8")
await readDistFile("registerSW.js", "utf8")

expectEqual(manifest.id, "/", "manifest id")
expectEqual(manifest.start_url, "/", "manifest start_url")
expectEqual(manifest.scope, "/", "manifest scope")
expectEqual(manifest.display, "standalone", "manifest display")
expectEqual(manifest.lang, "en", "manifest lang")
expectEqual(manifest.theme_color, "#173b57", "manifest theme_color")
expectEqual(manifest.background_color, "#f6f3ea", "manifest background_color")

expectManifestIcon(manifest, {
  src: "/gymiquest-icon-192.png",
  sizes: "192x192",
  purpose: "any",
})
expectManifestIcon(manifest, {
  src: "/gymiquest-icon-512.png",
  sizes: "512x512",
  purpose: "any",
})
expectManifestIcon(manifest, {
  src: "/gymiquest-maskable-512.png",
  sizes: "512x512",
  purpose: "maskable",
})

await Promise.all([
  expectPng("gymiquest-icon-192.png", 192),
  expectPng("gymiquest-icon-512.png", 512),
  expectPng("gymiquest-maskable-512.png", 512),
  expectPng("apple-touch-icon.png", 180),
])

const backgroundMidi = await readDistFile("music/the-golden-dragon.mid")
if (backgroundMidi.subarray(0, 4).toString("ascii") !== "MThd") {
  fail("music/the-golden-dragon.mid is not a Standard MIDI file")
}
const backgroundMidiHash = createHash("sha256").update(backgroundMidi).digest("hex")
if (backgroundMidiHash !== "27e4945012de674504ff9482c795efefc76b3ac2754a312cc44dc61c727006bf") {
  fail("music/the-golden-dragon.mid does not match the supplied source file")
}

expectHtml(html, '<html lang="en">', "English fallback document language")
expectHtml(html, 'name="apple-mobile-web-app-capable" content="yes"', "iPad standalone metadata")
expectHtml(html, 'rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png"', "iPad home-screen icon")
expectHtml(html, 'rel="manifest" href="/manifest.webmanifest"', "web app manifest link")
expectHtml(html, 'src="/registerSW.js"', "service-worker registration")

for (const [fragment, label] of [
  ['<html lang="en">', "English fallback document language"],
  ['data-locale-copy="en"', "English privacy copy"],
  ['data-locale-copy="de"', "German privacy copy"],
  ["Your learning stays on your device.", "English local-first heading"],
  ["Dein Lernen bleibt auf deinem Gerät.", "local-first heading"],
  ["Was die App nicht überträgt", "network-boundary disclosure"],
  ["Technische Produktinformation", "public-release qualification"],
]) {
  if (!privacyHtml.includes(fragment)) {
    fail(`dist/datenschutz.html is missing ${label}`)
  }
}

for (const asset of [
  "index.html",
  "datenschutz.html",
  "manifest.webmanifest",
  "registerSW.js",
  "gymiquest-icon-192.png",
  "gymiquest-icon-512.png",
  "gymiquest-maskable-512.png",
  "apple-touch-icon.png",
  "music/the-golden-dragon.mid",
]) {
  if (!serviceWorker.includes(`url:${JSON.stringify(asset)}`)) {
    fail(`${asset} is missing from the service-worker precache`)
  }
}

console.log(
  [
    "PWA contract verified:",
    "English-default multilingual standalone manifest,",
    "offline data-handling disclosure,",
    "192/512/maskable install icons,",
    "iPad home-screen icon,",
    "and offline shell precache.",
  ].join(" "),
)
