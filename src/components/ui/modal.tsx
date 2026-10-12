import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import type { ReactNode } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
};

export function Modal({ open, onClose, title, children, size = 'md' }: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  // Keyboard close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (open) window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  // Portal to <body>: pages animate in with a retained transform, which would make
  // the page (not the viewport) the containing block for this fixed overlay.
  return createPortal(
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-[2px] p-4 animate-fade-in"
      onClick={(e) => e.target === overlayRef.current && onClose()}
    >
      <div className={`w-full ${sizeClasses[size]} max-h-full flex flex-col bg-white dark:bg-slate-900 rounded-2xl shadow-[0_20px_60px_-10px_rgba(0,0,0,0.18)] dark:shadow-[0_20px_60px_-10px_rgba(0,0,0,0.5)] animate-scale-in`}>
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">{title}</h3>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors active:scale-95"
          >
            <X size={16} />
          </button>
        </div>
        {/* Body scrolls when the content is taller than the viewport */}
        <div className="px-6 py-5 overflow-y-auto">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
