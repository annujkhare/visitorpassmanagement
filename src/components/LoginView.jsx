import React, { useState } from "react";
import { LogIn, ShieldCheck, UserRound, LockKeyhole } from "lucide-react";
import { Link } from "react-router-dom";

export function LoginView({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event) => {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      const result = await onLogin(email.trim(), password);

      if (!result?.success) {
        setError(
          result?.error ||
            "Login failed. Please check your email and password.",
        );
      }
    } catch (err) {
      setError("Unable to connect to the server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        {/* App logo and header */}
        <div className="text-center mb-7">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>

          <h1 className="mt-4 text-2xl font-bold text-white">PassPoint</h1>

          <p className="mt-1 text-sm text-slate-400">
            Visitor Pass Management System
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl p-6 sm:p-8">
          <h2 className="text-lg font-bold text-slate-900">Sign in</h2>

          <p className="text-xs text-slate-500 mt-1 mb-6">
            Use your organization account to continue.
          </p>

          <form onSubmit={submit} className="space-y-4">
            <label className="block">
              <span className="text-xs font-semibold text-slate-700">
                Email
              </span>

              <div className="relative mt-1.5">
                <UserRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />

                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  autoComplete="email"
                  required
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />
              </div>
            </label>

            <label className="block">
              <span className="text-xs font-semibold text-slate-700">
                Password
              </span>

              <div className="relative mt-1.5">
                <LockKeyhole className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />

                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />
              </div>
            </label>

            {error && (
              <div className="text-xs text-rose-600 bg-rose-50 border border-rose-100 rounded-xl p-3">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-60 text-white text-sm font-semibold transition"
            >
              <LogIn className="w-4 h-4" />

              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>
          <p className="text-center text-xs text-slate-500 mt-5">
            New visitor?{" "}
            <Link to="/register" className="font-semibold text-emerald-600">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
