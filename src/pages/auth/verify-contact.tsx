import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Phone, CheckCircle, ArrowRight, RefreshCw } from 'lucide-react';
import { useAuth } from '../../hooks/use-auth';
import { useSendContactVerification, useVerifyContact } from '../../hooks/queries/use-contact-verification';
import { Button } from '../../components/ui/button';
import { ClassfunLogo } from '../../components/ui/classfun-logo';

type VerifyType = 'email' | 'phone';

export default function VerifyContactPage() {
  const { user, isContactVerified, refreshUser } = useAuth();
  const navigate = useNavigate();

  const [selectedType, setSelectedType] = useState<VerifyType>('email');
  const [codeSent, setCodeSent] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [countdown, setCountdown] = useState(0);
  const [successType, setSuccessType] = useState<VerifyType | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const sendOtp = useSendContactVerification();
  const verifyOtp = useVerifyContact();

  useEffect(() => {
    if (isContactVerified) navigate('/verification', { replace: true });
  }, [isContactVerified, navigate]);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const handleSend = async () => {
    await sendOtp.mutateAsync({ type: selectedType });
    setCodeSent(true);
    setOtp(['', '', '', '', '', '']);
    setCountdown(60);
    setTimeout(() => inputRefs.current[0]?.focus(), 100);
  };

  const handleOtpChange = (idx: number, val: string) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...otp];
    next[idx] = val;
    setOtp(next);
    if (val && idx < 5) inputRefs.current[idx + 1]?.focus();
  };

  const handleOtpKeyDown = (idx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) inputRefs.current[idx - 1]?.focus();
  };

  const handleVerify = async () => {
    const token = otp.join('');
    if (token.length !== 6) return;
    await verifyOtp.mutateAsync({ type: selectedType, token });
    setSuccessType(selectedType);
    await refreshUser();
  };

  const hasEmail = !!user?.email;
  const hasPhone = !!user?.phone;

  /* ── Success screen ── */
  if (successType) {
    return (
      <div className="min-h-screen bg-[#f0f3f9] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-[0_4px_24px_-4px_rgba(0,0,0,0.08)] border border-slate-100 p-10 max-w-md w-full text-center animate-scale-in">
          <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckCircle className="text-emerald-500" size={32} />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">
            {successType === 'email' ? 'Email' : 'Phone'} verified! 🎉
          </h2>
          <p className="text-slate-500 text-sm mb-8">
            Your {successType} has been verified. Let's complete your account setup.
          </p>
          <Button className="w-full" size="lg" onClick={() => navigate('/verification')}>
            Continue to KYC <ArrowRight size={16} />
          </Button>
        </div>
      </div>
    );
  }

  /* ── Main screen ── */
  return (
    <div className="min-h-screen bg-[#f0f3f9] flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-slide-up">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <ClassfunLogo variant="full" size="lg" animated />
        </div>

        <div className="bg-white rounded-2xl shadow-[0_4px_24px_-4px_rgba(0,0,0,0.08)] border border-slate-100 p-8">
          {/* Header */}
          <div className="text-center mb-7">
            <h1 className="text-xl font-bold text-slate-800">Verify your contact</h1>
            <p className="text-slate-500 text-sm mt-1.5">
              Confirm your email or phone to secure your account.
            </p>
          </div>

          {/* Type selector */}
          {!codeSent && (
            <div className="grid grid-cols-2 gap-3 mb-6">
              {hasEmail && (
                <button
                  type="button"
                  onClick={() => setSelectedType('email')}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                    selectedType === 'email'
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                      : 'border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <Mail size={22} />
                  <span className="text-sm font-semibold">Email</span>
                  <span className="text-[11px] text-slate-400 truncate max-w-full px-1">{user?.email}</span>
                </button>
              )}
              {hasPhone && (
                <button
                  type="button"
                  onClick={() => setSelectedType('phone')}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                    selectedType === 'phone'
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                      : 'border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <Phone size={22} />
                  <span className="text-sm font-semibold">Phone</span>
                  <span className="text-[11px] text-slate-400">{user?.phone}</span>
                </button>
              )}
            </div>
          )}

          {/* Sent confirmation banner */}
          {codeSent && (
            <div className="flex items-center gap-3 bg-indigo-50 rounded-xl p-3.5 mb-6 animate-slide-down">
              {selectedType === 'email'
                ? <Mail size={18} className="text-indigo-600 shrink-0" />
                : <Phone size={18} className="text-indigo-600 shrink-0" />
              }
              <div>
                <p className="text-sm font-semibold text-indigo-800">Code sent!</p>
                <p className="text-xs text-indigo-600">
                  {selectedType === 'email' ? user?.email : user?.phone}
                </p>
              </div>
            </div>
          )}

          {/* OTP boxes */}
          {codeSent && (
            <div className="mb-6">
              <p className="text-[13px] font-medium text-slate-600 mb-3 text-center">Enter the 6-digit code</p>
              <div className="flex gap-2 justify-center stagger-children">
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => { inputRefs.current[idx] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                    className={`w-11 h-14 text-center text-xl font-bold border-2 rounded-xl focus:outline-none transition-all animate-slide-up opacity-0 [animation-fill-mode:forwards] ${
                      digit
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                        : 'border-slate-200 text-slate-800 focus:border-indigo-500 focus:bg-indigo-50/30'
                    }`}
                  />
                ))}
              </div>
              {verifyOtp.isError && (
                <p className="text-center text-xs text-red-500 mt-3 animate-fade-in">
                  Invalid or expired code. Please try again.
                </p>
              )}
            </div>
          )}

          {/* Actions */}
          {!codeSent ? (
            <Button
              className="w-full"
              size="lg"
              onClick={handleSend}
              disabled={sendOtp.isPending || (!hasEmail && !hasPhone)}
            >
              {sendOtp.isPending ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Sending…
                </span>
              ) : `Send code to ${selectedType === 'email' ? 'email' : 'phone'}`}
            </Button>
          ) : (
            <div className="space-y-2.5">
              <Button
                className="w-full"
                size="lg"
                onClick={handleVerify}
                disabled={otp.join('').length !== 6 || verifyOtp.isPending}
              >
                {verifyOtp.isPending ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Verifying…
                  </span>
                ) : 'Verify code'}
              </Button>

              <button
                type="button"
                onClick={countdown > 0 ? undefined : handleSend}
                disabled={countdown > 0 || sendOtp.isPending}
                className="flex items-center justify-center gap-2 w-full text-sm text-slate-400 hover:text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors py-2"
              >
                <RefreshCw size={13} className={sendOtp.isPending ? 'animate-spin' : ''} />
                {countdown > 0 ? `Resend in ${countdown}s` : 'Resend code'}
              </button>

              <button
                type="button"
                onClick={() => { setCodeSent(false); setOtp(['', '', '', '', '', '']); }}
                className="w-full text-xs text-slate-400 hover:text-slate-600 transition-colors py-1"
              >
                ← Change to {selectedType === 'email' ? 'phone' : 'email'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
