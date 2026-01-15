// app/auth/login/page.tsx
import { Suspense } from 'react';
import { LoginPageContent } from './LoginPageContent';

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <section className="min-h-screen flex items-center justify-center">
          <div className="text-slate-400 text-sm">Loading…</div>
        </section>
      }
    >
      <LoginPageContent />
    </Suspense>
  );
}
