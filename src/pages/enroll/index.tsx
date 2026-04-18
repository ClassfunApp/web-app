import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Plus, Trash2, ChevronDown, ChevronUp, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import {
  useEnrollmentPage,
  useSubmitEnrollment,
  type EnrollmentChild,
} from '../../hooks/queries/use-public-enrollment';
import { cn } from '../../lib/utils';

type Relationship = 'mother' | 'father' | 'guardian' | 'other';

interface ChildRow extends EnrollmentChild {
  _id: string;
}

const RELATIONSHIP_OPTIONS: { value: Relationship; label: string }[] = [
  { value: 'mother', label: 'Mother' },
  { value: 'father', label: 'Father' },
  { value: 'guardian', label: 'Legal Guardian' },
  { value: 'other', label: 'Other' },
];

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-sm font-medium text-slate-700 mb-1.5">
      {children}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  );
}

function TextInput({
  label,
  required,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string; required?: boolean }) {
  return (
    <div>
      <FieldLabel required={required}>{label}</FieldLabel>
      <input
        required={required}
        {...props}
        className={cn(
          'w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800',
          'focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400',
          'placeholder:text-slate-400 transition-colors',
          props.className,
        )}
      />
    </div>
  );
}

function SelectInput({
  label,
  required,
  options,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  required?: boolean;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <FieldLabel required={required}>{label}</FieldLabel>
      <select
        required={required}
        {...props}
        className={cn(
          'w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800',
          'focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400',
          'transition-colors appearance-none',
        )}
      >
        <option value="">Select…</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export default function EnrollPage() {
  const { tenantId } = useParams<{ tenantId: string }>();
  const { data: tenant, isLoading: tenantLoading, isError: tenantError, error: tenantErrorObj } = useEnrollmentPage(tenantId!);
  const submitMutation = useSubmitEnrollment(tenantId!);

  const [familyName, setFamilyName] = useState('');
  const [guardian, setGuardian] = useState({
    fullName: '',
    phone: '',
    email: '',
    relationship: '' as Relationship | '',
  });
  const [children, setChildren] = useState<ChildRow[]>([
    { _id: crypto.randomUUID(), fullName: '', dob: '', gender: '', medicalNotes: '' },
  ]);
  const [expandedChildren, setExpandedChildren] = useState<Set<string>>(new Set());
  const [submitted, setSubmitted] = useState(false);
  const [formError, setFormError] = useState('');

  const setGuardianField = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setGuardian((g) => ({ ...g, [field]: e.target.value }));

  function addChild() {
    const newId = crypto.randomUUID();
    setChildren((prev) => [...prev, { _id: newId, fullName: '', dob: '', gender: '', medicalNotes: '' }]);
  }

  function removeChild(id: string) {
    setChildren((prev) => prev.filter((c) => c._id !== id));
  }

  function updateChild(id: string, field: keyof EnrollmentChild, value: string) {
    setChildren((prev) => prev.map((c) => (c._id === id ? { ...c, [field]: value } : c)));
  }

  function toggleChildExpand(id: string) {
    setExpandedChildren((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!guardian.relationship) {
      setFormError('Please select your relationship to the children.');
      return;
    }
    if (children.some((c) => !c.fullName.trim())) {
      setFormError("Please enter a name for each child.");
      return;
    }

    try {
      await submitMutation.mutateAsync({
        familyName,
        guardian: {
          fullName: guardian.fullName,
          phone: guardian.phone,
          email: guardian.email || undefined,
          relationship: guardian.relationship as Relationship,
        },
        children: children.map(({ _id, ...c }) => ({
          ...c,
          dob: c.dob || undefined,
          gender: c.gender || undefined,
          medicalNotes: c.medicalNotes || undefined,
        })),
      });
      setSubmitted(true);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Something went wrong. Please try again.';
      setFormError(msg);
    }
  };

  if (tenantLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-indigo-500" />
      </div>
    );
  }

  if (tenantError || !tenant) {
    // Extract error message from axios error response if available
    const errorMsg = (tenantErrorObj as { response?: { data?: { message?: string } } })?.response?.data?.message
      || (tenantErrorObj as Error)?.message
      || '';
    const isNetworkError = errorMsg.includes('Network Error') || !errorMsg;

    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={24} className="text-red-500" />
          </div>
          <h1 className="text-lg font-bold text-slate-800 mb-1">Enrollment page not found</h1>
          <p className="text-sm text-slate-500 mb-4">
            This enrollment link is invalid or has expired.
          </p>
          {errorMsg && (
            <div className="text-xs text-red-600 bg-red-50 rounded-lg p-3 font-mono break-words">
              {isNetworkError ? 'Network error: Cannot connect to server' : errorMsg}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          {tenant.logoUrl && (
            <img src={tenant.logoUrl} alt={tenant.name} className="h-12 mx-auto mb-6 object-contain" />
          )}
          <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={28} className="text-emerald-500" />
          </div>
          <h1 className="text-xl font-bold text-slate-800 mb-2">You're enrolled!</h1>
          <p className="text-sm text-slate-500 leading-relaxed">
            Thanks for registering with <span className="font-semibold text-slate-700">{tenant.name}</span>.
            They'll be in touch with next steps.
          </p>
        </div>
      </div>
    );
  }

  const isSchool = tenant.businessType === 'school';

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          {tenant.logoUrl ? (
            <img
              src={tenant.logoUrl}
              alt={tenant.name}
              className="h-14 mx-auto mb-4 object-contain"
            />
          ) : (
            <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center mx-auto mb-4">
              <span className="text-white text-xl font-bold">{tenant.name.charAt(0)}</span>
            </div>
          )}
          <h1 className="text-2xl font-bold text-slate-800">{tenant.name}</h1>
          <p className="text-sm text-slate-500 mt-1">
            {isSchool
              ? 'Complete this form to enrol your child at our school'
              : 'Fill in your details to register your child'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Guardian / Parent info */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
            <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Your Details</h2>

            <TextInput
              label="Family name"
              required
              placeholder="e.g. The Johnson Family"
              value={familyName}
              onChange={(e) => setFamilyName(e.target.value)}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <TextInput
                label="Your full name"
                required
                placeholder="Jane Smith"
                value={guardian.fullName}
                onChange={setGuardianField('fullName')}
              />
              <SelectInput
                label="Relationship"
                required
                options={RELATIONSHIP_OPTIONS}
                value={guardian.relationship}
                onChange={setGuardianField('relationship')}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <TextInput
                label="Phone number"
                required
                type="tel"
                placeholder="+234 801 234 5678"
                value={guardian.phone}
                onChange={setGuardianField('phone')}
              />
              <TextInput
                label="Email address"
                type="email"
                placeholder="jane@example.com"
                value={guardian.email}
                onChange={setGuardianField('email')}
              />
            </div>
          </div>

          {/* Children */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">
                {isSchool ? 'Students' : 'Children'}
              </h2>
              <button
                type="button"
                onClick={addChild}
                className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
              >
                <Plus size={14} />
                Add {isSchool ? 'student' : 'child'}
              </button>
            </div>

            <div className="space-y-3">
              {children.map((child, idx) => {
                const expanded = expandedChildren.has(child._id);
                return (
                  <div
                    key={child._id}
                    className="border border-slate-100 rounded-xl overflow-hidden"
                  >
                    {/* Child header row */}
                    <div className="flex items-center gap-3 px-4 py-3 bg-slate-50">
                      <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 text-xs font-bold flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <input
                        type="text"
                        required
                        placeholder={isSchool ? `Student ${idx + 1} full name` : `Child ${idx + 1} full name`}
                        value={child.fullName}
                        onChange={(e) => updateChild(child._id, 'fullName', e.target.value)}
                        className="flex-1 bg-transparent text-sm font-medium text-slate-700 placeholder:text-slate-400 focus:outline-none"
                      />
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => toggleChildExpand(child._id)}
                          className="p-1 rounded-lg hover:bg-slate-200 transition-colors text-slate-400"
                          title="More details"
                        >
                          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </button>
                        {children.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeChild(child._id)}
                            className="p-1 rounded-lg hover:bg-red-50 transition-colors text-slate-400 hover:text-red-500"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Expandable details */}
                    {expanded && (
                      <div className="px-4 py-4 grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-100">
                        <TextInput
                          label="Date of birth"
                          type="date"
                          value={child.dob || ''}
                          onChange={(e) => updateChild(child._id, 'dob', e.target.value)}
                        />
                        <SelectInput
                          label="Gender"
                          options={[
                            { value: 'male', label: 'Male' },
                            { value: 'female', label: 'Female' },
                            { value: 'other', label: 'Other / Prefer not to say' },
                          ]}
                          value={child.gender || ''}
                          onChange={(e) => updateChild(child._id, 'gender', e.target.value)}
                        />
                        <div className="sm:col-span-2">
                          <FieldLabel>Medical notes / allergies</FieldLabel>
                          <textarea
                            placeholder="Any allergies, conditions, or notes the team should know about…"
                            value={child.medicalNotes || ''}
                            onChange={(e) => updateChild(child._id, 'medicalNotes', e.target.value)}
                            rows={3}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 placeholder:text-slate-400 resize-none"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Error */}
          {(formError || submitMutation.isError) && (
            <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <span>{formError || 'Something went wrong. Please try again.'}</span>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={submitMutation.isPending}
            className={cn(
              'w-full py-3.5 rounded-xl text-sm font-bold text-white transition-all',
              'bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99]',
              'disabled:opacity-60 disabled:cursor-not-allowed',
              'flex items-center justify-center gap-2',
            )}
          >
            {submitMutation.isPending ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Submitting…
              </>
            ) : (
              `Complete Registration →`
            )}
          </button>

          <p className="text-center text-xs text-slate-400">
            Powered by{' '}
            <span className="font-semibold text-slate-500">Classfun</span>
          </p>
        </form>
      </div>
    </div>
  );
}
