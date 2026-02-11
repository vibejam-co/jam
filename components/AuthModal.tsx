import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { X, Mail, Lock, Chrome, Loader2 } from 'lucide-react';
import { isSupabaseConfigured, supabase } from '../lib/supabase-client';

type AuthMode = 'signIn' | 'signUp';

interface AuthModalProps {
  onClose: () => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ onClose }) => {
  const [mode, setMode] = useState<AuthMode>('signIn');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const modeLabel = useMemo(() => (mode === 'signIn' ? 'Sign In' : 'Create Account'), [mode]);

  const handleGoogleAuth = async () => {
    if (!supabase) {
      setError('Auth is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setMessage(null);

    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}`,
      },
    });

    if (authError) {
      setError(authError.message);
      setIsSubmitting(false);
    }
  };

  const handleEmailAuth = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!supabase) {
      setError('Auth is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
      return;
    }

    if (!email.trim() || !password.trim()) {
      setError('Email and password are required.');
      return;
    }

    if (mode === 'signUp' && password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setMessage(null);

    try {
      if (mode === 'signIn') {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (signInError) {
          throw signInError;
        }

        setMessage('Signed in successfully.');
        onClose();
      } else {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: `${window.location.origin}`,
          },
        });

        if (signUpError) {
          throw signUpError;
        }

        if (data.session) {
          setMessage('Account created and signed in.');
          onClose();
          return;
        }

        setMessage('Check your inbox to confirm your email, then sign in.');
      }
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : 'Authentication failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[140] bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
    >
      <div className="absolute inset-0" onClick={onClose} />

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.98 }}
        transition={{ type: 'spring', damping: 22, stiffness: 260 }}
        className="relative w-full max-w-md rounded-3xl border border-white/10 bg-[#070707] p-8 shadow-[0_30px_90px_rgba(0,0,0,0.8)]"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/5 transition-colors"
          aria-label="Close auth modal"
        >
          <X className="w-5 h-5 text-zinc-500" />
        </button>

        <div className="mb-7">
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-zinc-500 mb-2">VibeJam Access</p>
          <h3 className="text-3xl font-black tracking-tight text-white">{modeLabel}</h3>
          <p className="text-sm text-zinc-500 mt-2">Use Google or your email to access your creator workspace.</p>
        </div>

        {!isSupabaseConfigured && (
          <div className="mb-5 rounded-xl border border-yellow-500/30 bg-yellow-500/10 px-4 py-3 text-xs text-yellow-200">
            Missing `VITE_SUPABASE_URL` and/or `VITE_SUPABASE_ANON_KEY`.
          </div>
        )}

        <button
          type="button"
          onClick={handleGoogleAuth}
          disabled={isSubmitting}
          className="w-full h-12 rounded-xl border border-white/15 bg-white/5 text-white font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-white/10 transition-all disabled:opacity-50"
        >
          {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Chrome className="w-4 h-4" />}
          Continue with Google
        </button>

        <div className="flex items-center gap-3 my-5">
          <div className="h-px flex-1 bg-white/10" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-600">Or</span>
          <div className="h-px flex-1 bg-white/10" />
        </div>

        <form onSubmit={handleEmailAuth} className="space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-zinc-500">Email</span>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
                className="w-full h-11 rounded-xl bg-white/5 border border-white/10 pl-10 pr-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-white/30"
                placeholder="you@vibejam.co"
              />
            </div>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-zinc-500">Password</span>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={mode === 'signIn' ? 'current-password' : 'new-password'}
                required
                className="w-full h-11 rounded-xl bg-white/5 border border-white/10 pl-10 pr-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-white/30"
                placeholder={mode === 'signIn' ? 'Enter password' : 'At least 6 characters'}
              />
            </div>
          </label>

          {error && <p className="text-xs text-red-400">{error}</p>}
          {message && <p className="text-xs text-emerald-400">{message}</p>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-12 rounded-xl bg-white text-black font-black text-xs uppercase tracking-[0.18em] hover:bg-zinc-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Please wait...' : mode === 'signIn' ? 'Sign In with Email' : 'Create Account'}
          </button>
        </form>

        <div className="mt-5 text-center">
          {mode === 'signIn' ? (
            <button
              type="button"
              onClick={() => {
                setMode('signUp');
                setError(null);
                setMessage(null);
              }}
              className="text-xs text-zinc-400 hover:text-white transition-colors"
            >
              New to VibeJam? <span className="font-bold">Create account</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setMode('signIn');
                setError(null);
                setMessage(null);
              }}
              className="text-xs text-zinc-400 hover:text-white transition-colors"
            >
              Already have an account? <span className="font-bold">Sign in</span>
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default AuthModal;
