import { type HealthResponse, healthResponse } from '@stockmiles/shared';
import { useEffect, useState } from 'react';

type ApiStatus = 'checking' | 'ok' | 'error';
type DbStatus = HealthResponse['db'] | 'unknown';

export function HomePage() {
  const [apiStatus, setApiStatus] = useState<ApiStatus>('checking');
  const [dbStatus, setDbStatus] = useState<DbStatus>('unknown');

  useEffect(() => {
    fetch('/api/health')
      // A 503 still has a JSON body that says which part failed, so parse it too.
      .then((response) => response.json())
      .then((body) => {
        const health = healthResponse.parse(body);
        setApiStatus('ok');
        setDbStatus(health.db);
      })
      .catch(() => setApiStatus('error'));
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background p-6 text-foreground">
      <img src="/logo-mark.svg" alt="" className="size-28" />
      <h1 className="text-3xl font-bold">
        <span className="text-primary">Stock</span>
        <span className="text-secondary">Miles</span>
      </h1>
      <p className="text-muted-foreground">Retail POS &amp; Inventory</p>
      <div className="text-center text-sm">
        <p className={apiStatus === 'error' ? 'text-danger' : 'text-success'}>API: {apiStatus}</p>
        <p className={dbStatus === 'ok' ? 'text-success' : 'text-danger'}>Database: {dbStatus}</p>
      </div>
    </main>
  );
}
