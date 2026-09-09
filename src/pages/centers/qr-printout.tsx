import { useEffect, useState } from 'react';
import { Download } from 'lucide-react';

/** Render the preview and download from the same A4-proportioned image. */
export function QrPrintout({ url, name }: { url: string; name: string }) {
  const [poster, setPoster] = useState('');
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => {
      if (cancelled) return;
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 1654;
        canvas.height = 2339;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Canvas unavailable');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.textAlign = 'center';
        const text = (value: string, y: number, size: number, color = '#18181b', weight = '400') => {
          ctx.fillStyle = color;
          ctx.font = `${weight} ${size}px Arial, sans-serif`;
          ctx.fillText(value, 827, y, 1414);
        };
        text('Classfun', 225, 150, '#F26A1F', '800');
        text('Connecting families, schools and activity centers', 310, 42, '#52525b');
        ctx.fillStyle = '#F26A1F';
        ctx.fillRect(737, 385, 180, 8);
        // Fit long names without clipping or changing the QR's position.
        let size = 80;
        ctx.font = `700 ${size}px Arial, sans-serif`;
        while (ctx.measureText(name).width > 1414 && size > 36) {
          size -= 2;
          ctx.font = `700 ${size}px Arial, sans-serif`;
        }
        text(name, 525, size, '#18181b', '700');
        text('Scan for attendance', 690, 100, '#18181b', '800');
        // Preserve sharp QR edges and the original image's quiet zone.
        ctx.imageSmoothingEnabled = false;
        const side = 960;
        const ratio = Math.min(side / image.naturalWidth, side / image.naturalHeight);
        const w = image.naturalWidth * ratio;
        const h = image.naturalHeight * ratio;
        ctx.drawImage(image, (1654 - w) / 2, 790 + (side - h) / 2, w, h);
        text('Open Classfun and scan this code', 1860, 52, '#52525b');
        text('to record attendance.', 1935, 52, '#52525b');
        text('Discover Classfun', 2140, 64, '#18181b', '700');
        text('Search for Classfun in your app store.', 2225, 44, '#52525b');
        setPoster(canvas.toDataURL('image/png'));
      } catch {
        setError(true);
      }
    };
    image.onerror = () => { if (!cancelled) setError(true); };
    image.src = url;
    return () => { cancelled = true; };
  }, [url, name]);

  const filename = `${name.replace(/[^a-z0-9_-]+/gi, '-').replace(/^-|-$/g, '').slice(0, 80) || 'center'}-classfun-qr.png`;

  return (
    <div className="max-h-[70vh] overflow-y-auto text-center space-y-4">
      {error ? (
        <p role="alert" className="text-sm text-red-600">Could not prepare the printout. Close this window and try again.</p>
      ) : poster ? (
        <>
          <img src={poster} alt={`Classfun attendance QR printout for ${name}`} className="mx-auto w-full max-w-xs border border-slate-200" />
          <a href={poster} download={filename} className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">
            <Download size={16} /> Download PNG
          </a>
          <p className="text-sm text-slate-500 dark:text-slate-400">Print on A4 paper and display at your center entrance for parents to scan.</p>
        </>
      ) : <p role="status" className="text-sm text-slate-500">Preparing QR printout…</p>}
    </div>
  );
}
