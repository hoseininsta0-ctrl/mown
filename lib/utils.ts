import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const JOB_FOLDERS: Record<string, string> = {
  youtube: 'downloads/youtube',
  snapshot: 'downloads/snapshot',
  direct: 'downloads/files',
}

/** Maps a JobType ('youtube' | 'snapshot' | 'direct') to its repo subfolder. */
export function getJobFolder(jobType: string): string {
  return JOB_FOLDERS[jobType] ?? 'downloads'
}

/** Maps a DownloadType ('video' | 'audio' | 'webpage' | 'raw') to its repo subfolder. */
export function getDownloadTypeFolder(downloadType: string): string {
  if (downloadType === 'video' || downloadType === 'audio') return JOB_FOLDERS.youtube
  if (downloadType === 'webpage') return JOB_FOLDERS.snapshot
  return JOB_FOLDERS.direct
}
