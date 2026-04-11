import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../hooks/use-auth';
import { Input } from '../../components/ui/input';
import { Select } from '../../components/ui/select';
import { Button } from '../../components/ui/button';
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
    let score = 0;
    if (p.length >= 8) score++;
    if (/[A-Z]/.test(p)) score++;
    if (/[0-9]/.test(p)) score++;
    if (/[^A-Za-z0-9]/.test(p)) score++;
    return score;
  })();

  const strengthColors = ['bg-red-400', 'bg-orange-400', 'bg-yellow-400', 'bg-emerald-400'];
  const strengthLabels = ['Weak', 'Fair', 'Good', 'Strong'];

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
    <div className="min-h-screen flex bg-[#f0f3f9]">
      {/* Left decorative panel */}
      <div className="hidden lg:flex lg:w-[42%] bg-indigo-600 p-12 flex-col justify-between relative overflow-hidden">
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
            Start managing your activity center today
          </h2>
          <p className="mt-4 text-indigo-200 text-sm leading-relaxed">
            Join hundreds of centers already using Classfun to simplify their operations.
          </p>
        </div>

        <div className="relative z-10 space-y-3">
          {[
            'No credit card required',
            '30-day free trial',
            'Cancel anytime',
            'Full feature access from day 1',
          ].map((f) => (
            <div key={f} className="flex items-center gap-2 text-indigo-100 text-sm">
              <CheckCircle2 size={15} className="text-indigo-300 shrink-0" />
              <span>{f}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md animate-slide-up">
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-2 mb-8">
            <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-sm">CF</span>
            </div>
            <span className="text-slate-800 font-bold text-lg">Classfun</span>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-slate-800">Create your account</h1>
            <p className="text-slate-500 text-sm mt-1">Get started in under 2 minutes</p>
          </div>

          <div className="bg-white rounded-2xl shadow-[0_4px_24px_-4px_rgba(0,0,0,0.08)] border border-slate-100 p-8">
            {error && (
              <div className="mb-5 flex items-start gap-2.5 p-3.5 rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm animate-slide-down">
                <span className="mt-0.5 shrink-0">⚠️</span>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input label="Full name" value={form.fullName} onChange={set('fullName')} required placeholder="John Doe" autoComplete="name" />
              <Input label="Email address" type="email" value={form.email} onChange={set('email')} required placeholder="you@example.com" autoComplete="email" />

              {/* Password with strength meter */}
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
                    className="absolute right-3 bottom-[10px] text-slate-400 hover:text-slate-600 transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                {/* Strength bar */}
                {form.password && (
                  <div className="space-y-1 animate-fade-in">
                    <div className="flex gap-1">
                      {Array.from({ length: 4 }).map((_, i) => (
                        <div
                          key={i}
                          className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                            i < passwordStrength ? strengthColors[passwordStrength - 1] : 'bg-slate-100'
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Password strength:{' '}
                      <span className="font-semibold text-slate-600">{strengthLabels[passwordStrength - 1] ?? 'Weak'}</span>
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
                  { value: 'nigeria', label: '🇳🇬 Nigeria (NGN)' },
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

          <p className="mt-6 text-center text-sm text-slate-500">
            Already have an account?{' '}
            <Link to="/login" className="text-indigo-600 hover:text-indigo-700 font-semibold transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
