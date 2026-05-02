'use client'

import { useEffect, useRef, useState } from 'react'
import {
  Download,
  ExternalLink,
  FileAudio,
  FileVideo,
  Globe,
  HardDrive,
  RefreshCw,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { JobStatusBadge } from '@/components/job-status-badge'
import { updateJob, getSettings } from '@/lib/store'
import type { Job } from '@/lib/store'
import { getDownloadTypeFolder } from '@/lib/utils'
import { useTranslations } from 'next-intl'

interface JobStatusCardProps {
  job: {
    id: string
    url: string
    downloadType: string
    status: string
    createdAt: string
    filename?: string
    fileSize?: string
    logs?: string[]
    repo?: string
  }
  runId?: number
}

const typeIcons: Record<string, React.ElementType> = {
  video: FileVideo,
  audio: FileAudio,
  webpage: Globe,
  raw: HardDrive,
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function JobStatusCard({ job, runId }: JobStatusCardProps) {
  const router = useRouter()
  const t = useTranslations('jobStatus')
  const tCommon = useTranslations('common')
  const TypeIcon = typeIcons[job.downloadType] ?? HardDrive
  const logRef = useRef<HTMLDivElement>(null)
  const commitFetchedRef = useRef(false)
  const [logs, setLogs] = useState<string[]>(job.logs || [])
  const [status, setStatus] = useState(
    job.status === 'in_progress' ? ('running' as const) : job.status
  )
  const [progress, setProgress] = useState(
    job.status === 'completed' || job.status === 'in_progress' ? 100 : 0
  )

  const settings = getSettings()
  const effectiveRunId = runId || (job as unknown as { runId?: number }).runId || 0

  // Poll status
  useEffect(() => {
    if (!effectiveRunId || !settings.token) return
    if (status === 'completed' || status === 'failed') return

    let cancelled = false

    async function pollStatus() {
      try {
        const res = await fetch(
          `/api/jobs/${effectiveRunId}/status?token=${settings.token}&owner=${settings.owner}&repo=${settings.repo}`
        )
        if (!res.ok) return
        const data = await res.json()

        if (cancelled) return

        const newStatus =
          data.status === 'completed'
            ? data.conclusion === 'success'
              ? 'completed'
              : 'failed'
            : data.status === 'in_progress'
              ? 'running'
              : 'queued'

        setStatus(newStatus as 'queued' | 'running' | 'completed' | 'failed')
        updateJob(effectiveRunId, { status: newStatus } as any)

        if (newStatus === 'completed' && !commitFetchedRef.current) {
          commitFetchedRef.current = true
          const folder = getDownloadTypeFolder(job.downloadType)
          fetch(
            `/api/github/commit?token=${settings.token}&owner=${settings.owner}&repo=${settings.repo}&path=${encodeURIComponent(folder)}`
          )
            .then(r => r.json())
            .then(({ sha }: { sha: string | null }) => {
              if (sha) updateJob(effectiveRunId, { commitSha: sha } as any)
            })
            .catch(() => {})
        }
      } catch {
        // ignore
      }
    }

    pollStatus()
    const interval = setInterval(pollStatus, 7000)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [effectiveRunId, settings.token, settings.owner, settings.repo, status])

  // Fetch logs when running
  useEffect(() => {
    if (status !== 'running' || !effectiveRunId || !settings.token) return

    async function fetchLogs() {
      try {
        const logRes = await fetch(
          `/api/jobs/${effectiveRunId}/logs?token=${settings.token}&owner=${settings.owner}&repo=${settings.repo}`
        )
        if (logRes.ok) {
          const logData = await logRes.json()
          const lines = (logData.logs || '').split('\n').filter(Boolean)
          setLogs(lines)
        }
      } catch {
        // ignore
      }
    }

    fetchLogs()
    const interval = setInterval(fetchLogs, 10000)
    return () => clearInterval(interval)
  }, [status, effectiveRunId, settings.token, settings.owner, settings.repo])

  // Update progress based on status
  useEffect(() => {
    if (status === 'completed') setProgress(100)
    else if (status === 'running') setProgress(60)
    else if (status === 'queued') setProgress(5)
  }, [status])

  // Auto-scroll logs to bottom
  useEffect(() => {
    const el = logRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [logs])

  function handleDownload() {
    const params = new URLSearchParams({
      token: settings.token,
      owner: settings.owner,
      repo: settings.repo,
    })
    window.location.href = `/api/jobs/${effectiveRunId}/download?${params.toString()}`
  }

  function handleRetry() {
    router.push('/')
  }

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="border-border bg-secondary flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border">
              <TypeIcon className="text-muted-foreground h-4 w-4" />
            </div>
            <div>
              <p className="text-foreground font-mono text-sm font-medium">
                {job.filename ?? job.id}
              </p>
              <p className="text-muted-foreground mt-0.5 max-w-sm truncate font-mono text-xs">
                {job.url}
              </p>
            </div>
          </div>
          <JobStatusBadge status={status === 'running' ? 'in_progress' : status} />
        </div>
      </CardHeader>

      <Separator />

      <CardContent className="pt-4">
        {/* Meta grid */}
        <div className="mb-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm sm:grid-cols-4">
          <MetaItem label={t('runId')}>
            <span className="font-mono text-xs">{effectiveRunId}</span>
          </MetaItem>
          <MetaItem label={t('repository')}>
            <span className="font-mono text-xs">{settings.repo || job.repo}</span>
          </MetaItem>
          <MetaItem label={t('created')}>
            <span className="text-xs">{formatDate(job.createdAt)}</span>
          </MetaItem>
          {job.fileSize && (
            <MetaItem label="File Size">
              <span className="text-xs">{job.fileSize}</span>
            </MetaItem>
          )}
        </div>

        {/* Progress bar */}
        {(status === 'running' || status === 'completed') && (
          <div className="mb-4 space-y-1.5">
            <div className="text-muted-foreground flex items-center justify-between text-xs">
              <span>{t('downloadReady')}</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} className="h-1.5" />
          </div>
        )}

        {/* Logs */}
        <div className="space-y-1.5">
          <p className="text-muted-foreground text-xs font-medium">{t('logs')}</p>
          <ScrollArea className="border-border bg-background h-48 rounded-lg border">
            <div ref={logRef as React.RefObject<HTMLDivElement>} className="p-3" dir="ltr">
              {logs.map((line, i) => (
                <p
                  key={i}
                  className={`font-mono text-xs leading-relaxed ${
                    line.includes('Error') || line.includes('failed')
                      ? 'text-destructive'
                      : line.includes('completed') || line.includes('✓')
                        ? 'text-green-600'
                        : 'text-muted-foreground'
                  }`}
                >
                  {line}
                </p>
              ))}
              {status === 'running' && (
                <p className="text-primary animate-pulse font-mono text-xs">▌</p>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Actions */}
        <div className="mt-4 flex flex-wrap gap-2">
          {status === 'completed' && (
            <Button size="sm" className="gap-2" onClick={handleDownload}>
              <Download className="h-3.5 w-3.5" />
              {t('downloadButton')}
            </Button>
          )}
          {status === 'failed' && (
            <Button size="sm" variant="outline" className="gap-2" onClick={handleRetry}>
              <RefreshCw className="h-3.5 w-3.5" />
              {t('retryButton')}
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            className="text-muted-foreground gap-2"
            onClick={() =>
              window.open(
                `https://github.com/${settings.owner}/${settings.repo}/actions/runs/${effectiveRunId}`,
                '_blank'
              )
            }
          >
            <ExternalLink className="h-3.5 w-3.5" />
            {t('retryButton')}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function MetaItem({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-0.5">
      <p className="text-muted-foreground/60 text-[11px] font-medium tracking-wider uppercase">
        {label}
      </p>
      <div className="text-foreground">{children}</div>
    </div>
  )
}
