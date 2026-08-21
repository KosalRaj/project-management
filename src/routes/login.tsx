import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import { Tabs, TabsList, TabsTab, TabsPanel } from '@/components/ui/tabs'
import { useShakeError } from '@/components/ui/transitions'
import ThemeToggle from '@/components/ThemeToggle'
import {
  Layers,
  Lock,
  Mail,
  User,
  Sparkles,
  ArrowRight,
  AlertCircle,
  Building2,
  Briefcase,
} from 'lucide-react'

export const Route = createFileRoute('/login')({
  component: LoginPage,
})

function LoginPage() {
  const { login, register, isAuthenticated } = useAuth()
  const navigate = useNavigate()

  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signin')

  // Sign In Form
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')

  // Sign Up Form
  const [registerName, setRegisterName] = useState('')
  const [registerEmail, setRegisterEmail] = useState('')
  const [registerPassword, setRegisterPassword] = useState('')
  const [registerDepartment, setRegisterDepartment] = useState('Engineering')
  const [registerTitle, setRegisterTitle] = useState('')

  const shake = useShakeError(4000)
  const [isLoading, setIsLoading] = useState(false)

  // If already authenticated, redirect to /
  useEffect(() => {
    if (isAuthenticated) {
      navigate({ to: '/' })
    }
  }, [isAuthenticated, navigate])

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    shake.clearError()
    setIsLoading(true)
    try {
      await login(loginEmail, loginPassword)
      navigate({ to: '/' })
    } catch (err: any) {
      shake.triggerError(err?.message || 'Login failed. Please check your credentials.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    shake.clearError()
    setIsLoading(true)
    try {
      await register({
        name: registerName,
        email: registerEmail,
        password: registerPassword,
        department: registerDepartment,
        title: registerTitle || 'Team Member',
      })
      navigate({ to: '/' })
    } catch (err: any) {
      shake.triggerError(err?.message || 'Registration failed. Please check your information.')
    } finally {
      setIsLoading(false)
    }
  }

  const fillDemo = (email: string) => {
    setLoginEmail(email)
    setLoginPassword('password123')
    shake.clearError()
  }

  return (
    <div className="min-h-screen w-full flex flex-col bg-background text-foreground relative overflow-hidden">
      {/* Background Decorative Subtle Mesh Ambient Glow */}
      <div className="absolute top-[-15%] left-[-10%] size-[32rem] rounded-full bg-blue-500/5 dark:bg-sky-500/8 blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-15%] right-[-10%] size-[32rem] rounded-full bg-indigo-500/5 dark:bg-indigo-500/8 blur-3xl pointer-events-none" />

      {/* Top Header */}
      <div className="flex items-center justify-between p-6 max-w-6xl w-full mx-auto">
        <div className="flex items-center gap-2.5">
          <div className="flex size-10 items-center justify-center rounded-xl bg-slate-900 dark:bg-sky-500 text-white dark:text-slate-950 shadow-sm shadow-slate-900/10">
            <Layers className="size-5" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-base tracking-tight text-foreground flex items-center gap-1.5">
              Initiative OS
              <Badge variant="outline" className="text-[10px] h-4 px-1.5 font-mono font-semibold text-primary border-primary/20 bg-primary/5">
                PRO
              </Badge>
            </span>
            <span className="text-xs text-muted-foreground">Portfolio Engine</span>
          </div>
        </div>

        <ThemeToggle />
      </div>

      {/* Main Center Auth Card */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 z-10">
        <div className={`w-full max-w-md rounded-3xl border ${shake.isError ? 'border-destructive/60' : 'border-border/70'} bg-card/90 p-6 sm:p-8 shadow-xl backdrop-blur-xl space-y-6 ${shake.isShaking ? 'is-shaking' : ''}`}>
          {/* Header Title */}
          <div className="text-center space-y-1.5">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Welcome to Initiative OS
            </h1>
            <p className="text-xs text-muted-foreground">
              Sign in to manage team initiatives, track velocity, and align portfolio roadmap.
            </p>
          </div>

          {/* Quick Demo Credentials */}
          <div className="rounded-2xl border border-border/60 bg-muted/40 p-3 space-y-2">
            <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              <span>Quick Demo Sign In</span>
              <Sparkles className="size-3.5 text-primary" />
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              <Button
                variant="outline"
                size="xs"
                type="button"
                onClick={() => fillDemo('admin@company.com')}
                className="text-[11px] h-8 bg-background/80 hover:border-primary/50 flex items-center gap-1"
              >
                👑 Admin
              </Button>
              <Button
                variant="outline"
                size="xs"
                type="button"
                onClick={() => fillDemo('marcus@company.com')}
                className="text-[11px] h-8 bg-background/80 hover:border-primary/50 flex items-center gap-1"
              >
                🎨 Manager
              </Button>
              <Button
                variant="outline"
                size="xs"
                type="button"
                onClick={() => fillDemo('aisha@company.com')}
                className="text-[11px] h-8 bg-background/80 hover:border-primary/50 flex items-center gap-1"
              >
                🚀 Member
              </Button>
            </div>
          </div>

          {/* Error Message with transitions-dev reveal */}
          <div className={`t-input-wrap ${shake.isError ? 'is-error' : ''}`}>
            {shake.errorText && (
              <div className="t-error-msg p-3 rounded-xl border border-destructive/30 bg-destructive/10 text-destructive text-xs flex items-center gap-2">
                <AlertCircle className="size-4 shrink-0" />
                <span>{shake.errorText}</span>
              </div>
            )}
          </div>

          {/* Auth Tabs */}
          <Tabs
            value={activeTab}
            onValueChange={(val) => {
              setActiveTab(val as 'signin' | 'signup')
              shake.clearError()
            }}
          >
            <TabsList className="grid grid-cols-2 w-full mb-4">
              <TabsTab value="signin">Sign In</TabsTab>
              <TabsTab value="signup">Create Account</TabsTab>
            </TabsList>

            {/* SIGN IN TAB */}
            <TabsPanel value="signin">
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1">
                    <Mail className="size-3.5" />
                    Email
                  </label>
                  <Input
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="admin@company.com"
                    required
                    className="bg-background text-sm h-10"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1">
                    <Lock className="size-3.5" />
                    Password
                  </label>
                  <Input
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="bg-background text-sm h-10"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-10 gap-2 font-semibold shadow-md shadow-primary/20"
                >
                  {isLoading && <Spinner className="size-4" />}
                  Sign In to Workspace
                  <ArrowRight className="size-4" />
                </Button>
              </form>
            </TabsPanel>

            {/* SIGN UP TAB */}
            <TabsPanel value="signup">
              <form onSubmit={handleRegisterSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1 flex items-center gap-1">
                    <User className="size-3.5" />
                    Full Name
                  </label>
                  <Input
                    value={registerName}
                    onChange={(e) => setRegisterName(e.target.value)}
                    placeholder="Alex Rivera"
                    required
                    className="bg-background text-sm h-9"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1 flex items-center gap-1">
                    <Mail className="size-3.5" />
                    Email Address
                  </label>
                  <Input
                    type="email"
                    value={registerEmail}
                    onChange={(e) => setRegisterEmail(e.target.value)}
                    placeholder="alex@company.com"
                    required
                    className="bg-background text-sm h-9"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1 flex items-center gap-1">
                    <Lock className="size-3.5" />
                    Password
                  </label>
                  <Input
                    type="password"
                    value={registerPassword}
                    onChange={(e) => setRegisterPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    required
                    className="bg-background text-sm h-9"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1 flex items-center gap-1">
                      <Building2 className="size-3.5" />
                      Department
                    </label>
                    <Input
                      value={registerDepartment}
                      onChange={(e) => setRegisterDepartment(e.target.value)}
                      placeholder="Engineering"
                      className="bg-background text-sm h-9"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1 flex items-center gap-1">
                      <Briefcase className="size-3.5" />
                      Title
                    </label>
                    <Input
                      value={registerTitle}
                      onChange={(e) => setRegisterTitle(e.target.value)}
                      placeholder="Software Engineer"
                      className="bg-background text-sm h-9"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-10 mt-2 gap-2 font-semibold shadow-md shadow-primary/20"
                >
                  {isLoading && <Spinner className="size-4" />}
                  Create Free Account
                  <ArrowRight className="size-4" />
                </Button>
              </form>
            </TabsPanel>
          </Tabs>
        </div>
      </div>

      {/* Footer info */}
      <div className="p-4 text-center text-xs text-muted-foreground">
        Initiative OS • Secure Authentication & Zero-Trust RBAC
      </div>
    </div>
  )
}
