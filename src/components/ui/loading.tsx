import { Loader2 } from 'lucide-react';

export function Loading({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      <p className="mt-2 text-sm text-gray-500">{message}</p>
    </div>
  );
}

export function PageLoading() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
    </div>
  );
}
