import { readFileSync } from 'fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'path'

const _dirname = dirname(fileURLToPath(import.meta.url))

function loadWorkflow(filename: string): string {
  const filePath = resolve(_dirname, filename)
  return readFileSync(filePath, 'utf-8')
}

export function getYoutubeWorkflow(): string {
  return loadWorkflow('youtube-download.yml')
}

export function getDirectWorkflow(): string {
  return loadWorkflow('direct-download.yml')
}

export function getSnapshotWorkflow(): string {
  return loadWorkflow('snapshot.yml')
}

export function getSoundcloudWorkflow(): string {
  return loadWorkflow('soundcloud-download.yml')
}
