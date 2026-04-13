import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../hooks/use-auth';
import { Input } from '../../components/ui/input';
import { Select } from '../../components/ui/select';
import { Button } from '../../components/ui/button';
import { ClassfunLogo } from '../../components/ui/classfun-logo';
import type { BillingRegion } from '../../types';

export default function RegisterPage() {
  const { register, isAuthenticated, isContactVerified } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    businessName: '',
    billingRegion: '' as BillingRegion | '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      navigate(isContactVerified ? '/' : '/verify-contact', { replace: true });
    }
  }, [isAuthenticated, isContactVerified, navigate]);

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const passwordStrength = (() => {
    const p = form.password;
    if (!p) return 0;
    let s = 0;
    if (p.length >= 8) s++;
    if (/[A-Z]/.test(p)) s++;
    if (/[0-9]/.test(p)) s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    return s;
  })();

  const strengthConfig = [
    { color: 'bg-red-400',    label: 'Weak' },
    { color: 'bg-orange-400', label: 'Fair' },
    { color: 'bg-yellow-400', label: 'Good' },
    { color: 'bg-emerald-500', label: 'Strong' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.billingRegion) { setError('Please select a billing region'); return; }
    setError('');
    setLoading(true);
    try {
      await register({ ...form, billingRegion: form.billingRegion as BillingRegion });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Registration failed';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#f0f3f9] dark:bg-slate-950">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-[44%] bg-[#1B2B4A] p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute -top-20 -left-20 w-80 h-80 bg-indigo-600 rounded-full opacity-20 blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 right-0 w-64 h-64 bg-[#E87600] rounded-full opacity-10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-12 w-72 h-72 bg-indigo-800 rounded-full opacity-30 blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <ClassfunLogo variant="wordmark" size="2xl" animated className="mb-12" />

          <h2 className="text-3xl font-bold text-white leading-snug">
            Start managing your activity center today
          </h2>
          <p className="mt-4 text-slate-400 text-sm leading-relaxed max-w-xs">
            Join hundreds of centers already using Classfun to simplify their operations.
          </p>
        </div>

        <div className="relative z-10 space-y-3.5">
          {[
            'No credit card required',
            '30-day free trial',
            'Cancel anytime',
            'Full feature access from day 1',
          ].map((text) => (
            <div key={text} className="flex items-center gap-3 text-slate-300 text-sm">
              <CheckCircle2 size={16} className="text-[#E87600] shrink-0" />
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
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Create your account</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Get started in under 2 minutes</p>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-[0_4px_24px_-4px_rgba(0,0,0,0.08)] dark:shadow-[0_4px_24px_-4px_rgba(0,0,0,0.3)] border border-slate-100 dark:border-slate-800 p-8">
            {error && (
              <div className="mb-5 flex items-start gap-2.5 p-3.5 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/50 text-red-700 dark:text-red-400 text-sm animate-slide-down">
                <span className="mt-0.5 shrink-0">⚠️</span>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input label="Full name" value={form.fullName} onChange={set('fullName')} required placeholder="John Doe" autoComplete="name" />
              <Input label="Email address" type="email" value={form.email} onChange={set('email')} required placeholder="you@example.com" autoComplete="email" />

              {/* Password + strength meter */}
              <div className="space-y-1.5">
                <div className="relative">
                  <Input
                    label="Password"
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={set('password')}
                    required
                    placeholder="Min. 8 characters"
                    minLength={8}
                    autoComplete="new-password"
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

                {form.password && (
                  <div className="space-y-1 animate-fade-in">
                    <div className="flex gap-1">
                      {Array.from({ length: 4 }).map((_, i) => (
                        <div
                          key={i}
                          className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                            i < passwordStrength
                              ? strengthConfig[passwordStrength - 1].color
                              : 'bg-slate-100 dark:bg-slate-700'
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500">
                      Strength:{' '}
                      <span className="font-semibold text-slate-600 dark:text-slate-400">
                        {strengthConfig[passwordStrength - 1]?.label ?? 'Weak'}
                      </span>
                    </p>
                  </div>
                )}
              </div>

              <Input label="Business name" value={form.businessName} onChange={set('businessName')} required placeholder="My Activity Center" />
              <Select
                label="Billing region"
                value={form.billingRegion}
                onChange={set('billingRegion')}
                options={[
                  { value: 'nigeria',  label: '🇳🇬 Nigeria (NGN)' },
                  { value: 'overseas', label: '🌍 Overseas (USD)' },
                ]}
              />

              <Button type="submit" disabled={loading} className="w-full" size="lg">
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Creating account…
                  </span>
                ) : 'Start 30-day free trial →'}
              </Button>
            </form>
          </div>

          <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
            Already have an account?{' '}
            <Link to="/login" className="text-[#E87600] hover:text-[#C46200] font-semibold transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
