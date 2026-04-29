import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../lib/api';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { ClassfunLogo } from '../../components/ui/classfun-logo';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setSuccess(true);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Something went wrong';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#f0f3f9] dark:bg-slate-950">
      {/* Left panel (Decorative) */}
      <div className="hidden lg:flex lg:w-[44%] bg-[#1B2B4A] p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute -top-20 -left-20 w-80 h-80 bg-indigo-600 rounded-full opacity-20 blur-3xl" />
        <div className="absolute top-1/3 right-0 w-64 h-64 bg-[#E87600] rounded-full opacity-10 blur-3xl" />
        
        <div className="relative z-10">
          <ClassfunLogo variant="wordmark" size="2xl" animated className="mb-12" />
          <h2 className="text-3xl font-bold text-white leading-snug">
            Lost your access?
          </h2>
          <p className="mt-4 text-slate-400 text-sm leading-relaxed max-w-xs">
            Don't worry, it happens. Just enter your email and we'll send you a link to reset your password.
          </p>
        </div>
      </div>

      {/* Right panel (Form) */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md animate-slide-up">
          <div className="flex lg:hidden justify-center mb-10">
            <ClassfunLogo variant="full" size="lg" animated />
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Reset your password</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">We'll email you a recovery link</p>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-[0_4px_24px_-4px_rgba(0,0,0,0.08)] border border-slate-100 dark:border-slate-800 p-8">
            {success ? (
              <div className="text-center py-4">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-950/30 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl">
                  📧
                </div>
                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-2">Check your email</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm mb-8">
                  If an account exists for <span className="font-medium text-slate-700 dark:text-slate-200">{email}</span>, you will receive a password reset link shortly.
                </p>
                <Link to="/login">
                  <Button variant="outline" className="w-full">Return to login</Button>
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/50 text-red-700 dark:text-red-400 text-sm">
                    {error}
                  </div>
                )}

                <Input
                  label="Email address"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@example.com"
                  autoComplete="email"
                />

                <Button type="submit" disabled={loading} className="w-full" size="lg">
                  {loading ? 'Sending link...' : 'Send reset link'}
                </Button>

                <div className="text-center mt-6">
                  <Link
                    to="/login"
                    className="text-sm text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
                  >
                    ← Back to login
                  </Link>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
