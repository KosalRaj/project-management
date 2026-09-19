import { createFileRoute, useNavigate, Link } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { verifyEmailTokenFn, sendEmailVerificationFn } from '@/server/email'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { useShakeError, SuccessCheckIcon } from '@/components/ui/transitions'
import ThemeToggle from '@/components/ThemeToggle'
import { useAuth } from '@/lib/auth-context'
import {
  Mail,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  RotateCw,
  KeyRound,
} from 'lucide-react'

export const Route = createFileRoute('/verify-email')({
  validateSearch: (search: Record<string, unknown>): { token?: string; email?: string } => ({
    token: typeof search.token === 'string' ? search.token : undefined,
    email: typeof search.email === 'string' ? search.email : undefined,
  }),
  component: VerifyEmailPage,
})

function VerifyEmailPage() {
  const { token: urlToken, email: urlEmail } = Route.useSearch()
  const navigate = useNavigate()
  const { user, refetchUser } = useAuth()

  const [otpCode, setOtpCode] = useState('')
  const [emailInput, setEmailInput] = useState(urlEmail || user?.email || '')
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const [resendCooldown, setResendCooldown] = useState(0)
  const [isResending, setIsResending] = useState(false)

  const shake = useShakeError(4000)

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return
    const timer = setInterval(() => {
      setResendCooldown((prev) => Math.max(0, prev - 1))
    }, 1000)
    return () => clearInterval(timer)
  }, [resendCooldown])

  // Automatic token verification if token is present in URL
  useEffect(() => {
    if (!urlToken) return

    let isMounted = true
    const autoVerify = async () => {
      setIsLoading(true)
      shake.clearError()
      try {
        const res = await verifyEmailTokenFn({ data: { token: urlToken } })
        if (isMounted && res.success) {
          setIsSuccess(true)
          setSuccessMsg(res.message || 'Email verified successfully!')
          await refetchUser()
        }
      } catch (err: any) {
        if (isMounted) {
          shake.triggerError(err?.message || 'Invalid or expired verification link.')
        }
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    autoVerify()
    return () => {
      isMounted = false
    }
  }, [urlToken])

  const handleManualCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    shake.clearError()

    if (!emailInput.trim() || !emailInput.includes('@')) {
      shake.triggerError('Please enter a valid email address')
      return
    }

    if (!otpCode.trim() || otpCode.trim().length !== 6) {
      shake.triggerError('Please enter the 6-digit confirmation code')
      return
    }

    setIsLoading(true)
    try {
      const res = await verifyEmailTokenFn({
        data: {
          email: emailInput.toLowerCase().trim(),
          code: otpCode.trim(),
        },
      })
      if (res.success) {
        setIsSuccess(true)
        setSuccessMsg(res.message || 'Email verified successfully!')
        await refetchUser()
      }
    } catch (err: any) {
      shake.triggerError(err?.message || 'Failed to verify code. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleResend = async () => {
    if (resendCooldown > 0 || isResending) return
    if (!emailInput.trim() || !emailInput.includes('@')) {
      shake.triggerError('Please enter your email to resend verification')
      return
    }

    setIsResending(true)
    shake.clearError()
    try {
      await sendEmailVerificationFn({ data: { email: emailInput.toLowerCase().trim() } })
      setResendCooldown(60)
      setSuccessMsg('A new verification code has been dispatched to your email.')
    } catch (err: any) {
      shake.triggerError(err?.message || 'Failed to resend verification email')
    } finally {
      setIsResending(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 relative overflow-hidden text-slate-100">
      {/* Background Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-primary/20 rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[350px] h-[350px] bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Theme Toggle Top Right */}
      <div className="absolute top-5 right-5 z-20">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md z-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex size-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-primary to-indigo-500 shadow-xl shadow-primary/25 border border-white/20 mb-2">
            <ShieldCheck className="size-6 text-white" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center justify-center gap-1.5">
            Project Pulse
          </h1>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Email Identity & Notification Verification
          </p>
        </div>

        {/* Main Card */}
        <div
          className={`rounded-3xl border border-slate-800 bg-slate-900/80 p-7 shadow-2xl backdrop-blur-2xl transition-[border-color,box-shadow] duration-200 ease-out ${
            shake.isShaking ? 'is-shaking' : ''
          }`}
        >
          {isSuccess ? (
            /* Success View */
            <div className="text-center py-6 space-y-5">
              <div className="inline-flex size-16 items-center justify-center rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 shadow-xl shadow-emerald-500/10 animate-in zoom-in-90 duration-300">
                <SuccessCheckIcon size={32} />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-lg font-bold text-white">Email Address Confirmed!</h3>
                <p className="text-xs text-slate-400">
                  {successMsg || 'Your account is now fully verified. Task notifications, status alerts, and security features are active.'}
                </p>
              </div>
              <Button
                onClick={() => navigate({ to: '/' })}
                className="w-full h-10 gap-2 font-bold shadow-lg shadow-primary/25 cursor-pointer"
              >
                Go to Workspace Dashboard <ArrowRight className="size-4" />
              </Button>
            </div>
          ) : isLoading && urlToken ? (
            /* Auto-verifying Loader View */
            <div className="text-center py-10 space-y-4">
              <Spinner className="size-8 text-primary mx-auto" />
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-white">Validating Security Token...</h3>
                <p className="text-xs text-slate-400">
                  Confirming your email address with the verification service.
                </p>
              </div>
            </div>
          ) : (
            /* Manual Code Form View */
            <form onSubmit={handleManualCodeSubmit} className="space-y-4">
              <div className="text-center space-y-1 pb-1">
                <h2 className="text-base font-bold text-white">Confirm Your Email Address</h2>
                <p className="text-xs text-slate-400">
                  Enter the 6-digit confirmation code sent to your inbox.
                </p>
              </div>

              {shake.errorText && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-destructive/15 border border-destructive/30 text-destructive text-xs font-medium animate-in fade-in">
                  <AlertCircle className="size-4 shrink-0" />
                  <span>{shake.errorText}</span>
                </div>
              )}

              {successMsg && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-medium animate-in fade-in">
                  <CheckCircle2 className="size-4 shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Mail className="size-3.5 text-slate-400" /> Email Address
                </label>
                <Input
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="name@company.com"
                  className="bg-slate-950/60 border-slate-800 text-xs h-9 text-white placeholder:text-slate-500"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <KeyRound className="size-3.5 text-slate-400" /> 6-Digit Verification Code
                </label>
                <Input
                  type="text"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="123456"
                  className="bg-slate-950/60 border-slate-800 text-center font-mono text-lg tracking-widest font-bold h-11 text-primary placeholder:text-slate-600"
                  required
                />
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-10 gap-2 font-bold shadow-lg shadow-primary/25 cursor-pointer mt-2"
              >
                {isLoading ? <Spinner className="size-4" /> : <ShieldCheck className="size-4" />}
                Confirm & Verify Email
              </Button>

              <div className="pt-2 flex items-center justify-between text-xs border-t border-slate-800/80 mt-4">
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resendCooldown > 0 || isResending}
                  className={`flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors cursor-pointer ${
                    resendCooldown > 0 || isResending ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  <RotateCw className={`size-3 ${isResending ? 'animate-spin' : ''}`} />
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
                </button>

                <Link
                  to="/login"
                  className="text-primary hover:text-primary/80 font-medium transition-colors"
                >
                  Back to Sign In
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
