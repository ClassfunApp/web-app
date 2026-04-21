import { useState } from 'react';
import { Plus, Trash2, Users, CheckSquare, Square } from 'lucide-react';
import { Modal } from '../../components/ui/modal';
import { Input } from '../../components/ui/input';
import { Select } from '../../components/ui/select';
import { Button } from '../../components/ui/button';
import { useCreateBulkFee } from '../../hooks/queries/use-payments';
import { useChildren } from '../../hooks/queries/use-children';
import { formatCurrency } from '../../lib/utils';

interface LineItemRow {
  id: string;
  description: string;
  quantity: string;
  unitPrice: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
}

export function BulkFeeForm({ open, onClose }: Props) {
  const [form, setForm] = useState({
    description: '',
    amount: '',
    currency: 'NGN',
    dueDate: '',
  });
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [lineItems, setLineItems] = useState<LineItemRow[]>([]);

  const { data: children } = useChildren();
  const createBulk = useCreateBulkFee();

  const set =
    (f: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((s) => ({ ...s, [f]: e.target.value }));

  const showManualAmount = lineItems.length === 0;
  const lineItemsTotal = lineItems.reduce(
    (sum, item) => sum + (parseFloat(item.quantity) || 0) * (parseFloat(item.unitPrice) || 0),
    0,
  );

  const allSelected = !!children?.length && selectedIds.size === children.length;

  function toggleAll() {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(children?.map((c) => c.id) ?? []));
    }
  }

  function toggleChild(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function addLineItem() {
    setLineItems((prev) => [
      ...prev,
      { id: crypto.randomUUID(), description: '', quantity: '1', unitPrice: '' },
    ]);
  }

  function removeLineItem(id: string) {
    setLineItems((prev) => prev.filter((item) => item.id !== id));
  }

  function updateLineItem(id: string, field: keyof Omit<LineItemRow, 'id'>, value: string) {
    setLineItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item)),
    );
  }

  function resetForm() {
    setForm({ description: '', amount: '', currency: 'NGN', dueDate: '' });
    setSelectedIds(new Set());
    setLineItems([]);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      childIds: Array.from(selectedIds),
      description: form.description || undefined,
      currency: form.currency,
      dueDate: form.dueDate,
      ...(showManualAmount
        ? { amount: parseFloat(form.amount) }
        : {
            lineItems: lineItems.map((item) => ({
              description: item.description,
              quantity: parseFloat(item.quantity),
              unitPrice: parseFloat(item.unitPrice),
            })),
          }),
    };
    await createBulk.mutateAsync(payload);
    resetForm();
    onClose();
  };

  const activeChildren = children?.filter((c) => c.status === 'active') ?? [];

  return (
    <Modal open={open} onClose={onClose} title="Bulk Invoice" size="lg">
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Child selector */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Select Children
              {selectedIds.size > 0 && (
                <span className="ml-2 text-xs font-normal text-indigo-600 dark:text-indigo-400">
                  {selectedIds.size} selected
                </span>
              )}
            </p>
            <button
              type="button"
              onClick={toggleAll}
              className="flex items-center gap-1 text-xs text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              {allSelected ? <CheckSquare size={14} /> : <Square size={14} />}
              {allSelected ? 'Deselect all' : 'Select all'}
            </button>
          </div>

          {activeChildren.length === 0 ? (
            <p className="text-sm text-slate-400 py-3 text-center">No active children found</p>
          ) : (
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 divide-y divide-slate-100 dark:divide-slate-800 max-h-52 overflow-y-auto">
              {activeChildren.map((child) => {
                const checked = selectedIds.has(child.id);
                return (
                  <label
                    key={child.id}
                    className="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleChild(child.id)}
                      className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center flex-shrink-0">
                        <Users size={12} className="text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <span className="text-sm text-slate-800 dark:text-slate-200 truncate">
                        {child.fullName}
                      </span>
                    </div>
                  </label>
                );
              })}
            </div>
          )}
        </div>

        <Input
          label="Description"
          value={form.description}
          onChange={set('description')}
          placeholder="e.g. Monthly subscription fee"
        />

        <div className="grid grid-cols-2 gap-4">
          {showManualAmount && (
            <Input
              label="Amount"
              type="number"
              step="0.01"
              value={form.amount}
              onChange={set('amount')}
              required
            />
          )}
          <Select
            label="Currency"
            value={form.currency}
            onChange={set('currency')}
            options={[
              { value: 'NGN', label: 'NGN (₦)' },
              { value: 'USD', label: 'USD ($)' },
              { value: 'EUR', label: 'EUR (€)' },
            ]}
          />
        </div>

        <Input
          label="Due Date"
          type="date"
          value={form.dueDate}
          onChange={set('dueDate')}
          required
        />

        {/* Line Items */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Line Items <span className="text-slate-400 font-normal">(optional)</span>
            </p>
            <Button type="button" variant="ghost" size="sm" onClick={addLineItem}>
              <Plus size={14} className="mr-1" /> Add Item
            </Button>
          </div>

          {lineItems.length > 0 && (
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
              <div className="grid grid-cols-[1fr_72px_96px_80px_36px] gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-800/60 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                <span>Description</span>
                <span className="text-right">Qty</span>
                <span className="text-right">Unit Price</span>
                <span className="text-right">Total</span>
                <span />
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {lineItems.map((item) => {
                  const lineTotal =
                    (parseFloat(item.quantity) || 0) * (parseFloat(item.unitPrice) || 0);
                  return (
                    <div
                      key={item.id}
                      className="grid grid-cols-[1fr_72px_96px_80px_36px] gap-2 items-center px-3 py-2 bg-white dark:bg-slate-900"
                    >
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => updateLineItem(item.id, 'description', e.target.value)}
                        placeholder="Item description"
                        required
                        className="w-full text-sm bg-transparent border-b border-slate-200 dark:border-slate-700 focus:border-indigo-500 dark:focus:border-indigo-400 outline-none py-1 text-slate-800 dark:text-slate-200 placeholder:text-slate-400"
                      />
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateLineItem(item.id, 'quantity', e.target.value)}
                        min="0.01"
                        step="0.01"
                        required
                        className="w-full text-sm text-right bg-transparent border-b border-slate-200 dark:border-slate-700 focus:border-indigo-500 dark:focus:border-indigo-400 outline-none py-1 text-slate-800 dark:text-slate-200"
                      />
                      <input
                        type="number"
                        value={item.unitPrice}
                        onChange={(e) => updateLineItem(item.id, 'unitPrice', e.target.value)}
                        min="0.01"
                        step="0.01"
                        placeholder="0.00"
                        required
                        className="w-full text-sm text-right bg-transparent border-b border-slate-200 dark:border-slate-700 focus:border-indigo-500 dark:focus:border-indigo-400 outline-none py-1 text-slate-800 dark:text-slate-200 placeholder:text-slate-400"
                      />
                      <span className="text-sm text-right font-medium text-slate-700 dark:text-slate-300">
                        {lineTotal > 0 ? formatCurrency(lineTotal, form.currency) : '—'}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeLineItem(item.id)}
                        className="flex items-center justify-center w-7 h-7 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between items-center px-3 py-2.5 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-700">
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Total per child</span>
                <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  {formatCurrency(lineItemsTotal, form.currency)}
                </span>
              </div>
            </div>
          )}
        </div>

        {selectedIds.size > 0 && (
          <p className="text-xs text-slate-500 dark:text-slate-400">
            This will create <span className="font-semibold text-slate-700 dark:text-slate-300">{selectedIds.size}</span> invoice{selectedIds.size > 1 ? 's' : ''}, one per selected child.
          </p>
        )}

        <div className="flex justify-end gap-3 pt-1">
          <Button variant="secondary" type="button" onClick={() => { resetForm(); onClose(); }}>
            Cancel
          </Button>
          <Button type="submit" disabled={createBulk.isPending || selectedIds.size === 0}>
            {createBulk.isPending
              ? 'Creating…'
              : `Create ${selectedIds.size > 0 ? selectedIds.size : ''} Invoice${selectedIds.size !== 1 ? 's' : ''}`}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
