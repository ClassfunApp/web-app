import { useState, useRef } from 'react';
import { Upload, CheckCircle } from 'lucide-react';
import { useSubmitTenantVerification } from '../../hooks/queries/use-verification';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import type { TenantVerification } from '../../types';

function FileInput({
  label,
  name,
  currentUrl,
  onChange,
}: {
  label: string;
  name: string;
  currentUrl?: string | null;
  onChange: (file: File | null) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    onChange(file);
    if (file && file.type.startsWith('image/')) {
      setPreview(URL.createObjectURL(file));
    } else {
      setPreview(null);
    }
  };

  const displayUrl = preview || currentUrl;
  const hasFile = !!displayUrl;

  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <div
        className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-indigo-400 transition-colors"
        onClick={() => ref.current?.click()}
      >
        {hasFile ? (
          <div className="space-y-2">
            {(displayUrl?.match(/\.(jpg|jpeg|png|webp)$/i) || preview) ? (
              <img src={displayUrl!} alt={label} className="mx-auto h-24 w-auto rounded object-cover" />
            ) : (
              <div className="flex items-center justify-center gap-2 text-green-600">
                <CheckCircle size={20} />
                <span className="text-sm">File uploaded</span>
              </div>
            )}
            <p className="text-xs text-indigo-600">Click to replace</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1 text-gray-500">
            <Upload size={24} />
            <p className="text-sm">Click to upload</p>
            <p className="text-xs text-gray-400">JPG, PNG, WebP or PDF · Max 10MB</p>
          </div>
        )}
      </div>
      <input
        ref={ref}
        type="file"
        name={name}
        accept="image/jpeg,image/png,image/webp,application/pdf"
        className="hidden"
        onChange={handleChange}
      />
    </div>
  );
}

interface Props {
  existing: TenantVerification | null;
  onSuccess?: () => void;
}

export function TenantKycForm({ existing, onSuccess }: Props) {
  const submit = useSubmitTenantVerification();
  const [files, setFiles] = useState<Record<string, File | null>>({
    registrationCertificate: null,
    proofOfAddress: null,
  });
  const [form, setForm] = useState({
    businessRegNumber: existing?.businessRegNumber || '',
    addressLine1: existing?.addressLine1 || '',
    addressLine2: existing?.addressLine2 || '',
    city: existing?.city || '',
    state: existing?.state || '',
    country: existing?.country || '',
    postalCode: existing?.postalCode || '',
  });

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => { if (v) fd.append(k, v); });
    Object.entries(files).forEach(([k, f]) => { if (f) fd.append(k, f); });
    await submit.mutateAsync(fd);
    onSuccess?.();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Business Identity */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">Business Identity</h3>
        <div>
          <Input
            label="Business Registration Number"
            placeholder="e.g. RC123456"
            value={form.businessRegNumber}
            onChange={set('businessRegNumber')}
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
          <FileInput
            label="Registration Certificate"
            name="registrationCertificate"
            currentUrl={existing?.registrationCertificateUrl}
            onChange={(f) => setFiles((prev) => ({ ...prev, registrationCertificate: f }))}
          />
          <FileInput
            label="Proof of Business Address"
            name="proofOfAddress"
            currentUrl={existing?.proofOfAddressUrl}
            onChange={(f) => setFiles((prev) => ({ ...prev, proofOfAddress: f }))}
          />
        </div>
      </div>

      {/* Business Address */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">Business Address</h3>
        <div className="grid grid-cols-1 gap-4">
          <Input label="Address Line 1" value={form.addressLine1} onChange={set('addressLine1')} />
          <Input label="Address Line 2" value={form.addressLine2} onChange={set('addressLine2')} />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Input label="City" value={form.city} onChange={set('city')} />
            <Input label="State" value={form.state} onChange={set('state')} />
            <Input label="Country" value={form.country} onChange={set('country')} />
            <Input label="Postal Code" value={form.postalCode} onChange={set('postalCode')} />
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={submit.isPending}>
          {submit.isPending ? 'Submitting…' : existing ? 'Update & Resubmit' : 'Submit for Review'}
        </Button>
      </div>

      {submit.isError && (
        <p className="text-sm text-red-600">
          {(submit.error as Error)?.message || 'Submission failed. Please try again.'}
        </p>
      )}
    </form>
  );
}
