"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export function SignupPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [name, setName] = useState("");
    const [companyName, setCompanyName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [passwordConfirm, setPasswordConfirm] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    // After signup, go to ?from=… or fallback to "/"
    const from = searchParams.get("from") || "/dashboard";

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError("");
        setLoading(true);

        if (!email || !password) {
            setError("Email and password are required");
            setLoading(false);
            return;
        }

        if (!companyName) {
            setError("Company name are required");
            setLoading(false);
            return;
        }

        if (password !== passwordConfirm) {
            setError("Passwords do not match");
            setLoading(false);
            return;
        }

        try {
            const res = await fetch("/api/auth/signup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password, name, companyName }),
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                setError(data.error || "Signup failed");
                setLoading(false);
                return;
            }

            // Cookie is set by API; just redirect
            router.push(from);
        } catch (err: any) {
            setError(err.message || "Signup failed");
            setLoading(false);
        }
    }

    return (
        <main className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-700">
            <form
                onSubmit={handleSubmit}
                className="w-full max-w-sm bg-white border border-slate-200 rounded-lg p-6 space-y-4"
            >
                <h1 className="text-xl font-semibold text-slate-900">Create your account</h1>

                {error && (
                    <div className="p-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded">
                        {error}
                    </div>
                )}

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                        Name (optional)
                    </label>
                    <input
                        type="text"
                        className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        autoComplete="name"
                    />
                </div>

                {/* Company Name – NEW */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                        Company / Business Name
                    </label>
                    <input
                        type="text"
                        className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        autoComplete="companyName"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                        Email
                    </label>
                    <input
                        type="email"
                        className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                        className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete="new-password"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                        Confirm Password
                    </label>
                    <input
                        type="password"
                        className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={passwordConfirm}
                        onChange={(e) => setPasswordConfirm(e.target.value)}
                        autoComplete="new-password"
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 text-sm font-semibold text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50"
                >
                    {loading ? "Creating account..." : "Sign up"}
                </button>

                <p className="text-xs text-slate-600 text-center">
                    Already have an account?{" "}
                    <a
                        href={`/auth/login?from=${encodeURIComponent(from)}`}
                        className="text-blue-600 hover:text-blue-700 font-medium"
                    >
                        Sign in
                    </a>
                </p>
            </form>
        </main>
    );
}
