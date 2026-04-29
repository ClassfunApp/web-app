import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import api from '../../lib/api';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { ClassfunLogo } from '../../components/ui/classfun-logo';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  const isSetup = searchParams.get('setup') === '1';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('Invalid or missing reset token.');
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    setError('');
    setLoading(true);

    try {
      await api.post('/auth/reset-password', {
        token,
        newPassword: password,
      });
      setSuccess(true);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to reset password';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f0f3f9] dark:bg-slate-950 px-6">
        <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 p-10 text-center animate-slide-up">
          <div className="w-20 h-20 bg-green-100 dark:bg-green-950/30 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={40} />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">
            {isSetup ? 'Account setup complete!' : 'Password reset successful'}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mb-8">
            Your password has been updated. You can now sign in to your dashboard.
          </p>
          <Button onClick={() => navigate('/login')} className="w-full" size="lg">
            Sign in now
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-[#f0f3f9] dark:bg-slate-950">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-[44%] bg-[#1B2B4A] p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute -top-20 -left-20 w-80 h-80 bg-indigo-600 rounded-full opacity-20 blur-3xl" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#E87600] rounded-full opacity-10 blur-3xl" />
        
        <div className="relative z-10">
          <ClassfunLogo variant="wordmark" size="2xl" animated className="mb-12" />
          <h2 className="text-3xl font-bold text-white leading-snug">
            {isSetup ? 'Set up your secure account' : 'Secure your account'}
          </h2>
          <p className="mt-4 text-slate-400 text-sm leading-relaxed max-w-xs">
            Choose a strong password to keep your activity center data safe and secure.
          </p>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md animate-slide-up">
          <div className="flex lg:hidden justify-center mb-10">
            <ClassfunLogo variant="full" size="lg" animated />
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
              {isSetup ? 'Create your password' : 'New password'}
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
              Enter a new password for your account
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-[0_4px_24px_-4px_rgba(0,0,0,0.08)] border border-slate-100 dark:border-slate-800 p-8">
            {error && (
              <div className="mb-6 p-3.5 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/50 text-red-700 dark:text-red-400 text-sm">
                {error}
              </div>
            )}

            {!token ? (
              <div className="text-center py-4">
                <p className="text-slate-500 mb-6">This link is invalid or has expired.</p>
                <Link to="/forgot-password">
                  <Button variant="outline" className="w-full">Request a new link</Button>
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="relative">
                  <Input
                    label="New Password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="Min 8 characters"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 bottom-[10px] text-slate-400"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                <Input
                  label="Confirm Password"
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="Repeat your password"
                />

                <Button type="submit" disabled={loading} className="w-full" size="lg">
                  {loading ? 'Updating...' : isSetup ? 'Complete Setup' : 'Reset Password'}
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
