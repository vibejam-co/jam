
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, ArrowRight, CheckCircle2, Sparkles, ShieldCheck } from 'lucide-react';
import { subscribeToNewsletter } from '../lib/api';

const NewsletterSection: React.FC = () => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setStatus('loading');
    setErrorMessage('');

    try {
      await subscribeToNewsletter(email);
      setStatus('success');
    } catch (error) {
      setStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Failed to subscribe. Please try again.');
    }
  };

  return (
    <section className="relative mt-32 py-24 px-6 overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-[300px] bg-cyan-500/[0.03] blur-[120px] rounded-full" />
      </div>

      <div className="max-w-4xl mx-auto relative z-10">
        <div className="flex flex-col items-center text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.03] border border-white/10 mb-8"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-[10px] font-black tracking-[0.3em] uppercase text-zinc-400">Exclusive Intelligence</span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-6xl font-extrabold tracking-tighter text-white mb-6 leading-tight"
          >
            Alpha Intelligence. <br />
            <span className="text-zinc-500 italic font-serif-rank">Delivered.</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-zinc-500 text-lg md:text-xl max-w-2xl mb-12 font-medium leading-relaxed"
          >
            Join 15,000+ elite curators tracking the raw velocity of vibe-coded startups. 
            We deconstruct the top 1% of earners so you can spot the next decade-defining asset. 
            <span className="text-zinc-300"> No noise. Pure data.</span>
          </motion.p>

          <AnimatePresence mode="wait">
            {status !== 'success' ? (
              <motion.form
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, y: -20 }}
                onSubmit={handleSubmit}
                className="w-full max-w-md relative group"
              >
                <div className="relative flex items-center p-1 rounded-[24px] bg-white/[0.03] border border-white/10 focus-within:border-white/30 focus-within:bg-white/[0.05] transition-all shadow-2xl">
                  <div className="pl-6 text-zinc-500 group-focus-within:text-white transition-colors">
                    <Mail className="w-5 h-5" />
                  </div>
                  <input
                    type="email"
                    required
                    placeholder="Enter your professional email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={status === 'loading'}
                    className="w-full bg-transparent border-none px-4 py-4 text-white text-sm font-medium focus:outline-none placeholder:text-zinc-600"
                  />
                  <button
                    type="submit"
                    disabled={status === 'loading'}
                    className="shrink-0 h-12 px-6 rounded-2xl bg-white text-black font-black uppercase tracking-tight text-[11px] flex items-center gap-2 hover:bg-zinc-200 active:scale-95 transition-all disabled:opacity-50"
                  >
                    {status === 'loading' ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full"
                      />
                    ) : (
                      <>
                        Send me the Data <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </div>
                
                <div className="mt-6 flex items-center justify-center gap-4 opacity-40">
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="w-3 h-3" />
                    <span className="text-[9px] font-bold uppercase tracking-widest">Privacy Secured</span>
                  </div>
                  <div className="w-1 h-1 rounded-full bg-zinc-800" />
                  <span className="text-[9px] font-bold uppercase tracking-widest">Weekly Alpha</span>
                </div>
                {status === 'error' && (
                  <p className="mt-3 text-center text-[11px] font-semibold text-red-400">
                    {errorMessage}
                  </p>
                )}
              </motion.form>
            ) : (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="flex flex-col items-center gap-4"
              >
                <div className="w-20 h-20 rounded-3xl bg-green-500/10 border border-green-500/20 flex items-center justify-center shadow-[0_0_40px_rgba(34,197,94,0.1)]">
                  <CheckCircle2 className="w-10 h-10 text-green-500" />
                </div>
                <div className="text-center">
                  <h4 className="text-white font-bold text-xl mb-1">Access Granted.</h4>
                  <p className="text-zinc-500 text-sm">Welcome to the inner circle. Check your inbox for the briefing.</p>
                </div>
                <button 
                  onClick={() => setStatus('idle')}
                  className="mt-4 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600 hover:text-white transition-colors"
                >
                  Subscription Active
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
};

export default NewsletterSection;
