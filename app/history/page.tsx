'use client'

import Link from 'next/link'
import {
  Download,
  ExternalLink,
  FileAudio,
  FileVideo,
  FolderOpen,
  GitCommit,
  Globe,
  HardDrive,
  RefreshCw,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { Navbar } from '@/components/navbar'
import { JobStatusBadge } from '@/components/job-status-badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { getJobs } from '@/lib/store'
import type { Job as StoreJob } from '@/lib/store'
import { getJobFolder } from '@/lib/utils'
import { useTranslations, useLocale } from 'next-intl'

const typeIcons: Record<string, React.ElementType> = {
  video: FileVideo,
  audio: FileAudio,
  webpage: Globe,
  raw: HardDrive,
}

function formatDate(iso: string, locale: string) {
  return new Date(iso).toLocaleString(locale, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function JobRow({
  job,
  onRetry,
}: {
  readonly job: StoreJob
  readonly onRetry: (job: StoreJob) => void
}) {
  const t = useTranslations('history')
  const tCommon = useTranslations('common')
  const locale = useLocale()

  const typeKey = job.type === 'youtube' ? 'video' : job.type === 'snapshot' ? 'webpage' : 'raw'
  const TypeIcon = typeIcons[typeKey] ?? HardDrive

  const displayStatus =
    job.status === 'in_progress'
      ? 'running'
      : (job.status as 'queued' | 'running' | 'completed' | 'failed')

  const folder = getJobFolder(job.type)
  const folderUrl = `https://github.com/${job.owner}/${job.repo}/tree/main/${folder}`
  const commitUrl = job.commitSha
    ? `https://github.com/${job.owner}/${job.repo}/commit/${job.commitSha}`
    : null

  return (
    <div className="flex flex-col gap-2 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="border-border bg-secondary flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border">
            <TypeIcon className="text-muted-foreground h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="text-foreground truncate font-mono text-sm font-medium">
              {job.options?.filename ?? `Run #${job.runId}`}
            </p>
            <p className="text-muted-foreground mt-0.5 truncate font-mono text-xs">
              {job.repo} · {formatDate(job.createdAt, locale)}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
          <JobStatusBadge status={displayStatus} />

          {job.status === 'completed' && (
            <Button size="sm" variant="outline" className="h-7 gap-1.5 text-xs">
              <Download className="h-3 w-3" />
              {tCommon('download')}
            </Button>
          )}
          {job.status === 'failed' && (
            <Button
              size="sm"
              variant="outline"
              className="h-7 gap-1.5 text-xs"
              onClick={() => onRetry(job)}
            >
              <RefreshCw className="h-3 w-3" />
              {t('redownload')}
            </Button>
          )}
          <Link href={`/jobs/${job.runId}`}>
            <Button size="sm" variant="ghost" className="text-muted-foreground h-7 gap-1.5 text-xs">
              <ExternalLink className="h-3 w-3" />
              {t('details')}
            </Button>
          </Link>
        </div>
      </div>

      {job.status === 'completed' && job.owner && (
        <div className="flex flex-wrap gap-2 ps-12">
          <Button
            asChild
            size="sm"
            variant="outline"
            className="text-muted-foreground h-6 gap-1.5 text-[11px]"
          >
            <a href={folderUrl} target="_blank" rel="noopener noreferrer">
              <FolderOpen className="h-3 w-3" />
              {t('viewFolder')}
            </a>
          </Button>
          {commitUrl && (
            <Button
              asChild
              size="sm"
              variant="outline"
              className="text-muted-foreground h-6 gap-1.5 text-[11px]"
            >
              <a href={commitUrl} target="_blank" rel="noopener noreferrer">
                <GitCommit className="h-3 w-3" />
                {t('viewCommit')}
              </a>
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

export default function HistoryPage() {
  const [jobs, setJobs] = useState<StoreJob[]>([])
  const t = useTranslations('history')

  useEffect(() => {
    setJobs(getJobs())
  }, [])

  const sortedJobs = [...jobs].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )

  const counts = {
    total: jobs.length,
    completed: jobs.filter(j => j.status === 'completed').length,
    running: jobs.filter(j => j.status === 'in_progress').length,
    failed: jobs.filter(j => j.status === 'failed').length,
  }

  function handleRetry(job: StoreJob) {
    window.location.href = `/jobs/${job.runId}`
  }

  return (
    <div className="bg-background min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 py-10">
        {/* Header */}
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-foreground text-2xl font-semibold tracking-tight text-balance">
              {t('title')}
            </h1>
            <p className="text-muted-foreground mt-1.5 text-sm">{t('subtitle')}</p>
          </div>
          <Link href="/">
            <Button size="sm" className="gap-1.5">
              {t('newDownload')}
            </Button>
          </Link>
        </div>

        {/* Stats row */}
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: t('stats.total'), value: counts.total },
            { label: t('stats.completed'), value: counts.completed },
            { label: t('stats.running'), value: counts.running },
            { label: t('stats.failed'), value: counts.failed },
          ].map(({ label, value }) => (
            <Card key={label} className="border-border bg-card">
              <CardContent className="px-4 py-3">
                <p className="text-muted-foreground/60 text-[11px] font-medium tracking-wider uppercase">
                  {label}
                </p>
                <p className="text-foreground mt-1 text-2xl font-semibold tabular-nums">{value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Job list */}
        <Card className="border-border bg-card">
          {sortedJobs.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
              <p className="text-muted-foreground text-sm">{t('empty')}</p>
              <Link href="/" className="mt-3">
                <Button size="sm" variant="outline">
                  {t('emptyHint')}
                </Button>
              </Link>
            </div>
          ) : (
            sortedJobs.map((job, i) => (
              <div key={job.runId}>
                <JobRow job={job} onRetry={handleRetry} />
                {i < sortedJobs.length - 1 && <Separator />}
              </div>
            ))
          )}
        </Card>
      </main>
    </div>
  )
}
