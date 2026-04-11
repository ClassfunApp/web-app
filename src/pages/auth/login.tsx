import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Sparkles } from 'lucide-react';
import { useAuth } from '../../hooks/use-auth';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';

export default function LoginPage() {
  const { login, isAuthenticated, isContactVerified } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Redirect already-logged-in users
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
    <div className="min-h-screen flex bg-[#f0f3f9]">
      {/* Left panel — decorative */}
      <div className="hidden lg:flex lg:w-[42%] bg-indigo-600 p-12 flex-col justify-between relative overflow-hidden">
        {/* Background blobs */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-indigo-500 rounded-full opacity-50 blur-3xl" />
        <div className="absolute -bottom-32 -right-16 w-80 h-80 bg-violet-600 rounded-full opacity-40 blur-3xl" />

        <div className="relative z-10">
          <div className="flex items-center gap-2.5 mb-12">
            <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-sm">CF</span>
            </div>
            <span className="text-white font-bold text-lg">Classfun</span>
          </div>

          <h2 className="text-3xl font-bold text-white leading-snug">
            Manage your activity center with ease
          </h2>
          <p className="mt-4 text-indigo-200 text-sm leading-relaxed">
            Attendance, enrollments, payments, and staff — all in one beautiful dashboard.
          </p>
        </div>

        {/* Feature pills */}
        <div className="relative z-10 space-y-3">
          {[
            '✅  QR-code sign-in & sign-out',
            '💳  Paystack-powered fee collection',
            '👨‍👩‍👧  Family & guardian portal',
            '📊  Real-time attendance reports',
          ].map((f) => (
            <div key={f} className="flex items-center gap-2 text-indigo-100 text-sm">
              <span>{f}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md animate-slide-up">
          {/* Logo for mobile */}
          <div className="flex lg:hidden items-center gap-2 mb-8">
            <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-sm">CF</span>
            </div>
            <span className="text-slate-800 font-bold text-lg">Classfun</span>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-slate-800">Welcome back</h1>
            <p className="text-slate-500 text-sm mt-1">Sign in to your business dashboard</p>
          </div>

          <div className="bg-white rounded-2xl shadow-[0_4px_24px_-4px_rgba(0,0,0,0.08)] border border-slate-100 p-8">
            {error && (
              <div className="mb-5 flex items-start gap-2.5 p-3.5 rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm animate-slide-down">
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
                  className="absolute right-3 bottom-[10px] text-slate-400 hover:text-slate-600 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              <div className="flex justify-end">
                <Link to="/forgot-password" className="text-xs text-indigo-600 hover:text-indigo-700 font-medium transition-colors">
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

          <p className="mt-6 text-center text-sm text-slate-500">
            Don't have an account?{' '}
            <Link to="/register" className="text-indigo-600 hover:text-indigo-700 font-semibold transition-colors">
              Start your free trial
            </Link>
          </p>

          <p className="mt-3 text-center text-xs text-slate-400 flex items-center justify-center gap-1">
            <Sparkles size={11} /> 30-day free trial · No credit card required
          </p>
        </div>
      </div>
    </div>
  );
}
