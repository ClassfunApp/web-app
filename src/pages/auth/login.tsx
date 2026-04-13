import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../hooks/use-auth';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { ClassfunLogo } from '../../components/ui/classfun-logo';

export default function LoginPage() {
  const { login, isAuthenticated, isContactVerified } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      navigate(isContactVerified ? '/' : '/verify-contact', { replace: true });
    }
  }, [isAuthenticated, isContactVerified, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Login failed';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#f0f3f9] dark:bg-slate-950">
      {/* Left decorative panel */}
      <div className="hidden lg:flex lg:w-[44%] bg-[#1B2B4A] p-12 flex-col justify-between relative overflow-hidden">
        {/* Background orbs */}
        <div className="absolute -top-20 -left-20 w-80 h-80 bg-indigo-600 rounded-full opacity-20 blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 right-0 w-64 h-64 bg-[#E87600] rounded-full opacity-10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-12 w-72 h-72 bg-indigo-800 rounded-full opacity-30 blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <ClassfunLogo variant="wordmark" size="2xl" animated className="mb-12" />

          <h2 className="text-3xl font-bold text-white leading-snug">
            Manage your activity center with ease
          </h2>
          <p className="mt-4 text-slate-400 text-sm leading-relaxed max-w-xs">
            Attendance, enrollments, payments, and staff — all in one beautiful dashboard.
          </p>
        </div>

        <div className="relative z-10 space-y-3.5">
          {[
            { icon: '✅', text: 'QR-code sign-in & sign-out' },
            { icon: '💳', text: 'Paystack-powered fee collection' },
            { icon: '👨‍👩‍👧', text: 'Family & guardian portal' },
            { icon: '📊', text: 'Real-time attendance reports' },
          ].map(({ icon, text }) => (
            <div key={text} className="flex items-center gap-3 text-slate-300 text-sm">
              <span className="text-base leading-none">{icon}</span>
              <span>{text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md animate-slide-up">
          {/* Mobile logo */}
          <div className="flex lg:hidden justify-center mb-10">
            <ClassfunLogo variant="full" size="lg" animated />
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Welcome back 👋</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Sign in to your business dashboard</p>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-[0_4px_24px_-4px_rgba(0,0,0,0.08)] dark:shadow-[0_4px_24px_-4px_rgba(0,0,0,0.3)] border border-slate-100 dark:border-slate-800 p-8">
            {error && (
              <div className="mb-5 flex items-start gap-2.5 p-3.5 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/50 text-red-700 dark:text-red-400 text-sm animate-slide-down">
                <span className="mt-0.5 shrink-0">⚠️</span>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Email address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                autoComplete="email"
              />
              <div className="relative">
                <Input
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 bottom-[10px] text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              <div className="flex justify-end">
                <Link
                  to="/forgot-password"
                  className="text-xs text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
                >
                  Forgot password?
                </Link>
              </div>

              <Button type="submit" disabled={loading} className="w-full" size="lg">
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Signing in…
                  </span>
                ) : 'Sign in'}
              </Button>
            </form>
          </div>

          <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
            Don't have an account?{' '}
            <Link
              to="/register"
              className="text-[#E87600] hover:text-[#C46200] font-semibold transition-colors"
            >
              Start your free trial →
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
