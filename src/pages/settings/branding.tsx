import { useRef, useState } from 'react';
import { Upload, Copy, Check, Share2, ExternalLink, Loader2, ImageIcon } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useTenant, useUploadLogo } from '../../hooks/queries/use-tenants';

export default function BrandingPage() {
  const { data: tenant, isLoading } = useTenant();
  const uploadLogo = useUploadLogo();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [copied, setCopied] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const enrollmentLink = tenant
    ? `${window.location.origin}/enroll/${tenant.id}`
    : '';

  async function handleFile(file: File) {
    const formData = new FormData();
    formData.append('logo', file);
    await uploadLogo.mutateAsync(formData);
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  async function copyLink() {
    await navigator.clipboard.writeText(enrollmentLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function shareWhatsApp() {
    const msg = `Register your child with us using this link:\n${enrollmentLink}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={28} className="animate-spin text-indigo-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6 page-enter max-w-2xl">
      <div>
        <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">Branding & Enrollment</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Customise your enrollment page and share it with parents.
        </p>
      </div>

      {/* Logo Upload */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-6 shadow-sm space-y-5">
        <div>
          <h2 className="text-sm font-bold text-slate-700 dark:text-slate-200">Business Logo</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Shown on your enrollment page. PNG, JPG or WebP, max 10 MB.
          </p>
        </div>

        <div className="flex items-start gap-5">
          {/* Logo preview */}
          <div className="shrink-0 w-20 h-20 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 flex items-center justify-center bg-slate-50 dark:bg-slate-800 overflow-hidden">
            {uploadLogo.isPending ? (
              <Loader2 size={20} className="animate-spin text-indigo-400" />
            ) : tenant?.logoUrl ? (
              <img src={tenant.logoUrl} alt="Logo" className="w-full h-full object-contain p-1" />
            ) : (
              <ImageIcon size={24} className="text-slate-300 dark:text-slate-600" />
            )}
          </div>

          {/* Drop zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              'flex-1 border-2 border-dashed rounded-xl p-5 cursor-pointer transition-all text-center',
              dragOver
                ? 'border-indigo-400 bg-indigo-50 dark:bg-indigo-950/30'
                : 'border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700 hover:bg-slate-50 dark:hover:bg-slate-800/50',
            )}
          >
            <Upload size={18} className="mx-auto mb-1.5 text-slate-400 dark:text-slate-500" />
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
              {dragOver ? 'Drop to upload' : 'Click or drag to upload'}
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">PNG, JPG, WebP</p>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={onFileChange}
          />
        </div>

        {uploadLogo.isError && (
          <p className="text-xs text-red-500">Upload failed. Please try again.</p>
        )}
      </div>

      {/* Enrollment Link */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-6 shadow-sm space-y-5">
        <div>
          <h2 className="text-sm font-bold text-slate-700 dark:text-slate-200">Enrollment Link</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Share this link with parents so they can register their children directly.
          </p>
        </div>

        {/* Link display */}
        <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          <span className="flex-1 text-sm text-slate-600 dark:text-slate-300 truncate font-mono">
            {enrollmentLink}
          </span>
          <a
            href={enrollmentLink}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-slate-400"
            title="Open enrollment page"
          >
            <ExternalLink size={14} />
          </a>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2.5">
          <button
            type="button"
            onClick={copyLink}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all',
              copied
                ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white',
            )}
          >
            {copied ? <Check size={15} /> : <Copy size={15} />}
            {copied ? 'Copied!' : 'Copy link'}
          </button>

          <button
            type="button"
            onClick={shareWhatsApp}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold bg-[#25D366] hover:bg-[#1da851] text-white transition-colors"
          >
            <Share2 size={15} />
            Share on WhatsApp
          </button>
        </div>
      </div>

      {/* Preview hint */}
      <div className="rounded-xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 px-4 py-3 flex items-center gap-3">
        <ExternalLink size={15} className="text-indigo-500 shrink-0" />
        <p className="text-sm text-indigo-700 dark:text-indigo-400">
          Parents see your logo, business name, and a branded registration form when they open the link.
        </p>
      </div>
    </div>
  );
}
