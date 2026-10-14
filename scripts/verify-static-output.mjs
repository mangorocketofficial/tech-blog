import { readFile, readdir, stat } from 'node:fs/promises'
import path from 'node:path'

const outputDirectory = path.join(process.cwd(), 'out')
const snapshotPath = path.join(process.cwd(), '.content-cache', 'content.json')
const warningFileCount = 18_000
const maximumFileCount = 20_000
const warningBuildMilliseconds = 45 * 60 * 1000
const warningSearchIndexBytes = 10 * 1024 * 1024

let fileCount = 0
let totalBytes = 0
let rscFileCount = 0

async function inspect(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  await Promise.all(
    entries.map(async (entry) => {
      const target = path.join(directory, entry.name)
      if (entry.isDirectory()) {
        await inspect(target)
        return
      }

      fileCount += 1
      const fileStats = await stat(target)
      totalBytes += fileStats.size
      if (entry.name.endsWith('.txt')) rscFileCount += 1
    }),
  )
}

await inspect(outputDirectory)

if (rscFileCount > 0) {
  throw new Error(`Static output still contains ${rscFileCount} RSC .txt files`)
}

if (fileCount > maximumFileCount) {
  throw new Error(
    `Static output contains ${fileCount.toLocaleString()} files, exceeding the Workers Free limit of ${maximumFileCount.toLocaleString()}`,
  )
}

if (fileCount >= warningFileCount) {
  console.warn(
    `WARNING: ${fileCount.toLocaleString()} output files are close to the Workers Free limit (${maximumFileCount.toLocaleString()})`,
  )
}

const snapshot = JSON.parse(await readFile(snapshotPath, 'utf8'))
const elapsedMilliseconds = Date.now() - new Date(snapshot.generatedAt).getTime()
if (elapsedMilliseconds >= warningBuildMilliseconds) {
  console.warn(`WARNING: static build took ${(elapsedMilliseconds / 60_000).toFixed(1)} minutes`)
}

const searchIndexPath = path.join(outputDirectory, 'search-index.json')
const searchIndexBytes = (await stat(searchIndexPath)).size
if (searchIndexBytes >= warningSearchIndexBytes) {
  console.warn(
    `WARNING: search-index.json is ${(searchIndexBytes / 1024 / 1024).toFixed(1)} MiB; split it by category before it grows further`,
  )
}

console.log(
  `Static output verified: ${snapshot.posts.length.toLocaleString()} posts, ${fileCount.toLocaleString()} files, ${(totalBytes / 1024 / 1024).toFixed(1)} MiB, ${(elapsedMilliseconds / 1000).toFixed(1)}s`,
)
