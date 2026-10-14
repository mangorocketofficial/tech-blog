import { readdir, rm } from 'node:fs/promises'
import path from 'node:path'

const outputDirectory = path.join(process.cwd(), 'out')
let removed = 0

async function prune(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  await Promise.all(
    entries.map(async (entry) => {
      const target = path.join(directory, entry.name)
      if (entry.isDirectory()) {
        await prune(target)
      } else if (entry.name.endsWith('.txt')) {
        await rm(target)
        removed += 1
      }
    }),
  )
}

await prune(outputDirectory)
console.log(`Static output pruned: removed ${removed} RSC files`)
