'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Download, History, Moon, Sun, Zap, BookOpen } from 'lucide-react'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useTranslations } from 'next-intl'
import { LanguageSwitcher } from '@/components/language-switcher'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useReopenOnboarding } from '@/components/onboarding-wizard'

const navLinks = [
  { href: '/', key: 'newJob' as const, icon: Download },
  { href: '/history', key: 'history' as const, icon: History },
]

export function Navbar() {
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()
  const t = useTranslations('navbar')
  const tOnboarding = useTranslations('onboarding')
  const reopenOnboarding = useReopenOnboarding()

  return (
    <header className="border-border bg-card/80 sticky top-0 z-50 w-full border-b backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="bg-primary flex h-7 w-7 items-center justify-center rounded-md">
            <Zap className="text-primary-foreground h-4 w-4" />
          </div>
          <span className="text-foreground font-semibold tracking-tight">Mown</span>
          <span className="bg-muted text-muted-foreground rounded px-1.5 py-0.5 text-[10px] font-medium">
            BETA
          </span>
        </Link>

        {/* Nav Links */}
        <nav className="flex items-center gap-1">
          {navLinks.map(({ href, key, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                pathname === href
                  ? 'bg-secondary text-foreground'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{t(key)}</span>
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1">
          {/* Guide/Onboarding button */}
          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={reopenOnboarding}
                  aria-label={tOnboarding('reopen')}
                >
                  <BookOpen className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>{tOnboarding('reopen')}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <LanguageSwitcher />

          {/* Theme toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            aria-label="Toggle theme"
          >
            <Sun className="h-4 w-4 scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
            <Moon className="absolute h-4 w-4 scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
          </Button>
        </div>
      </div>
    </header>
  )
}
