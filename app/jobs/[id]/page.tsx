'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { ChevronRight, History } from 'lucide-react'
import { Navbar } from '@/components/navbar'
import { JobStatusCard } from '@/components/job-status-card'
import { Button } from '@/components/ui/button'
import { getJobByRunId, type Job as StoreJob } from '@/lib/store'
import { useTranslations } from 'next-intl'

export default function JobPage() {
  const params = useParams()
  const router = useRouter()
  const runId = Number(params.id)
  const [job, setJob] = useState<StoreJob | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const j = getJobByRunId(runId)
    setJob(j)
    setLoading(false)
    if (!j) {
      // Job not found in store, redirect to home
      router.push('/')
    }
  }, [runId])

  const t = useTranslations('common')
  const tHistory = useTranslations('history')

  if (loading) {
    return (
      <div className="bg-background flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">{t('loading')}</p>
      </div>
    )
  }

  if (!job) return null

  // Convert store Job to mock Job format for JobStatusCard
  const mockJob = {
    id: job.id,
    url: job.url,
    inputType: job.type as 'youtube' | 'direct' | 'snapshot',
    downloadType:
      job.type === 'youtube'
        ? ('video' as const)
        : job.type === 'snapshot'
          ? ('webpage' as const)
          : ('raw' as const),
    quality: job.options?.quality,
    filename: job.options?.filename,
    repo: job.repo,
    status: job.status === 'in_progress' ? ('running' as const) : job.status,
    createdAt: job.createdAt,
    updatedAt: job.createdAt,
    logs: [] as string[],
    progress: job.status === 'completed' ? 100 : job.status === 'in_progress' ? 60 : 0,
  }

  return (
    <div className="bg-background min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 py-10">
        {/* Back nav */}
        <div className="mb-6 flex items-center justify-between">
          <Link href="/">
            <Button variant="ghost" size="sm" className="text-muted-foreground gap-1.5">
              <ChevronRight className="h-3.5 w-3.5" />
              {tHistory('newDownload')}
            </Button>
          </Link>
          <Link href="/history">
            <Button variant="ghost" size="sm" className="text-muted-foreground gap-1.5">
              <History className="h-3.5 w-3.5" />
              {tHistory('title')}
            </Button>
          </Link>
        </div>

        {/* Heading */}
        <div className="mb-6">
          <h1 className="text-foreground text-2xl font-semibold tracking-tight text-balance">
            {tHistory('title')}
          </h1>
          <p className="text-muted-foreground mt-1.5 font-mono text-sm">Run #{job.runId}</p>
        </div>

        <JobStatusCard job={mockJob} runId={job.runId} />
      </main>
    </div>
  )
}
