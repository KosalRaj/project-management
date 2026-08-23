import { useState, useEffect, useRef } from 'react'

/**
 * AnimatedDigitGroup — Implements 02-number-pop-in.md
 * Renders numbers with blurred entrance and staggered decimal digits.
 */
interface AnimatedDigitGroupProps {
  value: number | string
  prefix?: string
  suffix?: string
  className?: string
}

export function AnimatedDigitGroup({
  value,
  prefix = '',
  suffix = '',
  className = '',
}: AnimatedDigitGroupProps) {
  const [animating, setAnimating] = useState(false)
  const prevValueRef = useRef(value)
  const groupRef = useRef<HTMLSpanElement>(null)

  const str = String(value)
  const characters = str.split('')
  const totalChars = characters.length

  useEffect(() => {
    if (prevValueRef.current !== value) {
      prevValueRef.current = value
      setAnimating(false)
      // Force reflow for replay
      if (groupRef.current) {
        void groupRef.current.offsetWidth
      }
      setAnimating(true)
      const timer = setTimeout(() => setAnimating(false), 600)
      return () => clearTimeout(timer)
    }
  }, [value])

  // Also trigger initial animation on mount
  useEffect(() => {
    setAnimating(true)
    const timer = setTimeout(() => setAnimating(false), 600)
    return () => clearTimeout(timer)
  }, [])

  return (
    <span
      ref={groupRef}
      className={`t-digit-group ${animating ? 'is-animating' : ''} ${className}`}
    >
      {prefix && <span className="t-digit">{prefix}</span>}
      {characters.map((char, index) => {
        // Tag the last two digits with data-stagger for staggered entry
        const isSecondToLast = index === totalChars - 2
        const isLast = index === totalChars - 1
        const stagger = isLast ? '2' : isSecondToLast ? '1' : undefined

        return (
          <span
            key={`${index}-${char}`}
            className="t-digit"
            data-stagger={stagger}
          >
            {char}
          </span>
        )
      })}
      {suffix && <span className="t-digit">{suffix}</span>}
    </span>
  )
}

/**
 * SuccessCheckIcon — Implements 10-success-check.md
 * Multi-layer appear animation (fade + rotate + blur + Y-bob + SVG path stroke draw).
 */
interface SuccessCheckIconProps {
  className?: string
  size?: number
}

export function SuccessCheckIcon({ className = '', size = 20 }: SuccessCheckIconProps) {
  const [state, setState] = useState<'out' | 'in'>('out')

  useEffect(() => {
    // Small microtask to trigger the data-state="in" animation cleanly
    const t = requestAnimationFrame(() => {
      setState('in')
    })
    return () => cancelAnimationFrame(t)
  }, [])

  return (
    <span
      className={`t-success-check ${className}`}
      data-state={state}
      aria-hidden="true"
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M20 6L9 17l-5-5" />
      </svg>
    </span>
  )
}

/**
 * useShakeError — Implements 12-error-state-shake.md
 * Hook for form error shake, auto-revert timers, and cancel-on-typing.
 */
export function useShakeError(revertHoldMs = 3000) {
  const [isShaking, setIsShaking] = useState(false)
  const [isError, setIsError] = useState(false)
  const [errorText, setErrorText] = useState<string | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const triggerError = (message: string) => {
    setErrorText(message)
    setIsError(true)

    // Replay shake with reflow simulation
    setIsShaking(false)
    setTimeout(() => {
      setIsShaking(true)
    }, 10)

    if (timerRef.current) clearTimeout(timerRef.current)

    // Clear shake class after 280ms
    setTimeout(() => {
      setIsShaking(false)
    }, 300)

    // Auto-revert error after hold time
    timerRef.current = setTimeout(() => {
      setIsError(false)
    }, 300 + revertHoldMs)
  }

  const clearError = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    setIsError(false)
    setIsShaking(false)
    setErrorText(null)
  }

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  return {
    isShaking,
    isError,
    errorText,
    triggerError,
    clearError,
  }
}

/**
 * IconSwap — Implements 09-icon-swap.md
 * Cross-fades two icons in the same grid slot with blur and scale.
 */
interface IconSwapProps {
  state: 'a' | 'b'
  iconA: React.ReactNode
  iconB: React.ReactNode
  className?: string
}

