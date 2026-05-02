'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Download, Globe, HardDrive, Loader2, Youtube } from 'lucide-react'
import { toast } from 'sonner'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { TokenInput } from '@/components/token-input'
import { RepoSelector } from '@/components/repo-selector'
import { JobConfigPanel } from '@/components/job-config-panel'
import { VideoPreviewCard } from '@/components/video-preview-card'
import { saveJob, saveSettings, getSettings } from '@/lib/store'
import type { DownloadType, InputType } from '@/lib/mock-data'
import { useTranslations } from 'next-intl'

const defaultDownloadType: Record<InputType, DownloadType> = {
  youtube: 'video',
  direct: 'raw',
  snapshot: 'webpage',
}

export function HomeClient() {
  const router = useRouter()
  const t = useTranslations('home')
  const tCommon = useTranslations('common')
  const tHistory = useTranslations('history')
  const tJobConfig = useTranslations('jobConfig')
  const [inputType, setInputType] = useState<InputType>('youtube')
  const [url, setUrl] = useState('')
  const [token, setToken] = useState('')
  const [repo, setRepo] = useState('')
  const [downloadType, setDownloadType] = useState<DownloadType>('video')
  const [quality, setQuality] = useState('1080p')
  const [filename, setFilename] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [settingUp, setSettingUp] = useState(false)

  const [cookiesUploaded, setCookiesUploaded] = useState(false)

  // Load settings from localStorage on mount
  useEffect(() => {
    const settings = getSettings()
    if (settings.token) setToken(settings.token)
    if (settings.repo) setRepo(settings.repo)
    if (settings.cookiesUploaded) setCookiesUploaded(settings.cookiesUploaded)
  }, [])

  function handleTabChange(val: string) {
    const t = val as InputType
    setInputType(t)
    setDownloadType(defaultDownloadType[t])
    setUrl('')
  }

  function getUrlPlaceholder() {
    return t('form.urlPlaceholder')
  }

  function getUrlLabel() {
    return t('form.urlLabel')
  }

  async function handleCookiesUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const text = await file.text()
    const settings = getSettings()

    if (!settings.token || !settings.owner || !settings.repo) {
      toast.error(t('setup.title'))
      return
    }

    try {
      const res = await fetch('/api/cookies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: settings.token,
          owner: settings.owner,
          repo: settings.repo,
          cookies: text,
        }),
      })
      if (!res.ok) throw new Error('Failed to upload cookies')
      saveSettings({ cookiesUploaded: true })
      setCookiesUploaded(true)
      toast.success(t('setup.cookiesSaved'))
    } catch (err) {
      toast.error(t('setup.cookies'), {
        description: err instanceof Error ? err.message : undefined,
      })
    }
  }

  async function handleSetup() {
    if (!token) {
      toast.error(t('auth.tokenLabel'))
      return
    }
    setSettingUp(true)
    try {
      const res = await fetch('/api/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, repo: repo || undefined }),
      })
      if (!res.ok) throw new Error('Setup failed')
      const data = await res.json()
      saveSettings({ token, owner: data.owner, repo: data.repo })
      setRepo(data.repo)
      toast.success(t('setup.success'), {
        description: `Using ${data.owner}/${data.repo}`,
      })
    } catch (err) {
      toast.error(t('setup.title'), { description: err instanceof Error ? err.message : undefined })
    } finally {
      setSettingUp(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!url.trim()) {
      toast.error(t('form.urlLabel'))
      return
    }
    const settings = getSettings()
    if (!settings.token || !settings.repo) {
      toast.error(t('setup.description'))
      return
    }

    // Check if cookies are needed for YouTube
    if (inputType === 'youtube' && !settings.cookiesUploaded) {
      const confirm = window.confirm(t('setup.cookiesDescription'))
      if (confirm) {
        toast.info(t('setup.cookies'))
        return
      }
    }

    setSubmitting(true)
    try {
      const typeMap: Record<InputType, string> = {
        youtube: 'youtube',
        direct: 'direct',
        snapshot: 'snapshot',
      }
      const options: Record<string, string> = {}
      if (inputType === 'youtube') {
        options.quality = quality.replace('p', '')
        options.format = downloadType === 'audio' ? 'mp3' : 'mp4'
      }
      if (filename) options.filename = filename

      const res = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: settings.token,
          owner: settings.owner,
          repo: settings.repo,
          type: typeMap[inputType],
          url,
          options,
        }),
      })
      if (!res.ok) throw new Error('Job submission failed')
      const data = await res.json()
      saveJob({
        id: data.jobId,
        runId: data.runId,
        owner: settings.owner,
        repo: settings.repo,
        type: typeMap[inputType] as 'youtube' | 'direct' | 'snapshot',
        url,
        options,
        status: 'queued',
        createdAt: new Date().toISOString(),
      })
      toast.success(t('form.submit'), {
        description: 'Dispatching GitHub Actions workflow...',
      })
      router.push(`/jobs/${data.runId}`)
    } catch (err) {
      toast.error(t('form.submit'), { description: err instanceof Error ? err.message : undefined })
    } finally {
      setSubmitting(false)
    }
  }

  const showPreview = inputType === 'youtube' && url.includes('youtube.com')

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6 lg:grid-cols-5">
      {/* Left column: URL + Auth + Repo */}
      <div className="space-y-6 lg:col-span-3">
        {/* URL Input */}
        <Card className="border-border bg-card">
          <CardContent className="pt-5">
            <Tabs value={inputType} onValueChange={handleTabChange}>
              <TabsList className="mb-4 grid w-full grid-cols-3">
                <TabsTrigger value="youtube" className="gap-1.5 text-xs">
                  <Youtube className="h-3.5 w-3.5" />
                  {t('tabs.youtube')}
                </TabsTrigger>
                <TabsTrigger value="direct" className="gap-1.5 text-xs">
                  <HardDrive className="h-3.5 w-3.5" />
                  {t('tabs.direct')}
                </TabsTrigger>
                <TabsTrigger value="snapshot" className="gap-1.5 text-xs">
                  <Globe className="h-3.5 w-3.5" />
                  {t('tabs.snapshot')}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="youtube" className="mt-0">
                <UrlInput
                  label={t('form.urlLabel')}
                  placeholder={t('form.urlPlaceholder')}
                  value={url}
                  onChange={setUrl}
                />
              </TabsContent>
              <TabsContent value="direct" className="mt-0">
                <UrlInput
                  label={t('form.urlLabel')}
                  placeholder={t('form.urlPlaceholder')}
                  value={url}
                  onChange={setUrl}
                />
              </TabsContent>
              <TabsContent value="snapshot" className="mt-0">
                <UrlInput
                  label={t('form.urlLabel')}
                  placeholder={t('form.urlPlaceholder')}
                  value={url}
                  onChange={setUrl}
                />
              </TabsContent>
            </Tabs>

            {showPreview && (
              <div className="mt-4">
                <VideoPreviewCard url={url} />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Auth + Repo */}
        <Card className="border-border bg-card">
          <CardContent className="space-y-5 pt-5">
            <TokenInput value={token} onChange={setToken} />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleSetup}
              disabled={settingUp}
              className="w-full"
            >
              {settingUp ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  {t('setup.initializing')}
                </>
              ) : (
                t('setup.button')
              )}
            </Button>
            <div className="bg-warning/10 border-warning/30 rounded-lg border p-3">
              <p className="text-warning-foreground mb-2 text-xs">
                {cookiesUploaded ? t('setup.cookiesUpdate') : t('setup.cookiesDescription')}
              </p>
              <input
                type="file"
                accept=".txt"
                onChange={handleCookiesUpload}
                className="text-foreground w-full text-xs"
              />
              {cookiesUploaded && (
                <p className="text-success mt-1 text-[10px]">{t('setup.cookiesSaved')}</p>
              )}
            </div>
            <Separator />
            <RepoSelector value={repo} onChange={setRepo} />
          </CardContent>
        </Card>
      </div>

      {/* Right column: Config + Submit */}
      <div className="space-y-6 lg:col-span-2">
        <Card className="border-border bg-card">
          <CardContent className="pt-5">
            <p className="text-foreground mb-4 text-sm font-medium">{tJobConfig('title')}</p>
            <JobConfigPanel
              inputType={inputType}
              downloadType={downloadType}
              onDownloadTypeChange={setDownloadType}
              quality={quality}
              onQualityChange={setQuality}
              filename={filename}
              onFilenameChange={setFilename}
            />
          </CardContent>
        </Card>

        <Button type="submit" className="w-full gap-2" size="lg" disabled={submitting}>
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {t('form.submitting')}
            </>
          ) : (
            <>
              {t('form.submit')}
              <Download className="h-4 w-4" />
            </>
          )}
        </Button>

        <p className="text-muted-foreground text-center text-xs">
          {t('form.submit')}.{' '}
          <a href="/history" className="hover:text-foreground underline underline-offset-2">
            {tHistory('newDownload')}
          </a>
        </p>
      </div>
    </form>
  )
}

function UrlInput({
  label,
  placeholder,
  value,
  onChange,
}: {
  label: string
  placeholder: string
  value: string
  onChange: (val: string) => void
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-muted-foreground text-sm">{label}</label>
      <Input
        type="url"
        inputMode="url"
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="font-mono text-sm"
        spellCheck={false}
        dir="ltr"
      />
    </div>
  )
}
