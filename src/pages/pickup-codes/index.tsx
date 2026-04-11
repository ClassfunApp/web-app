import { useState } from 'react';
import { Search, CheckCircle, XCircle } from 'lucide-react';
import { useValidatePickupCode } from '../../hooks/queries/use-pickup-codes';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card } from '../../components/ui/card';

export default function PickupCodesPage() {
  const [code, setCode] = useState('');
  const validate = useValidatePickupCode();

  const handleValidate = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.trim().length > 0) {
      validate.mutate(code.trim());
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Pickup Code Validation</h1>

      <Card>
        <div className="p-6">
          <form onSubmit={handleValidate} className="flex items-end gap-4 max-w-md">
            <div className="flex-1">
              <Input
                label="Enter Pickup Code"
                placeholder="1234567"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                maxLength={7}
              />
            </div>
            <Button type="submit" disabled={validate.isPending || code.trim().length === 0}>
              <Search size={16} className="mr-2" /> Validate
            </Button>
          </form>
        </div>
      </Card>

      {validate.isSuccess && validate.data && (
        <Card>
          <div className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <CheckCircle className="text-green-500" size={24} />
              <h2 className="text-lg font-semibold text-green-700">Valid Pickup Code</h2>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-4">
                {validate.data.child.photoUrl && (
                  <img src={validate.data.child.photoUrl} alt="" className="w-16 h-16 rounded-full object-cover" />
                )}
                <div>
                  <p className="text-lg font-medium text-gray-900">{validate.data.child.fullName}</p>
                  <p className="text-sm text-gray-500">Child ID: {validate.data.child.id}</p>
                  <p className="text-sm text-gray-500">Used at: {new Date(validate.data.usedAt).toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {validate.isError && (
        <Card>
          <div className="p-6">
            <div className="flex items-center gap-3">
              <XCircle className="text-red-500" size={24} />
              <div>
                <h2 className="text-lg font-semibold text-red-700">Invalid Code</h2>
                <p className="text-sm text-gray-500">The code is invalid, expired, or has already been used.</p>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
