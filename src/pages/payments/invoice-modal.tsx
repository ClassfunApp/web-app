import { useState, useEffect } from 'react';
import { Copy, Check, MessageCircle, Link as LinkIcon } from 'lucide-react';
import { Modal } from '../../components/ui/modal';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { usePayment, useGeneratePaymentLink, useShareViaWhatsApp } from '../../hooks/queries/use-payments';
import { formatCurrency, formatDate } from '../../lib/utils';
import type { FeePayment } from '../../types';

interface Props {
  payment: FeePayment | null;
  open: boolean;
  onClose: () => void;
}

function invoiceNumber(id: string): string {
  return `INV-${id.replace(/-/g, '').substring(0, 6).toUpperCase()}`;
}

export function InvoiceModal({ payment: paymentProp, open, onClose }: Props) {
  const [copied, setCopied] = useState(false);
  const [whatsAppSent, setWhatsAppSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: freshPayment } = usePayment(paymentProp?.id ?? '');
  const payment = freshPayment ?? paymentProp;

  const generateLink = useGeneratePaymentLink();
  const shareWhatsApp = useShareViaWhatsApp();

  // Reset state when modal opens with a new payment
  useEffect(() => {
    if (open) {
      setCopied(false);
      setWhatsAppSent(false);
      setError(null);
    }
  }, [open, paymentProp?.id]);

  if (!payment) return null;

  const hasLineItems = payment.lineItems && payment.lineItems.length > 0;

  async function handleCopyLink() {
    setError(null);
    try {
      let link = payment!.paymentLinkUrl;
      if (!link) {
        const result = await generateLink.mutateAsync({ feePaymentId: payment!.id });
        link = result.paymentLink;
      }
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError('Failed to copy payment link. Please try again.');
    }
  }

  async function handleShareWhatsApp() {
    setError(null);
    try {
      await shareWhatsApp.mutateAsync({ feePaymentId: payment!.id });
      setWhatsAppSent(true);
      setTimeout(() => setWhatsAppSent(false), 3000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to send WhatsApp message.';
      setError(msg);
    }
  }

  const isGeneratingLink = generateLink.isPending;
  const isSendingWhatsApp = shareWhatsApp.isPending;
  const canShareWhatsApp = !!payment.paymentLinkUrl;

  return (
    <Modal open={open} onClose={onClose} title="Invoice" size="lg">
      <div className="space-y-5">

        {/* Invoice header */}
        <div className="flex items-start justify-between">
          <div>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              {invoiceNumber(payment.id)}
            </p>
            <div className="mt-1">
              <Badge status={payment.status} />
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">Due Date</p>
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mt-0.5">
              {formatDate(payment.dueDate)}
            </p>
            {payment.paidAt && (
              <>
                <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide mt-2">Paid On</p>
                <p className="text-sm font-semibold text-green-600 dark:text-green-400 mt-0.5">
                  {formatDate(payment.paidAt)}
                </p>
              </>
            )}
          </div>
        </div>

        {/* Child / Family info */}
        <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 px-4 py-3 space-y-1">
          <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">Billed To</p>
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            {payment.child?.fullName ?? '—'}
          </p>
          {payment.child?.family?.familyName && (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {payment.child.family.familyName}
            </p>
          )}
          {payment.description && (
            <p className="text-xs text-slate-500 dark:text-slate-400 pt-1">{payment.description}</p>
          )}
        </div>

        {/* Line items table */}
        {hasLineItems && (
          <div className="overflow-hidden rounded-xl border border-slate-100 dark:border-slate-800">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60">
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    Description
                  </th>
                  <th className="text-right px-4 py-2.5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide w-16">
                    Qty
                  </th>
                  <th className="text-right px-4 py-2.5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    Unit Price
                  </th>
                  <th className="text-right px-4 py-2.5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {payment.lineItems!.map((item) => {
                  const lineTotal = Number(item.quantity) * Number(item.unitPrice);
                  return (
                    <tr key={item.id} className="bg-white dark:bg-slate-900">
                      <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{item.description}</td>
                      <td className="px-4 py-3 text-right text-slate-600 dark:text-slate-400">
                        {Number(item.quantity)}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-600 dark:text-slate-400">
                        {formatCurrency(Number(item.unitPrice), payment.currency)}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-slate-800 dark:text-slate-200">
                        {formatCurrency(lineTotal, payment.currency)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Amount summary */}
        <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 px-4 py-3">
          {hasLineItems && (
            <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400 mb-2">
              <span>Subtotal</span>
              <span>{formatCurrency(Number(payment.amount), payment.currency)}</span>
            </div>
          )}
          <div className="flex justify-between text-base font-bold text-slate-900 dark:text-slate-100">
            <span>Total</span>
            <span>{formatCurrency(Number(payment.amount), payment.currency)}</span>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <p className="text-sm text-red-500 dark:text-red-400">{error}</p>
        )}

        {/* Action buttons */}
        <div className="flex flex-wrap items-center gap-3 pt-1">
          {payment.status !== 'paid' && (
            <>
              <Button
                variant="secondary"
                onClick={handleCopyLink}
                disabled={isGeneratingLink || copied}
                className="flex items-center gap-2"
              >
                {copied ? (
                  <><Check size={15} /> Copied!</>
                ) : isGeneratingLink ? (
                  <><LinkIcon size={15} /> Generating…</>
                ) : (
                  <><Copy size={15} /> Copy Payment Link</>
                )}
              </Button>

              <button
                onClick={handleShareWhatsApp}
                disabled={!canShareWhatsApp || isSendingWhatsApp || whatsAppSent}
                title={!canShareWhatsApp ? 'Generate a payment link first' : undefined}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors
                  ${canShareWhatsApp
                    ? 'bg-green-600 hover:bg-green-700 text-white active:scale-95'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed'}
                  disabled:opacity-60`}
              >
                {whatsAppSent ? (
                  <><Check size={15} /> Sent!</>
                ) : isSendingWhatsApp ? (
                  <><MessageCircle size={15} /> Sending…</>
                ) : (
                  <><MessageCircle size={15} /> Share on WhatsApp</>
                )}
              </button>
            </>
          )}

          {!canShareWhatsApp && payment.status !== 'paid' && (
            <p className="text-xs text-slate-400 dark:text-slate-500 w-full">
              Generate the payment link first to enable WhatsApp sharing.
            </p>
          )}
        </div>

      </div>
    </Modal>
  );
}
