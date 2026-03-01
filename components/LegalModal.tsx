
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
                  <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">Last Updated: March 2026</p>
                </div>

                <div className="space-y-6 text-zinc-400 text-sm leading-relaxed">
                  <p>Welcome to VibeJam ("the Platform," "we," "our," or "us"). By accessing or using our website, services, Deal Room, or marketplace tools, you ("the User," "Founder," "Seller," or "Buyer") agree to be bound by these Terms of Service ("Terms"). If you do not agree to these terms, you must not use the Platform.</p>
                  
                  <section>
                    <h3 className="text-white font-bold text-lg mb-4">1. Description of Service</h3>
                    <p>VibeJam is a premium marketplace and verification engine for digital assets, micro-SaaS, and mobile applications. We facilitate the discovery, financial verification, and acquisition of these assets by connecting to third-party payment processors (e.g., Stripe, Dodo Payments, RevenueCat) to display real-time, verified financial data, and providing a Deal Room to manage the acquisition pipeline.</p>
                  </section>

                  <section>
                    <h3 className="text-white font-bold text-lg mb-4">2. Eligibility & Account Security</h3>
                    <ul className="list-disc pl-5 space-y-2">
                      <li>Age Requirement: You must be at least 18 years old and possess the legal authority to form binding contracts to use this Platform.</li>
                      <li>Data Accuracy: You agree to provide accurate, current, and complete information when connecting your revenue sources, analytics, and personal details.</li>
                      <li>Account Responsibility: You are solely responsible for all activity under your account. VibeJam reserves the right to suspend or permanently ban accounts that provide fraudulent data, misrepresent assets, or engage in predatory behavior.</li>
                    </ul>
                  </section>

                  <section>
                    <h3 className="text-white font-bold text-lg mb-4">3. API Security & "Zero-Write" Policy</h3>
                    <p>Founders must connect third-party APIs to verify revenue. To protect your business, VibeJam enforces strict security protocols:</p>
                    <ul className="list-disc pl-5 space-y-2">
                      <li>Read-Only Requirement: Users must only provide restricted, "Read-Only" API keys (e.g., Stripe rk_live_).</li>
                      <li>Zero-Write Architecture: VibeJam's architecture is fundamentally incapable of initiating customer charges, issuing refunds, or altering your underlying business data.</li>
                      <li>Encryption: All API keys are encrypted at rest using bank-grade AES-256-GCM encryption.</li>
                      <li>User Liability: While VibeJam implements enterprise-grade security, the User remains solely responsible for ensuring the API keys they generate and provide are strictly scoped to Read-Only permissions in their respective payment provider dashboards.</li>
                    </ul>
                  </section>

                  <section>
                    <h3 className="text-white font-bold text-lg mb-4">4. Marketplace Fees & Success Commission</h3>
                    <p>VibeJam operates on a performance and visibility-based model:</p>
                    <ul className="list-disc pl-5 space-y-2">
                      <li>The Success Commission: If a startup listed on VibeJam is acquired, VibeJam charges a 3% Success Commission based on the final, total purchase price of the asset.</li>
                      <li>Escrow Fees Excluded: Our 3% commission is strictly for VibeJam's marketplace facilitation. It does not include third-party escrow transaction fees (e.g., Escrow.com fees), which are separate and typically split 50/50 between the Buyer and Seller.</li>
                      <li>Paid Boosts: Optional fees paid for "Pro" or "Elite" visibility boosts are charged upfront. These payments are non-refundable and do not guarantee a successful sale.</li>
                    </ul>
                  </section>

                  <section>
                    <h3 className="text-white font-bold text-lg mb-4">5. Anti-Circumvention Policy (The "No-Backdoor" Rule)</h3>
                    <p>To maintain the integrity of our marketplace and protect our commission structure:</p>
                    <ul className="list-disc pl-5 space-y-2">
                      <li>Platform Exclusivity: If a Buyer discovers an asset or initiates contact with a Seller through VibeJam, the parties must conduct and close the transaction through the VibeJam platform and our designated escrow partner.</li>
                      <li>Fee Avoidance: Any attempt to bypass the Platform, communicate off-platform to avoid the 3% Success Commission, or falsely report a deal as "unsold" is a material breach of these Terms.</li>
                      <li>Penalties: If a transaction is taken offline to circumvent fees, VibeJam reserves the right to immediately invoice the Seller for the 3% commission based on the highest listed Asking Price of the asset, and permanently ban both parties from the Platform.</li>
                    </ul>
                  </section>

                  <section>
                    <h3 className="text-white font-bold text-lg mb-4">6. Third-Party Payment and Escrow Services</h3>
                    <p>VibeJam never holds, processes, or manages acquisition funds. All financial transfers between Buyers and Sellers are facilitated by authorized third-party escrow services (e.g., Escrow.com).</p>
                    <p>By using our Deal Room and initiating an escrow transaction, you agree to the Terms of Service of Escrow.com.</p>
                    <p>VibeJam holds zero liability for delayed wire transfers, banking fees, escrow disputes, or the final release of funds. Any financial disputes regarding the transfer of capital must be resolved directly between the Buyer, the Seller, and the escrow provider.</p>
                  </section>

                  <section>
                    <h3 className="text-white font-bold text-lg mb-4">7. No Legal or Financial Advice (Templates Disclaimer)</h3>
                    <p>VibeJam provides sample legal templates within the Deal Room, including Letters of Intent (LOI) and Asset Purchase Agreements (APA), for educational and convenience purposes only.</p>
                    <p>VibeJam is not a law firm. Providing these documents does not constitute legal, tax, or financial advice.</p>
                    <p>We strongly recommend that both Buyers and Sellers consult independent legal counsel before signing any agreements. VibeJam assumes no liability for legal disputes, loopholes, or damages arising from the use of our provided templates.</p>
                  </section>

                  <section>
                    <h3 className="text-white font-bold text-lg mb-4">8. Role of VibeJam & Due Diligence</h3>
                    <p>VibeJam is a platform for discovery and data aggregation. We are not a business broker, legal advisor, or a party to any Asset Purchase Agreement (APA) signed between a Buyer and Seller.</p>
                    <p>Due Diligence: While VibeJam verifies gross revenue via direct API connections, we do not audit the underlying business operations, code quality, or actual profitability. Buyers are entirely responsible for conducting their own comprehensive due diligence prior to funding escrow.</p>
                  </section>

                  <section>
                    <h3 className="text-white font-bold text-lg mb-4">9. Intellectual Property</h3>
                    <ul className="list-disc pl-5 space-y-2">
                      <li>Platform IP: The VibeJam brand, logo, codebase, algorithms, and UI design are the exclusive property of VibeJam.</li>
                      <li>User IP: You retain full ownership of your startup's intellectual property. However, by publishing a listing, you grant VibeJam a non-exclusive, royalty-free license to fetch, store, and publicly display your revenue metrics, logos, and public data for marketing purposes (including dynamic social media images and newsletters).</li>
                    </ul>
                  </section>

                  <section>
                    <h3 className="text-white font-bold text-lg mb-4">10. Limitation of Liability and Indemnification</h3>
                    <p>TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, VIBEJAM IS PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS. VIBEJAM SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, PUNITIVE, OR CONSEQUENTIAL DAMAGES, INCLUDING LOST PROFITS, LOST DATA, OR BUSINESS INTERRUPTION, ARISING OUT OF YOUR USE OF THE PLATFORM OR A FAILED ACQUISITION. IN NO EVENT SHALL VIBEJAM'S TOTAL CUMULATIVE LIABILITY EXCEED THE TOTAL FEES PAID BY YOU TO VIBEJAM IN THE TWELVE (12) MONTHS PRECEDING THE CLAIM.</p>
                  </section>

                  <section>
                    <h3 className="text-white font-bold text-lg mb-4">11. Governing Law and Dispute Resolution</h3>
                    <p>These Terms and your use of the Platform shall be governed by and construed in accordance with the laws of the United Arab Emirates (UAE), without regard to its conflict of law principles.</p>
                    <p>Any dispute, controversy, or claim arising out of or relating to these Terms, or the breach thereof, shall be subject to the exclusive jurisdiction of the competent courts located in Dubai, United Arab Emirates.</p>
                  </section>

                  <section>
                    <h3 className="text-white font-bold text-lg mb-4">12. Contact Us</h3>
                    <p>For support, legal inquiries, API assistance, or to report a completed acquisition, please contact our team at: <span className="text-white font-bold">vibejamco@gmail.com</span>.</p>
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
