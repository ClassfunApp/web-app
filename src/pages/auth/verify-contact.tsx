import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Phone, CheckCircle, ArrowRight, RefreshCw } from 'lucide-react';
import { useAuth } from '../../hooks/use-auth';
import { useSendContactVerification, useVerifyContact } from '../../hooks/queries/use-contact-verification';
import { Button } from '../../components/ui/button';

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

  // Redirect if already verified
  useEffect(() => {
    if (isContactVerified) {
      navigate('/verification', { replace: true });
    }
  }, [isContactVerified, navigate]);

  // Countdown timer for resend
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
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) {
      inputRefs.current[idx - 1]?.focus();
    }
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

  if (successType) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="text-green-600" size={32} />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {successType === 'email' ? 'Email' : 'Phone'} Verified!
          </h2>
          <p className="text-gray-500 mb-6">
            Your {successType} has been verified. You can now continue setting up your account.
          </p>
          <Button className="w-full" onClick={() => navigate('/verification')}>
            Continue to KYC Verification <ArrowRight size={16} className="ml-2" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl font-bold text-indigo-600">CF</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Verify Your Contact</h1>
          <p className="text-gray-500 mt-2 text-sm">
            Verify your email or phone number to secure your account and continue.
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
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                <Mail size={24} />
                <span className="text-sm font-medium">Email</span>
                <span className="text-xs text-gray-400 truncate max-w-full px-1">{user?.email}</span>
              </button>
            )}
            {hasPhone && (
              <button
                type="button"
                onClick={() => setSelectedType('phone')}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                  selectedType === 'phone'
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                <Phone size={24} />
                <span className="text-sm font-medium">Phone</span>
                <span className="text-xs text-gray-400">{user?.phone}</span>
              </button>
            )}
          </div>
        )}

        {/* Sent state: show where code was sent */}
        {codeSent && (
          <div className="flex items-center gap-3 bg-indigo-50 rounded-xl p-4 mb-6">
            {selectedType === 'email' ? (
              <Mail size={20} className="text-indigo-600 shrink-0" />
            ) : (
              <Phone size={20} className="text-indigo-600 shrink-0" />
            )}
            <div>
              <p className="text-sm font-medium text-indigo-900">Code sent to your {selectedType}</p>
              <p className="text-xs text-indigo-700">
                {selectedType === 'email' ? user?.email : user?.phone}
              </p>
            </div>
          </div>
        )}

        {/* OTP input */}
        {codeSent && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3 text-center">
              Enter the 6-digit code
            </label>
            <div className="flex gap-2 justify-center">
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
                  className="w-11 h-14 text-center text-xl font-bold border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:outline-none transition-colors"
                />
              ))}
            </div>
            {verifyOtp.isError && (
              <p className="text-center text-sm text-red-500 mt-3">
                Invalid or expired code. Please try again.
              </p>
            )}
          </div>
        )}

        {/* Actions */}
        {!codeSent ? (
          <Button
            className="w-full"
            onClick={handleSend}
            disabled={sendOtp.isPending || (!hasEmail && !hasPhone)}
          >
            {sendOtp.isPending ? 'Sending...' : `Send Code to ${selectedType === 'email' ? 'Email' : 'Phone'}`}
          </Button>
        ) : (
          <div className="space-y-3">
            <Button
              className="w-full"
              onClick={handleVerify}
              disabled={otp.join('').length !== 6 || verifyOtp.isPending}
            >
              {verifyOtp.isPending ? 'Verifying...' : 'Verify Code'}
            </Button>
            <button
              type="button"
              onClick={countdown > 0 ? undefined : handleSend}
              disabled={countdown > 0 || sendOtp.isPending}
              className="flex items-center justify-center gap-2 w-full text-sm text-gray-500 hover:text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors py-2"
            >
              <RefreshCw size={14} />
              {countdown > 0 ? `Resend in ${countdown}s` : 'Resend code'}
            </button>
            <button
              type="button"
              onClick={() => { setCodeSent(false); setOtp(['', '', '', '', '', '']); }}
              className="w-full text-sm text-gray-400 hover:text-gray-600 transition-colors py-1"
            >
              Change {selectedType === 'email' ? 'to phone' : 'to email'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
