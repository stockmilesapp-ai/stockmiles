import { useRegisterSW } from 'virtual:pwa-register/react';
import { useOnlineStatus } from '@/shared/hooks/useOnlineStatus.ts';

// Shows app-wide state at the top of every page: offline, and new version ready.
export function AppStatusBar() {
  const isOnline = useOnlineStatus();
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  return (
    <div className="fixed inset-x-0 top-0 z-50 flex flex-col">
      {!isOnline && (
        <p role="status" className="bg-warning px-4 py-2 text-center text-sm text-foreground">
          You are offline. Changes cannot be saved until the connection is back.
        </p>
      )}
      {needRefresh && (
        <div className="flex items-center justify-center gap-3 bg-primary px-4 py-2 text-sm text-primary-foreground">
          <span>A new version of StockMiles is ready.</span>
          <button
            type="button"
            className="rounded-full bg-primary-foreground px-3 py-1 font-medium text-primary"
            onClick={() => updateServiceWorker(true)}
          >
            Reload
          </button>
        </div>
      )}
    </div>
  );
}
