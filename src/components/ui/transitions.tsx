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
