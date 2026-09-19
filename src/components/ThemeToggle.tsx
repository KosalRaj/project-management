import { useEffect, useState } from 'react'
import { Sun, Moon, Monitor } from 'lucide-react'
import { IconSwap, TextSwap } from '@/components/ui/transitions'

type ThemeMode = 'light' | 'dark' | 'auto'

function getInitialMode(): ThemeMode {
  if (typeof window === 'undefined') {
    return 'auto'
  }

  const stored = window.localStorage.getItem('theme')
  if (stored === 'light' || stored === 'dark' || stored === 'auto') {
    return stored
  }

  return 'auto'
}

function applyThemeMode(mode: ThemeMode) {
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  const resolved = mode === 'auto' ? (prefersDark ? 'dark' : 'light') : mode

  // Suppress transitions on theme switch to prevent visual smearing
  const style = document.createElement('style')
  style.append(
    document.createTextNode('*,*::before,*::after{transition:none !important}')
  )
  document.head.append(style)

  document.documentElement.classList.remove('light', 'dark')
  document.documentElement.classList.add(resolved)

  if (mode === 'auto') {
    document.documentElement.removeAttribute('data-theme')
  } else {
    document.documentElement.setAttribute('data-theme', mode)
  }

  document.documentElement.style.colorScheme = resolved

  // Force reflow while override stylesheet is active
  void document.body.offsetHeight

  requestAnimationFrame(() => {
    requestAnimationFrame(() => style.remove())
  })
}

export default function ThemeToggle() {
  const [mode, setMode] = useState<ThemeMode>('auto')

  useEffect(() => {
    const initialMode = getInitialMode()
    setMode(initialMode)
    applyThemeMode(initialMode)
  }, [])

  useEffect(() => {
    if (mode !== 'auto') {
      return
    }

    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => applyThemeMode('auto')

    media.addEventListener('change', onChange)
    return () => {
      media.removeEventListener('change', onChange)
    }
  }, [mode])

  function toggleMode() {
    const nextMode: ThemeMode =
      mode === 'light' ? 'dark' : mode === 'dark' ? 'auto' : 'light'
    setMode(nextMode)
    applyThemeMode(nextMode)
    window.localStorage.setItem('theme', nextMode)
  }

  const label =
    mode === 'auto'
      ? 'Theme mode: auto (system). Click to switch to light mode.'
      : `Theme mode: ${mode}. Click to switch mode.`

  const displayText = mode === 'auto' ? 'Auto' : mode === 'dark' ? 'Dark' : 'Light'

  return (
    <button
      type="button"
      onClick={toggleMode}
      aria-label={label}
      title={label}
      className="inline-flex items-center gap-1.5 rounded-full border border-[var(--chip-line)] bg-[var(--chip-bg)] px-3 py-1.5 text-xs font-semibold text-[var(--sea-ink)] shadow-[0_8px_22px_rgba(30,90,72,0.08)] transition hover:-translate-y-0.5 active:translate-y-0"
    >
      <IconSwap
        state={mode === 'dark' ? 'b' : 'a'}
        iconA={mode === 'auto' ? <Monitor className="size-3.5" /> : <Sun className="size-3.5 text-amber-500" />}
        iconB={<Moon className="size-3.5 text-sky-400" />}
        className="size-3.5"
      />
      <TextSwap text={displayText} className="min-w-[2.2rem] text-left" />
    </button>
  )
}

