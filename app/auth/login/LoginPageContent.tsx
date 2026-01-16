// app/auth/login/LoginPageContent.tsx
"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export function LoginPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const from = searchParams.get("from") || "/dashboard";

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                setError(data.error || "Login failed");
                setLoading(false);
                return;
            }

            router.push(from);
        } catch (err: any) {
            setError(err.message || "Login failed");
            setLoading(false);
        }
    }

    return (
        <main className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-700">
            <form
                onSubmit={handleSubmit}
                className="w-full max-w-sm bg-white border border-slate-200 rounded-lg p-6 space-y-4"
            >
                <h1 className="text-xl font-semibold text-slate-900">Sign in</h1>
                {error && (
                    <div className="p-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded">
                        {error}
                    </div>
                )}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                        Email
                    </label>
                    <input
                        type="email"
                        className="w-full border border-slate-300 rounded px-3 py-2 text-sm"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        autoComplete="email"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                        Password
                    </label>
                    <input
                        type="password"
                        className="w-full border border-slate-300 rounded px-3 py-2 text-sm"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete="current-password"
                    />
                </div>
                <button
                    disabled={loading}
                    className="w-full py-2.5 text-sm font-semibold text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50"
                >
                    {loading ? "Signing in..." : "Sign in"}
                </button>

                <p className="text-xs text-slate-600 text-center">
                    Don't have an account?{" "}
                    <a
                        href={`/auth/signup`}
                        className="text-blue-600 hover:text-blue-700 font-medium"
                    >
                        Sign up
                    </a>
                </p>
            </form>
        </main>
    );
}
