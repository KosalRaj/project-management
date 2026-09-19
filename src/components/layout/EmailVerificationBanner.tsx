import { useState, useEffect } from 'react'
import { Link } from '@tanstack/react-router'
import { useAuth } from '@/lib/auth-context'
import { sendEmailVerificationFn } from '@/server/email'
import { AlertTriangle, ArrowRight, RotateCw, X, CheckCircle2 } from 'lucide-react'

export function EmailVerificationBanner() {
  const { user } = useAuth()
  const [isDismissed, setIsDismissed] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)
  const [toastMsg, setToastMsg] = useState<string | null>(null)

  useEffect(() => {
    if (resendCooldown <= 0) return
    const timer = setInterval(() => {
      setResendCooldown((prev) => Math.max(0, prev - 1))
    }, 1000)
    return () => clearInterval(timer)
  }, [resendCooldown])

  if (!user || user.emailVerified || isDismissed) {
    return null
  }

  const handleResend = async () => {
    if (resendCooldown > 0 || isResending || !user.email) return
    setIsResending(true)
    setToastMsg(null)
    try {
      await sendEmailVerificationFn({ data: { email: user.email } })
      setResendCooldown(60)
      setToastMsg('Verification email sent!')
      setTimeout(() => setToastMsg(null), 4000)
    } catch (err: any) {
      setToastMsg(err?.message || 'Failed to resend')
      setTimeout(() => setToastMsg(null), 4000)
    } finally {
      setIsResending(false)
    }
  }

  return (
    <div className="relative z-30 bg-amber-500/10 border-b border-amber-500/25 px-4 py-2.5 text-amber-900 dark:text-amber-200 transition-[background-color,border-color] duration-200 ease-out">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2.5 text-xs">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex size-6 shrink-0 items-center justify-center rounded-md bg-amber-500/20 text-amber-600 dark:text-amber-400">
            <AlertTriangle className="size-3.5" />
          </div>
          <p className="truncate">
            <span className="font-bold">Email unverified:</span> Confirm{' '}
            <strong className="text-foreground">{user.email}</strong> to activate task email notifications & password recovery.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {toastMsg && (
            <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="size-3" /> {toastMsg}
            </span>
          )}

          <button
            type="button"
            onClick={handleResend}
            disabled={resendCooldown > 0 || isResending}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-amber-500/15 hover:bg-amber-500/25 text-amber-800 dark:text-amber-200 transition-colors cursor-pointer ${
              resendCooldown > 0 || isResending ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <RotateCw className={`size-3 ${isResending ? 'animate-spin' : ''}`} />
            {resendCooldown > 0 ? `Resend (${resendCooldown}s)` : 'Resend Email'}
          </button>

          <Link
            to="/verify-email"
            search={{ email: user.email, token: undefined }}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-2xs transition-colors"
          >
            Verify Now <ArrowRight className="size-3 rtl:-scale-x-100" />
          </Link>

          <button
            type="button"
            onClick={() => setIsDismissed(true)}
            aria-label="Dismiss banner"
            className="p-1 text-amber-700 dark:text-amber-400 hover:text-foreground rounded transition-colors cursor-pointer"
          >
            <X className="size-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}
