import { useState, useEffect } from 'react';
import { Plus, ChevronDown, ChevronUp } from 'lucide-react';
import { Modal } from '../../components/ui/modal';
import { Input } from '../../components/ui/input';
import { Select } from '../../components/ui/select';
import { Textarea } from '../../components/ui/textarea';
import { Button } from '../../components/ui/button';
import { useCreateChild, useUpdateChild } from '../../hooks/queries/use-children';
import { useFamilies, useCreateFamily } from '../../hooks/queries/use-families';
import type { Child, GuardianRelationship } from '../../types';

interface Props {
  open: boolean;
  onClose: () => void;
  child?: Child | null;
}

interface NewGuardian {
  fullName: string;
  phone: string;
  email: string;
  relationship: GuardianRelationship;
}

export function ChildForm({ open, onClose, child }: Props) {
  const [form, setForm] = useState({
    fullName: '',
    dob: '',
    gender: '',
    familyId: '',
    medicalNotes: '',
    allergies: '',
  });

  // Inline family creation state
  const [createFamily, setCreateFamily] = useState(false);
  const [newFamilyName, setNewFamilyName] = useState('');
  const [showGuardian, setShowGuardian] = useState(false);
  const [newGuardian, setNewGuardian] = useState<NewGuardian>({
    fullName: '',
    phone: '',
    email: '',
    relationship: 'guardian',
  });

  const { data: families } = useFamilies();
  const create = useCreateChild();
  const update = useUpdateChild();
  const createFamilyMutation = useCreateFamily();

  useEffect(() => {
    if (child) {
      setForm({
        fullName: child.fullName,
        dob: child.dob || '',
        gender: child.gender || '',
        familyId: child.familyId || '',
        medicalNotes: child.medicalNotes || '',
        allergies: child.allergies || '',
      });
    } else {
      setForm({ fullName: '', dob: '', gender: '', familyId: '', medicalNotes: '', allergies: '' });
    }
    // Reset inline family state when modal opens
    setCreateFamily(false);
    setNewFamilyName('');
    setShowGuardian(false);
    setNewGuardian({ fullName: '', phone: '', email: '', relationship: 'guardian' });
  }, [child, open]);

  const set =
    (field: string) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }));

  const setGuardian =
    (field: keyof NewGuardian) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setNewGuardian((g) => ({ ...g, [field]: e.target.value }));

  function toggleCreateFamily() {
    setCreateFamily((v) => !v);
    setNewFamilyName('');
    setShowGuardian(false);
    setNewGuardian({ fullName: '', phone: '', email: '', relationship: 'guardian' });
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let familyId = form.familyId || undefined;

    if (createFamily && !child) {
      // Create the new family first
      const guardians =
        showGuardian && newGuardian.fullName && newGuardian.phone
          ? [
              {
                fullName: newGuardian.fullName,
                phone: newGuardian.phone,
                email: newGuardian.email || undefined,
                relationship: newGuardian.relationship,
              } as const,
            ]
          : [];

      const newFamily = await createFamilyMutation.mutateAsync({
        familyName: newFamilyName,
        guardians,
      });
      familyId = newFamily.id;
    }

    const data = {
      ...form,
      familyId,
      dob: form.dob || undefined,
      gender: form.gender || undefined,
      medicalNotes: form.medicalNotes || undefined,
      allergies: form.allergies || undefined,
    };

    if (child) await update.mutateAsync({ id: child.id, ...data });
    else await create.mutateAsync(data);
    onClose();
  };

  const isPending = create.isPending || update.isPending || createFamilyMutation.isPending;

  return (
    <Modal open={open} onClose={onClose} title={child ? 'Edit Child' : 'Add Child'} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input label="Full Name" value={form.fullName} onChange={set('fullName')} required />
          <Input label="Date of Birth" type="date" value={form.dob} onChange={set('dob')} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Gender"
            value={form.gender}
            onChange={set('gender')}
            options={[
              { value: 'male', label: 'Male' },
              { value: 'female', label: 'Female' },
            ]}
          />

          {/* Family selector — hidden when creating a new family */}
          {!createFamily && (
            <Select
              label="Family"
              value={form.familyId}
              onChange={set('familyId')}
              options={families?.map((f) => ({ value: f.id, label: f.familyName })) || []}
            />
          )}
        </div>

        {/* Inline family creation (new children only) */}
        {!child && (
          <div>
            <button
              type="button"
              onClick={toggleCreateFamily}
              className="flex items-center gap-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
            >
              <Plus size={13} />
              {createFamily ? 'Use existing family instead' : 'Create new family instead'}
            </button>

            {createFamily && (
              <div className="mt-3 rounded-xl border border-slate-200 dark:border-slate-700 p-4 space-y-3 bg-slate-50/60 dark:bg-slate-800/40">
                <Input
                  label="Family Name"
                  value={newFamilyName}
                  onChange={(e) => setNewFamilyName(e.target.value)}
                  placeholder="e.g. Smith Family"
                  required
                />

                {/* Guardian sub-section */}
                <button
                  type="button"
                  onClick={() => setShowGuardian((v) => !v)}
                  className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                >
                  {showGuardian ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                  {showGuardian ? 'Remove guardian' : '+ Add a guardian (optional)'}
                </button>

                {showGuardian && (
                  <div className="space-y-3 pt-1">
                    <div className="grid grid-cols-2 gap-3">
                      <Input
                        label="Guardian Name"
                        value={newGuardian.fullName}
                        onChange={setGuardian('fullName')}
                        placeholder="Full name"
                        required={showGuardian}
                      />
                      <Input
                        label="Phone"
                        value={newGuardian.phone}
                        onChange={setGuardian('phone')}
                        placeholder="+234..."
                        required={showGuardian}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <Input
                        label="Email (optional)"
                        type="email"
                        value={newGuardian.email}
                        onChange={setGuardian('email')}
                        placeholder="email@example.com"
                      />
                      <Select
                        label="Relationship"
                        value={newGuardian.relationship}
                        onChange={setGuardian('relationship')}
                        options={[
                          { value: 'mother', label: 'Mother' },
                          { value: 'father', label: 'Father' },
                          { value: 'guardian', label: 'Guardian' },
                          { value: 'other', label: 'Other' },
                        ]}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <Textarea label="Medical Notes" value={form.medicalNotes} onChange={set('medicalNotes')} />
        <Textarea label="Allergies" value={form.allergies} onChange={set('allergies')} />

        <div className="flex justify-end gap-3 pt-4">
          <Button variant="secondary" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? 'Saving…' : child ? 'Save' : 'Add Child'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
