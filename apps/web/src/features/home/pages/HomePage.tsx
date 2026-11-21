import { healthResponse } from '@stockmiles/shared';
import { useEffect, useState } from 'react';

type ApiStatus = 'checking' | 'ok' | 'error';

export function HomePage() {
  const [apiStatus, setApiStatus] = useState<ApiStatus>('checking');

  useEffect(() => {
    fetch('/api/health')
      .then((response) => response.json())
      .then((body) => {
        healthResponse.parse(body);
        setApiStatus('ok');
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
      <p className={apiStatus === 'error' ? 'text-danger' : 'text-success'}>API: {apiStatus}</p>
    </main>
  );
}
