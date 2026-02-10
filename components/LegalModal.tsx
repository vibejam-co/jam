
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, ShieldCheck, FileText, LifeBuoy, ExternalLink, ArrowRight } from 'lucide-react';

interface LegalModalProps {
  initialTab: 'Terms' | 'Privacy' | 'Support';
  onClose: () => void;
}

const LegalModal: React.FC<LegalModalProps> = ({ initialTab, onClose }) => {
  const [activeTab, setActiveTab] = React.useState(initialTab);

  const tabs = [
    { id: 'Terms', label: 'Terms of Service', icon: FileText },
    { id: 'Privacy', label: 'Privacy Policy', icon: ShieldCheck },
    { id: 'Support', label: 'Support', icon: LifeBuoy },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[150] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 sm:p-8"
    >
      <div className="absolute inset-0" onClick={onClose} />
      
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        className="relative w-full max-w-4xl max-h-[85vh] bg-[#050505] border border-white/10 rounded-[40px] shadow-[0_40px_120px_-20px_rgba(0,0,0,1)] overflow-hidden flex flex-col"
      >
        {/* Modal Header */}
        <header className="px-8 py-6 border-b border-white/5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-6">
            <nav className="flex items-center gap-2 bg-white/[0.03] p-1 rounded-full border border-white/5">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2
                    ${activeTab === tab.id ? 'bg-white text-black' : 'text-zinc-500 hover:text-white'}`}
                >
                  <tab.icon className="w-3 h-3" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-all">
            <X className="w-6 h-6 text-zinc-500" />
          </button>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-8 sm:p-12 no-scrollbar scroll-smooth">
          <AnimatePresence mode="wait">
            {activeTab === 'Terms' && (
              <motion.div
                key="terms"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="prose prose-invert max-w-none space-y-8"
              >
                <div className="border-l-2 border-[#D4AF37] pl-6 py-2 mb-12">
                  <h1 className="text-3xl font-extrabold text-white tracking-tighter mb-2">Terms of Service</h1>
                  <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">Last Updated: October 2026</p>
                </div>

                <div className="space-y-6 text-zinc-400 text-sm leading-relaxed">
                  <p>Welcome to VibeJam (“the Platform”). By accessing or using our website, services, or tools, you (“the User,” “Founder,” or “Buyer”) agree to be bound by these Terms of Service (“Terms”). If you do not agree to these terms, please do not use the Platform.</p>
                  
                  <section>
                    <h3 className="text-white font-bold text-lg mb-4">1. Description of Service</h3>
                    <p>VibeJam provides a marketplace and leaderboard for startups with verified revenue. We facilitate the discovery, verification, and acquisition of digital assets by connecting to third-party payment processors (e.g., Stripe, LemonSqueezy) to display real-time financial data.</p>
                  </section>

                  <section>
                    <h3 className="text-white font-bold text-lg mb-4">2. Eligibility & Account Security</h3>
                    <ul className="list-disc pl-5 space-y-2">
                      <li>Age: You must be at least 18 years old to use this Platform.</li>
                      <li>Verification: You agree to provide accurate information when connecting your revenue sources.</li>
                      <li>Responsibility: You are solely responsible for all activity under your account. VibeJam reserves the right to suspend accounts that provide fraudulent data or engage in predatory behavior.</li>
                    </ul>
                  </section>

                  <section>
                    <h3 className="text-white font-bold text-lg mb-4">3. Revenue Verification & Data Permissions</h3>
                    <p>By connecting a third-party API (Stripe, LemonSqueezy, etc.) to VibeJam:</p>
                    <ul className="list-disc pl-5 space-y-2">
                      <li>You grant VibeJam a non-exclusive, worldwide license to fetch, store, and publicly display your revenue metrics.</li>
                      <li>You represent that you have the legal right to share this data.</li>
                      <li>Accuracy Disclaimer: While VibeJam verifies data via direct API connections, we do not audit the underlying business operations. Buyers are responsible for their own deep-dive due diligence.</li>
                    </ul>
                  </section>

                  <section>
                    <h3 className="text-white font-bold text-lg mb-4">4. Marketplace Fees & Success Commission</h3>
                    <p>VibeJam operates on a performance-based model to ensure our interests align with our users:</p>
                    <ul className="list-disc pl-5 space-y-2">
                      <li>Success Fee: If a startup listed on VibeJam is acquired, VibeJam is entitled to a 3% commission of the total purchase price, unless otherwise agreed in writing.</li>
                      <li>Payment: This fee is typically collected automatically through our integrated escrow partners (e.g., Escrow.com).</li>
                      <li>Listing Boosts: Fees paid for "Pro" or "Premium" visibility are non-refundable and do not guarantee a sale.</li>
                    </ul>
                  </section>

                  <section>
                    <h3 className="text-white font-bold text-lg mb-4">5. Anti-Circumvention Policy (The "No-Backdoor" Rule)</h3>
                    <p>To maintain the integrity of our marketplace:</p>
                    <ul className="list-disc pl-5 space-y-2">
                      <li>Direct Contact: If a Buyer discovers a startup through VibeJam, the Buyer and Seller must conduct the transaction through the VibeJam platform or our designated escrow partner.</li>
                      <li>Fee Avoidance: Any attempt to bypass the Platform to avoid the 3% success fee is a material breach of these Terms.</li>
                      <li>Penalty: If a deal is "taken offline" to circumvent fees, VibeJam reserves the right to invoice the Seller for the 3% commission based on the estimated value of the company and permanently ban both parties from the Platform.</li>
                    </ul>
                  </section>

                  <section>
                    <h3 className="text-white font-bold text-lg mb-4">6. Role of VibeJam in Acquisitions</h3>
                    <p>VibeJam is a platform for discovery. We are not a business broker or legal advisor, nor are we a party to any Asset Purchase Agreement (APA) between Buyer and Seller.</p>
                  </section>

                  <section>
                    <h3 className="text-white font-bold text-lg mb-4">7. Intellectual Property</h3>
                    <p>The VibeJam brand, logo, code, and design are the exclusive property of VibeJam. You retain ownership of your startup's IP, but grant us the right to feature your brand and metrics for marketing purposes.</p>
                  </section>

                  <section>
                    <h3 className="text-white font-bold text-lg mb-4">8. Limitation of Liability</h3>
                    <p>TO THE MAXIMUM EXTENT PERMITTED BY LAW, VIBEJAM SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, OR CONSEQUENTIAL DAMAGES ARISING OUT OF YOUR USE OF THE PLATFORM.</p>
                  </section>

                  <section>
                    <h3 className="text-white font-bold text-lg mb-4">12. Contact Us</h3>
                    <p>For support, legal inquiries, or to report a completed acquisition, please contact us at: <span className="text-white font-bold">vibejamco@gmail.com</span>.</p>
                  </section>
                </div>
              </motion.div>
            )}

            {activeTab === 'Privacy' && (
              <motion.div
                key="privacy"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="prose prose-invert max-w-none space-y-8"
              >
                <div className="border-l-2 border-cyan-500 pl-6 py-2 mb-12">
                  <h1 className="text-3xl font-extrabold text-white tracking-tighter mb-2">Privacy Policy</h1>
                  <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">Effective Date: October 2023</p>
                </div>

                <div className="space-y-6 text-zinc-400 text-sm leading-relaxed">
                  <section className="bg-white/[0.03] border border-white/10 p-8 rounded-3xl">
                    <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-cyan-400" />
                      1. THE "ZERO-PII" CUSTOMER GUARANTEE
                    </h3>
                    <p>VibeJam is built to verify business metrics, not individual people. We do NOT collect: Names, email addresses, phone numbers, or billing histories of your customers. Your customer list remains 100% private and invisible to VibeJam.</p>
                  </section>

                  <section>
                    <h3 className="text-white font-bold text-lg mb-4">2. INFORMATION WE COLLECT</h3>
                    <p>We collect User Account Information, Verified Revenue Data (via Read-Only API keys), and Aggregate Verified Traffic Data (via Google Analytics).</p>
                  </section>

                  <section>
                    <h3 className="text-white font-bold text-lg mb-4">4. DATA SECURITY & ENCRYPTION</h3>
                    <p>We treat your API keys as "Class-1" sensitive data. All keys are stored using AES-256 industrial-grade encryption. No human staff member at VibeJam can view your full API keys in plain text.</p>
                  </section>

                  <section>
                    <h3 className="text-white font-bold text-lg mb-4">6. DATA RETENTION & DELETION</h3>
                    <p>You are the owner of your data. You can disconnect your accounts at any time, and we immediately purge your API keys from our database.</p>
                  </section>

                  <section>
                    <h3 className="text-white font-bold text-lg mb-4">11. CONTACT US</h3>
                    <p>Questions about this policy? Contact our Data Protection team at: <span className="text-white font-bold">vibejamco@gmail.com</span>.</p>
                  </section>
                </div>
              </motion.div>
            )}

            {activeTab === 'Support' && (
              <motion.div
                key="support"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="h-full flex flex-col items-center justify-center text-center py-20"
              >
                <div className="w-24 h-24 rounded-[32px] bg-gradient-to-br from-[#D4AF37]/20 to-transparent border border-[#D4AF37]/30 flex items-center justify-center mb-10 shadow-[0_0_60px_rgba(212,175,55,0.1)]">
                  <LifeBuoy className="w-10 h-10 text-[#D4AF37]" />
                </div>
                
                <h2 className="text-4xl font-extrabold text-white tracking-tighter mb-4">How can we help?</h2>
                <p className="text-zinc-500 text-lg max-w-md mx-auto mb-12">
                  Whether you're reporting a successful acquisition or need technical assistance with verification, our team is standing by.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-xl">
                  <a 
                    href="mailto:vibejamco@gmail.com"
                    className="flex flex-col items-center gap-4 p-8 rounded-3xl bg-white/[0.03] border border-white/10 hover:border-white/30 transition-all group"
                  >
                    <div className="p-3 rounded-2xl bg-white/5 group-hover:bg-white/10 transition-colors">
                      <Mail className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="text-white font-bold text-sm mb-1 uppercase tracking-widest">Email Support</h4>
                      <p className="text-zinc-500 text-xs font-mono-data">vibejamco@gmail.com</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-zinc-700 group-hover:text-white group-hover:translate-x-1 transition-all" />
                  </a>

                  <div className="flex flex-col items-center gap-4 p-8 rounded-3xl bg-white/[0.03] border border-white/10 opacity-50 cursor-not-allowed">
                    <div className="p-3 rounded-2xl bg-white/5">
                      <ExternalLink className="w-6 h-6 text-zinc-500" />
                    </div>
                    <div>
                      <h4 className="text-zinc-500 font-bold text-sm mb-1 uppercase tracking-widest">Help Center</h4>
                      <p className="text-zinc-600 text-[10px] font-bold uppercase tracking-widest">Coming Soon</p>
                    </div>
                  </div>
                </div>

                <div className="mt-20 pt-8 border-t border-white/5 w-full flex items-center justify-center gap-8">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                    <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Live Support Active</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
                    <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Priority for Elite Sellers</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <footer className="px-8 py-4 bg-white/[0.02] border-t border-white/5 flex items-center justify-center">
          <p className="text-[9px] font-bold text-zinc-700 uppercase tracking-[0.4em]">VibeJam • Trusted Acquisition Protocol</p>
        </footer>
      </motion.div>
    </motion.div>
  );
};

export default LegalModal;
