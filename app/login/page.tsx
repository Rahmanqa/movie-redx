'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Logo from '@/components/layout/Logo';
import { Mail, Lock, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    const supabase = createClient();
    if (!supabase) {
      // Offline / demo login fallback
      if (email === 'admin@redxcinema.com') {
        localStorage.setItem('redx_user', JSON.stringify({ email, role: 'admin' }));
        setSuccessMsg('Signed in as Administrator (Local Demo Mode). Redirecting...');
        setTimeout(() => router.push('/admin'), 1000);
      } else {
        localStorage.setItem('redx_user', JSON.stringify({ email, role: 'user' }));
        setSuccessMsg('Signed in successfully! Redirecting...');
        setTimeout(() => router.push('/'), 1000);
      }
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setErrorMsg(error.message);
      } else {
        setSuccessMsg('Signed in successfully! Redirecting...');
        setTimeout(() => router.push('/'), 1000);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full bg-brand-card/90 border border-brand-border/80 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-md space-y-6">
        <div className="text-center space-y-2">
          <Logo size="lg" />
          <h2 className="text-xl font-bold text-white pt-2">Welcome Back</h2>
          <p className="text-xs text-zinc-400">
            Sign in to sync your watchlist, resume streams, and personalize language settings
          </p>
        </div>

        {errorMsg && (
          <div className="bg-red-950/60 border border-red-500/50 rounded-xl p-3 flex items-start gap-2 text-xs text-red-200">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="bg-emerald-950/60 border border-emerald-500/50 rounded-xl p-3 text-xs text-emerald-200 text-center font-medium">
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">
              Email Address
            </label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-brand-primary"
              />
              <Mail className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">
              Password
            </label>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-brand-primary"
              />
              <Lock className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-red-600 to-brand-primary hover:from-red-500 hover:to-red-600 text-white font-bold text-xs py-3 rounded-xl shadow-glow-sm transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            {loading ? (
              <span>Signing in...</span>
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="text-center pt-2 border-t border-zinc-800 text-xs text-zinc-400">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="text-brand-primary hover:text-red-400 font-semibold">
            Create Account
          </Link>
        </div>

        {/* Demo Hint */}
        <div className="bg-zinc-900/60 p-3 rounded-xl border border-zinc-800 text-[11px] text-zinc-400 text-center space-y-1">
          <p className="font-semibold text-zinc-300">Quick Testing Tip:</p>
          <p>Login with <span className="font-mono text-red-400">admin@redxcinema.com</span> to test Admin access.</p>
        </div>
      </div>
    </div>
  );
}
