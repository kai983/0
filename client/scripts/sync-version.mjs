/**
 * package.json is the single source of truth for the app version.
 * This copies it into the Android project so the two can never drift:
 * versionName is the number we show, versionCode is it times 100 so it
 * always increases (0.32 -> 32, 0.41 -> 41, 1.0 -> 100).
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const { version } = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))

if (!/^\d+\.\d{1,2}$/.test(version)) {
  throw new Error(`version must look like 0.3 or 0.32, got "${version}"`)
}

const versionCode = Math.round(parseFloat(version) * 100)
const gradlePath = join(root, 'android/app/build.gradle')
const gradle = readFileSync(gradlePath, 'utf8')

const patched = gradle
  .replace(/versionCode \d+/, `versionCode ${versionCode}`)
  .replace(/versionName "[^"]*"/, `versionName "${version}"`)

if (patched !== gradle) {
  writeFileSync(gradlePath, patched)
}

console.log(`version ${version} (versionCode ${versionCode})`)