export function IconSwap({ state, iconA, iconB, className = '' }: IconSwapProps) {
  return (
    <div className={`t-icon-swap ${className}`} data-state={state}>
      <span className="t-icon flex items-center justify-center" data-icon="a">
        {iconA}
      </span>
      <span className="t-icon flex items-center justify-center" data-icon="b">
        {iconB}
      </span>
    </div>
  )
}

/**
 * TextSwap — Implements 04-text-states-swap.md
 * Swaps text in place with blurred up-exit and down-enter transition.
 */
interface TextSwapProps {
  text: string
  className?: string
}

export function TextSwap({ text, className = '' }: TextSwapProps) {
  const [displayText, setDisplayText] = useState(text)
  const [phase, setPhase] = useState<'idle' | 'exit' | 'enter-start'>('idle')
  const elRef = useRef<HTMLSpanElement>(null)
  const prevTextRef = useRef(text)

  useEffect(() => {
    if (prevTextRef.current !== text) {
      prevTextRef.current = text
      setPhase('exit')

      const timer = setTimeout(() => {
        setDisplayText(text)
        setPhase('enter-start')

        // Force reflow
        if (elRef.current) {
          void elRef.current.offsetHeight
        }

        setPhase('idle')
      }, 200)

      return () => clearTimeout(timer)
    }
  }, [text])

  const phaseClass =
    phase === 'exit'
      ? 'is-exit'
      : phase === 'enter-start'
      ? 'is-enter-start'
      : ''

  return (
    <span ref={elRef} className={`t-text-swap ${phaseClass} ${className}`}>
      {displayText}
    </span>
  )
}

/**
 * AvatarGroup — Implements 11-avatar-group-hover.md
 * Distance-falloff spring lift on a row of avatars or items.
 */
interface AvatarGroupProps {
  items: React.ReactNode[]
  className?: string
}

export function AvatarGroup({ items, className = '' }: AvatarGroupProps) {
  const rootRef = useRef<HTMLDivElement>(null)

  const setShifts = (activeIdx: number | null, phase: 'in' | 'out') => {
    if (!rootRef.current) return
    const cs = getComputedStyle(document.documentElement)
    const num = (name: string, fb: number) => {
      const v = parseFloat(cs.getPropertyValue(name))
      return Number.isFinite(v) ? v : fb
    }
    const ease = (name: string, fb: string) => cs.getPropertyValue(name).trim() || fb

    const lift = num('--avatar-lift', -4)
    const falloff = num('--avatar-falloff', 0.45)
    const scale = num('--avatar-scale', 1.05)
    const tf =
      phase === 'out'
        ? ease('--avatar-ease-out', 'cubic-bezier(0.34, 3.85, 0.64, 1)')
        : ease('--avatar-ease-in', 'cubic-bezier(0.22, 1, 0.36, 1)')

    const avatars = rootRef.current.querySelectorAll<HTMLElement>('.t-avatar')
    avatars.forEach((el, i) => {
      el.style.transitionTimingFunction = tf
      if (activeIdx === null) {
        el.style.setProperty('--shift', '0px')
        el.style.setProperty('--scale-active', '1')
        return
      }
      const d = Math.abs(i - activeIdx)
      el.style.setProperty('--shift', `${(lift * Math.pow(falloff, d)).toFixed(3)}px`)
      el.style.setProperty('--scale-active', i === activeIdx ? String(scale) : '1')
    })
  }

  return (
    <div
      ref={rootRef}
      className={`t-avatar-group flex items-center ${className}`}
      onMouseLeave={() => setShifts(null, 'out')}
    >
      {items.map((node, i) => (
        <div
          key={i}
          className="t-avatar cursor-pointer"
          onMouseEnter={() => setShifts(i, 'in')}
        >
          {node}
        </div>
      ))}
    </div>
  )
}

/**
 * NotificationBadge — Implements 03-notification-badge.md
 * Notification dot with slide-in and pop-in spring transitions.
 */
interface NotificationBadgeProps {
  open?: boolean
  children?: React.ReactNode
  className?: string
  dotClassName?: string
}

export function NotificationBadge({
  open = true,
  children,
  className = '',
  dotClassName = '',
}: NotificationBadgeProps) {
  return (
    <div className={`relative inline-flex ${className}`}>
      {children}
      <span
        className="t-badge absolute -top-1 -right-1"
        data-open={open ? 'true' : 'false'}
      >
        <span
          className={`t-badge-dot size-2.5 rounded-full bg-rose-500 ring-2 ring-background ${dotClassName}`}
        />
      </span>
    </div>
  )
}

