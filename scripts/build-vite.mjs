import { execFileSync } from "node:child_process"
import { build } from "vite"

function readGit(args) {
  return execFileSync("git", args, {
    cwd: process.cwd(),
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  }).trim()
}

function resolveBuildId() {
  const supplied = process.env.GYMIQUEST_BUILD_ID?.trim() ||
    process.env.CF_PAGES_COMMIT_SHA?.trim()
  if (supplied) return supplied

  try {
    const commit = readGit(["rev-parse", "HEAD"])
    const dirty = readGit(["status", "--porcelain"]).length > 0
    return `${commit}${dirty ? "-dirty" : ""}`
  } catch {
    throw new Error(
      "GymiQuest needs an exact build identity. Build inside a Git checkout or set GYMIQUEST_BUILD_ID.",
    )
  }
}

process.env.VITE_GYMIQUEST_BUILD_ID = resolveBuildId()
await build()
