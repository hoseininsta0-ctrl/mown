'use client'

import { FileAudio, FileVideo, Globe, HardDrive } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import type { DownloadType, InputType } from '@/lib/mock-data'
import { useTranslations } from 'next-intl'

interface JobConfigPanelProps {
  inputType: InputType
  downloadType: DownloadType
  onDownloadTypeChange: (val: DownloadType) => void
  quality: string
  onQualityChange: (val: string) => void
  filename: string
  onFilenameChange: (val: string) => void
}

const downloadTypes: {
  type: DownloadType
  label: string
  description: string
  icon: React.ElementType
  compatibleWith: InputType[]
}[] = [
  {
    type: 'video',
    label: 'Video',
    description: 'MP4',
    icon: FileVideo,
    compatibleWith: ['youtube'],
  },
  {
    type: 'audio',
    label: 'Audio',
    description: 'MP3',
    icon: FileAudio,
    compatibleWith: ['youtube'],
  },
  {
    type: 'webpage',
    label: 'Webpage',
    description: 'MHTML',
    icon: Globe,
    compatibleWith: ['snapshot'],
  },
  {
    type: 'raw',
    label: 'Raw File',
    description: 'Original',
    icon: HardDrive,
    compatibleWith: ['direct'],
  },
]

const qualityOptions = ['2160p', '1440p', '1080p', '720p', '480p', '360p', 'best']

export function JobConfigPanel({
  inputType,
  downloadType,
  onDownloadTypeChange,
  quality,
  onQualityChange,
  filename,
  onFilenameChange,
}: JobConfigPanelProps) {
  const t = useTranslations('jobConfig')
  const available = downloadTypes.filter(d => d.compatibleWith.includes(inputType))

  // Map download type to translation key
  const typeKeyMap: Record<string, string> = {
    video: 'video',
    audio: 'audio',
    webpage: 'snapshot',
    raw: 'direct',
  }

  // Map quality to translation key
  const qualityKeyMap: Record<string, string> = {
    '2160p': '2160',
    '1440p': '1440',
    '1080p': '1080',
    '720p': '720',
    '480p': '480',
    '360p': '360',
    best: 'best',
  }

  return (
    <div className="space-y-5">
      {/* Download type selector */}
      <div className="space-y-2">
        <Label className="text-muted-foreground text-sm">{t('type.label')}</Label>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {downloadTypes.map(({ type, label, description, icon: Icon, compatibleWith }) => {
            const disabled = !compatibleWith.includes(inputType)
            const selected = downloadType === type
            const typeKey = typeKeyMap[type] || type
            return (
              <button
                key={type}
                type="button"
                disabled={disabled}
                onClick={() => !disabled && onDownloadTypeChange(type)}
                className={cn(
                  'flex flex-col items-center gap-1.5 rounded-lg border p-3 text-sm transition-all',
                  selected
                    ? 'border-primary/60 bg-primary/10 text-foreground'
                    : 'border-border bg-card text-muted-foreground',
                  disabled
                    ? 'cursor-not-allowed opacity-30'
                    : 'hover:border-border hover:bg-secondary hover:text-foreground cursor-pointer'
                )}
              >
                <Icon className={cn('h-5 w-5', selected && 'text-primary')} />
                <span className="font-medium">{t(`type.${typeKey}`)}</span>
                <span className="text-[11px] opacity-70">{description}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Quality selector (YouTube only) */}
      {(downloadType === 'video' || downloadType === 'audio') && inputType === 'youtube' && (
        <div className="space-y-1.5">
          <Label htmlFor="quality" className="text-muted-foreground text-sm">
            {t('quality.label')}
          </Label>
          <Select value={quality} onValueChange={onQualityChange}>
            <SelectTrigger id="quality" className="w-40">
              <SelectValue placeholder={t('quality.label')} />
            </SelectTrigger>
            <SelectContent>
              {qualityOptions.map(q => (
                <SelectItem key={q} value={q}>
                  {t(`quality.${qualityKeyMap[q] || q}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Filename override */}
      <div className="space-y-1.5">
        <Label htmlFor="filename" className="text-muted-foreground text-sm">
          {t('filename.label')} <span className="text-[11px] opacity-60">(optional)</span>
        </Label>
        <Input
          id="filename"
          placeholder={t('filename.placeholder')}
          value={filename}
          onChange={e => onFilenameChange(e.target.value)}
          className="font-mono text-sm"
          spellCheck={false}
          dir="ltr"
        />
      </div>
    </div>
  )
}
