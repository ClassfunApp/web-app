import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, CheckCircle2, School, Dumbbell, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../hooks/use-auth';
import { Input } from '../../components/ui/input';
import { Select } from '../../components/ui/select';
import { Button } from '../../components/ui/button';
import { ClassfunLogo } from '../../components/ui/classfun-logo';
import { cn } from '../../lib/utils';
import type { BillingRegion, BusinessType } from '../../types';

type Step = 'type' | 'details';

const BUSINESS_TYPES: {
  value: BusinessType;
  icon: React.ElementType;
  label: string;
  subtitle: string;
  features: string[];
  iconBg: string;
  iconColor: string;
}[] = [
  {
    value: 'activity_center',
    icon: Dumbbell,
    label: 'Activity Center',
    subtitle: 'Sports, arts, recreation & after-school programs',
    features: ['Activity & class scheduling', 'Enrollment management', 'Pickup codes & QR attendance'],
    iconBg: 'bg-indigo-100 dark:bg-indigo-950',
    iconColor: 'text-indigo-600 dark:text-indigo-400',
  },
  {
    value: 'school',
    icon: School,
    label: 'School',
    subtitle: 'Primary, secondary or tutoring institutions',
    features: ['Classrooms & subjects', 'Student enrollment', 'Academic attendance tracking'],
    iconBg: 'bg-emerald-100 dark:bg-emerald-950',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
  },
];

export default function RegisterPage() {
  const { register, isAuthenticated, isContactVerified } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>('type');
  const [businessType, setBusinessType] = useState<BusinessType>('activity_center');
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
    { color: 'bg-red-400', label: 'Weak' },
    { color: 'bg-orange-400', label: 'Fair' },
    { color: 'bg-yellow-400', label: 'Good' },
    { color: 'bg-emerald-500', label: 'Strong' },
  ];

  const selectedType = BUSINESS_TYPES.find((t) => t.value === businessType)!;
  const businessPlaceholder =
    businessType === 'school' ? 'e.g. Sunrise Academy' : 'e.g. FitKids Activity Center';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.billingRegion) { setError('Please select a billing region'); return; }
    setError('');
    setLoading(true);
    try {
      await register({
        ...form,
        billingRegion: form.billingRegion as BillingRegion,
        businessType,
      });
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Registration failed';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const leftPanelText =
    businessType === 'school'
      ? {
          heading: 'Manage your school the smart way',
          sub: 'Classrooms, subjects, student records and fees — all in one place.',
        }
      : {
          heading: 'Start managing your activity center today',
          sub: 'Join hundreds of centers already using Classfun to simplify their operations.',
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
          <h2 className="text-3xl font-bold text-white leading-snug">{leftPanelText.heading}</h2>
          <p className="mt-4 text-slate-400 text-sm leading-relaxed max-w-xs">{leftPanelText.sub}</p>
        </div>
        <div className="relative z-10 space-y-3.5">
          {['No credit card required', '30-day free trial', 'Cancel anytime', 'Full feature access from day 1'].map(
            (text) => (
              <div key={text} className="flex items-center gap-3 text-slate-300 text-sm">
                <CheckCircle2 size={16} className="text-[#E87600] shrink-0" />
                <span>{text}</span>
              </div>
            ),
          )}
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md animate-slide-up">
          <div className="flex lg:hidden justify-center mb-10">
            <ClassfunLogo variant="full" size="lg" animated />
          </div>

          {/* ── STEP 1: Business type ── */}
          {step === 'type' && (
            <>
              <div className="mb-8">
                <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                  What type of business are you?
                </h1>
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                  We'll tailor your experience to match your needs.
                </p>
              </div>

              <div className="space-y-4">
                {BUSINESS_TYPES.map((type) => {
                  const Icon = type.icon;
                  const selected = businessType === type.value;
                  return (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setBusinessType(type.value)}
                      className={cn(
                        'w-full text-left rounded-2xl border-2 p-5 transition-all duration-150',
                        'bg-white dark:bg-slate-900 shadow-sm hover:shadow-md',
                        selected
                          ? 'border-indigo-500 dark:border-indigo-400 ring-2 ring-indigo-200 dark:ring-indigo-900'
                          : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600',
                      )}
                    >
                      <div className="flex items-start gap-4">
                        <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center shrink-0', type.iconBg)}>
                          <Icon size={22} className={type.iconColor} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-bold text-slate-800 dark:text-slate-100">{type.label}</p>
                            {selected && <CheckCircle2 size={18} className="text-indigo-500 dark:text-indigo-400 shrink-0" />}
                          </div>
                          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{type.subtitle}</p>
                          <ul className="mt-3 space-y-1.5">
                            {type.features.map((f) => (
                              <li key={f} className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                                <span className="w-1 h-1 rounded-full bg-slate-400 dark:bg-slate-600 shrink-0" />
                                {f}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              <Button type="button" className="w-full mt-6" size="lg" onClick={() => setStep('details')}>
                Continue as {selectedType.label} →
              </Button>

              <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
                Already have an account?{' '}
                <Link to="/login" className="text-[#E87600] hover:text-[#C46200] font-semibold transition-colors">
                  Sign in
                </Link>
              </p>
            </>
          )}

          {/* ── STEP 2: Account details ── */}
          {step === 'details' && (
            <>
              <div className="mb-6">
                <button
                  type="button"
                  onClick={() => setStep('type')}
                  className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors mb-4"
                >
                  <ArrowLeft size={15} /> Back
                </button>

                {/* Selected type pill */}
                {(() => {
                  const Icon = selectedType.icon;
                  return (
                    <div className="inline-flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full px-3 py-1.5 mb-4 shadow-sm">
                      <Icon size={14} className={selectedType.iconColor} />
                      <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">{selectedType.label}</span>
                    </div>
                  );
                })()}

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
                                i < passwordStrength ? strengthConfig[passwordStrength - 1].color : 'bg-slate-100 dark:bg-slate-700'
                              }`}
                            />
                          ))}
                        </div>
                        <p className="text-[11px] text-slate-400 dark:text-slate-500">
                          Strength: <span className="font-semibold text-slate-600 dark:text-slate-400">{strengthConfig[passwordStrength - 1]?.label ?? 'Weak'}</span>
                        </p>
                      </div>
                    )}
                  </div>

                  <Input
                    label={businessType === 'school' ? 'School name' : 'Business name'}
                    value={form.businessName}
                    onChange={set('businessName')}
                    required
                    placeholder={businessPlaceholder}
                  />
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
                    ) : (
                      'Start 30-day free trial →'
                    )}
                  </Button>
                </form>
              </div>

              <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
                Already have an account?{' '}
                <Link to="/login" className="text-[#E87600] hover:text-[#C46200] font-semibold transition-colors">
                  Sign in
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
