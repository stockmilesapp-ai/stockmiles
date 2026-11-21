import { Link } from 'react-router';

export function NotFoundPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background p-6 text-foreground">
      <h1 className="text-2xl font-bold">Page not found</h1>
      <Link to="/" className="rounded-full bg-primary px-4 py-2 text-primary-foreground">
        Go to home
      </Link>
    </main>
  );
}
