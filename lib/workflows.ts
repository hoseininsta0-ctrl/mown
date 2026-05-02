import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'

const __dirname = dirname(new URL(import.meta.url).pathname)

function loadWorkflow(filename: string): string {
  const filePath = resolve(__dirname, filename)
  return readFileSync(filePath, 'utf-8')
}

export const YOUTUBE_WORKFLOW = loadWorkflow('youtube-download.yml')
export const DIRECT_WORKFLOW = loadWorkflow('direct-download.yml')
export const SNAPSHOT_WORKFLOW = loadWorkflow('snapshot.yml')
