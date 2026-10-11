import { useState } from 'react';
import { Search, CheckCircle, XCircle, MapPin } from 'lucide-react';
import { useValidatePickupCode } from '../../hooks/queries/use-pickup-codes';
import { actionLabel, pickupErrorOf, validatedChildren } from '../../lib/pickup-code';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card } from '../../components/ui/card';

export default function PickupCodesPage() {
  const [code, setCode] = useState('');
  const validate = useValidatePickupCode();

  const submit = (centerId?: string) => {
    if (code.trim().length > 0) {
      validate.mutate({ code: code.trim(), centerId });
    }
  };

  const handleValidate = (e: React.FormEvent) => {
    e.preventDefault();
    submit();
  };

  const error = validate.isError ? pickupErrorOf(validate.error) : null;
  const result = validate.isSuccess ? validate.data : null;
  const action = actionLabel(result?.action);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Pickup Code Validation</h1>

      <Card>
        <div className="p-6">
          <form onSubmit={handleValidate} className="flex items-end gap-4 max-w-md">
            <div className="flex-1">
              <Input
                label="Enter Pickup Code"
                placeholder="1234567"
                value={code}
                onChange={(e) => { setCode(e.target.value); validate.reset(); }}
                maxLength={7}
              />
            </div>
            <Button type="submit" disabled={validate.isPending || code.trim().length === 0}>
              <Search size={16} className="mr-2" /> Validate
            </Button>
          </form>
        </div>
      </Card>

      {result && (
        <Card>
          <div className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <CheckCircle className="text-green-500" size={24} />
              <h2 className="text-lg font-semibold text-green-700">
                {action ? `${action} recorded` : 'Valid Pickup Code'}
                {result.center ? ` · ${result.center.name}` : ''}
              </h2>
            </div>
            <div className="space-y-3">
              {validatedChildren(result).map((child) => (
                <div key={child.id} className="flex items-center gap-4">
                  {child.photoUrl && (
                    <img src={child.photoUrl} alt="" className="w-16 h-16 rounded-full object-cover" />
                  )}
                  <div>
                    <p className={`text-lg font-medium ${child.success ? 'text-slate-900 dark:text-slate-100' : 'text-slate-400 dark:text-slate-500'}`}>
                      {child.fullName}
                    </p>
                    {child.success ? (
                      result.usedAt && (
                        <p className="text-sm text-slate-500 dark:text-slate-400">Used at: {new Date(result.usedAt).toLocaleString()}</p>
                      )
                    ) : (
                      <p className="text-sm text-red-600 dark:text-red-400">{child.message ?? 'Not recorded'}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {error?.centers && (
        <Card>
          <div className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <MapPin className="text-indigo-500" size={24} />
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Which centre are you at?</h2>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">{error.message}</p>
            <div className="flex flex-wrap gap-3">
              {error.centers.map((center) => (
                <Button
                  key={center.id}
                  variant="secondary"
                  disabled={validate.isPending}
                  onClick={() => submit(center.id)}
                >
                  {center.name}
                </Button>
              ))}
            </div>
          </div>
        </Card>
      )}

      {error && !error.centers && (
        <Card>
          <div className="p-6">
            <div className="flex items-center gap-3">
              <XCircle className="text-red-500" size={24} />
              <div>
                <h2 className="text-lg font-semibold text-red-700">Could not validate code</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">{error.message}</p>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
