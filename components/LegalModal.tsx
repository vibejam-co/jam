
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, ShieldCheck, FileText, LifeBuoy, ExternalLink, ArrowRight, HelpCircle } from 'lucide-react';

interface LegalModalProps {
  initialTab: 'Terms' | 'Privacy' | 'FAQ' | 'Support';
  onClose: () => void;
}

type LegalTab = 'Terms' | 'Privacy' | 'FAQ' | 'Support';

const LegalModal: React.FC<LegalModalProps> = ({ initialTab, onClose }) => {
  const [activeTab, setActiveTab] = React.useState<LegalTab>(initialTab);

  const tabs: Array<{ id: LegalTab; label: string; icon: React.ComponentType<{ className?: string }> }> = [
    { id: 'Terms', label: 'Terms of Service', icon: FileText },
    { id: 'Privacy', label: 'Privacy Policy', icon: ShieldCheck },
    { id: 'FAQ', label: 'FAQ', icon: HelpCircle },
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
                  onClick={() => setActiveTab(tab.id)}
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
                  <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">Effective Date: March 2026</p>
                </div>

                <div className="space-y-6 text-zinc-400 text-sm leading-relaxed">
                  <p>Welcome to VibeJam. We are committed to protecting your personal information and your right to privacy. This Privacy Policy explains how we collect, use, encrypt, and share your information when you use our marketplace, verification engine, and Deal Room.</p>

                  <section className="bg-white/[0.03] border border-white/10 p-8 rounded-3xl">
                    <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-cyan-400" />
                      1. THE "ZERO-PII" CUSTOMER GUARANTEE
                    </h3>
                    <p>VibeJam is an infrastructure built to verify aggregate business metrics, not to track individual people.</p>
                    <ul className="list-disc pl-5 space-y-2 mt-4">
                      <li>We DO NOT collect, fetch, or store the Personally Identifiable Information (PII) of your startup's customers.</li>
                      <li>We DO NOT read your customers' names, email addresses, phone numbers, or individual billing histories.</li>
                      <li>Your customer list remains 100% private, invisible to VibeJam, and stays securely within your payment processor (e.g., Stripe, Dodo Payments).</li>
                    </ul>
                  </section>

                  <section>
                    <h3 className="text-white font-bold text-lg mb-4">2. INFORMATION WE COLLECT</h3>
                    <p>To operate the marketplace and verify assets, we collect the following categories of information from our Users (Founders and Buyers):</p>
                    <ul className="list-disc pl-5 space-y-2">
                      <li>User Account Information: Your name, email address, Supabase authentication data, and optional social proof links (e.g., X/Twitter handles, LinkedIn URLs).</li>
                      <li>Verified Financial Data: Aggregate revenue metrics (MRR, Net Revenue, Churn Rate) fetched securely via Read-Only API keys from your payment providers (Stripe, Dodo Payments, RevenueCat, LemonSqueezy, or Polar).</li>
                      <li>Self-Reported Context Data: Operating expenses, profit margins, and tech stack details that you manually input.</li>
                      <li>Verified Traffic Data: Aggregate monthly unique visitors fetched via web analytics APIs (e.g., Plausible Analytics, Google Analytics) or provided via proof URLs.</li>
                      <li>Deal Room & Escrow Data: Messages sent between Buyers and Sellers, accepted offer amounts, and transaction metadata required to programmatically generate Escrow.com transactions.</li>
                      <li>Platform Payment Data: If you purchase a "Premium Boost," payment details are processed securely by our Merchant of Record (Dodo Payments). VibeJam does not store your credit card numbers.</li>
                    </ul>
                  </section>

                  <section>
                    <h3 className="text-white font-bold text-lg mb-4">3. HOW WE USE YOUR INFORMATION</h3>
                    <p>We use the data we collect strictly to operate and improve the VibeJam marketplace:</p>
                    <ul className="list-disc pl-5 space-y-2">
                      <li>To auto-generate verified financial dashboards for your public marketplace listing.</li>
                      <li>To dynamically generate social media sharing images (Open Graph/Twitter cards) featuring your public metrics.</li>
                      <li>To route transactional notifications (e.g., Deal Alerts, New Offers) via our email provider (Resend).</li>
                      <li>To calculate platform-wide benchmarks and enforce our Terms of Service.</li>
                    </ul>
                  </section>

                  <section>
                    <h3 className="text-white font-bold text-lg mb-4">4. DATA SHARING & PROGRESSIVE DISCLOSURE</h3>
                    <p>VibeJam acts as a secure proxy between Buyers and Sellers. We do not sell your personal data to data brokers or marketing agencies.</p>
                    <p className="text-white font-semibold mt-4">The Deal Room Proxy Wall:</p>
                    <ul className="list-disc pl-5 space-y-2">
                      <li>Pre-Offer: Your personal email address and identity remain hidden from Buyers browsing the marketplace.</li>
                      <li>Post-Offer: We utilize "Progressive Disclosure." Only when a Seller officially clicks "Accept Offer" do we reveal the Buyer and Seller email addresses to each other to facilitate the signing of Legal Agreements (LOI and APA).</li>
                    </ul>
                    <p className="text-white font-semibold mt-4">Third-Party Service Providers:</p>
                    <p>We share necessary data payloads with trusted infrastructure partners to operate the platform:</p>
                    <ul className="list-disc pl-5 space-y-2">
                      <li>Escrow.com: To facilitate secure wire transfers, we share the Buyer and Seller email addresses and the agreed purchase price via their Broker API.</li>
                      <li>Vercel & Supabase: For secure cloud hosting and relational database management.</li>
                      <li>Resend: For delivering transactional emails.</li>
                    </ul>
                  </section>

                  <section>
                    <h3 className="text-white font-bold text-lg mb-4">5. DATA SECURITY & ENCRYPTION</h3>
                    <p>We treat your API keys as "Class-1" sensitive data.</p>
                    <ul className="list-disc pl-5 space-y-2">
                      <li>AES-256-GCM Encryption: All third-party API keys provided to VibeJam are encrypted at rest using industrial-grade cryptography. No human staff member at VibeJam can view your full API keys in plain text.</li>
                      <li>Strictly Read-Only: VibeJam's backend enforces a "Zero-Write" policy. We programmatically reject administrative or "Secret" keys (e.g., sk_live_) for platforms like Stripe, exclusively accepting restricted, read-only keys (rk_live_).</li>
                    </ul>
                  </section>

                  <section>
                    <h3 className="text-white font-bold text-lg mb-4">6. DATA RETENTION & DELETION</h3>
                    <p>You are the owner of your data.</p>
                    <ul className="list-disc pl-5 space-y-2">
                      <li>The Right to Disconnect: You can disconnect your payment or analytics accounts from your VibeJam dashboard at any time. When you disconnect, our system automatically and immediately purges your encrypted API keys from our database.</li>
                      <li>Account Deletion: If you wish to permanently delete your VibeJam account and all associated marketplace listings, you may do so via your account settings or by contacting our support team.</li>
                    </ul>
                  </section>

                  <section>
                    <h3 className="text-white font-bold text-lg mb-4">7. INTERNATIONAL DATA TRANSFERS</h3>
                    <p>VibeJam operates globally. Your information may be transferred to, stored, and processed in secure cloud infrastructure located outside of your home country (including the United States or the European Union). By using VibeJam, you consent to the transfer of information to countries outside your country of residence, which may have different data protection rules. As noted in our Terms of Service, VibeJam operates under the governing law of the United Arab Emirates (UAE).</p>
                  </section>

                  <section>
                    <h3 className="text-white font-bold text-lg mb-4">8. YOUR PRIVACY RIGHTS</h3>
                    <p>Depending on your global location (including under GDPR or CCPA), you may have the right to:</p>
                    <ul className="list-disc pl-5 space-y-2">
                      <li>Request access to the personal data we hold about you.</li>
                      <li>Request corrections to inaccurate data.</li>
                      <li>Request the erasure of your personal data.</li>
                      <li>Opt-out of non-transactional marketing communications (e.g., Deal Alerts).</li>
                    </ul>
                  </section>

                  <section>
                    <h3 className="text-white font-bold text-lg mb-4">9. CHANGES TO THIS POLICY</h3>
                    <p>We may update this Privacy Policy periodically to reflect changes in our infrastructure, integrations, or legal requirements. We will notify you of any material changes by updating the "Effective Date" at the top of this policy and, where appropriate, sending an email notification.</p>
                  </section>

                  <section>
                    <h3 className="text-white font-bold text-lg mb-4">10. CONTACT US</h3>
                    <p>Questions about this policy, your data, or our AES encryption standards? Contact our Data Protection team at: <span className="text-white font-bold">vibejamco@gmail.com</span>.</p>
                  </section>
                </div>
              </motion.div>
            )}

            {activeTab === 'FAQ' && (
              <motion.div
                key="faq"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="prose prose-invert max-w-none space-y-8"
              >
                <div className="border-l-2 border-emerald-400 pl-6 py-2 mb-12">
                  <h1 className="text-3xl font-extrabold text-white tracking-tighter mb-2">VibeJam FAQ</h1>
                  <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">Everything You Need to Know</p>
                </div>

                <div className="space-y-8 text-zinc-400 text-sm leading-relaxed">
                  <section>
                    <h3 className="text-white font-bold text-lg mb-4">General & Platform</h3>

                    <div className="space-y-4">
                      <div>
                        <p className="text-white font-semibold">What is VibeJam?</p>
                        <p>VibeJam is a premium marketplace and financial verification engine for buying and selling profitable micro-startups, SaaS products, and mobile apps. We connect directly to payment processors (like Stripe and Dodo Payments) to verify real revenue, completely eliminating the risk of fake MRR screenshots.</p>
                      </div>
                      <div>
                        <p className="text-white font-semibold">How is VibeJam different from other marketplaces?</p>
                        <p>Most marketplaces stop at verifying gross revenue, which can be misleading. VibeJam is built for serious buyers and sellers by verifying net profit, churn rate, and web traffic. We also provide an integrated Deal Room with LOI and APA templates plus native Escrow.com API workflows to handle secure handover.</p>
                      </div>
                      <div>
                        <p className="text-white font-semibold">What payment processors do you support for verification?</p>
                        <p>We support Stripe, Dodo Payments, LemonSqueezy, Polar, and RevenueCat. Whether you run a US-based SaaS or a global app, you can verify revenue on VibeJam.</p>
                      </div>
                    </div>
                  </section>

                  <section>
                    <h3 className="text-white font-bold text-lg mb-4">Security & Data Privacy</h3>

                    <div className="space-y-4">
                      <div>
                        <p className="text-white font-semibold">Is it safe to connect my Stripe or payment API key?</p>
                        <p>Yes. VibeJam enforces a strict zero-write architecture. For Stripe, we reject standard secret keys (`sk_live_`) and only accept restricted read-only keys (`rk_live_`). VibeJam cannot initiate charges, issue refunds, or alter your business. API keys are encrypted at rest with AES-256-GCM.</p>
                      </div>
                      <div>
                        <p className="text-white font-semibold">Do you collect or see my customers&apos; personal data?</p>
                        <p>No. We follow a Zero-PII guarantee. We only fetch aggregate metrics (such as MRR and churn) and do not fetch or store customer names, emails, or individual billing histories.</p>
                      </div>
                      <div>
                        <p className="text-white font-semibold">Will my email address be spammed by buyers?</p>
                        <p>No. VibeJam uses progressive disclosure. Your direct contact info stays hidden during discovery and is only revealed after you explicitly accept a formal offer.</p>
                      </div>
                    </div>
                  </section>

                  <section>
                    <h3 className="text-white font-bold text-lg mb-4">For Sellers</h3>

                    <div className="space-y-4">
                      <div>
                        <p className="text-white font-semibold">How much does it cost to sell my startup on VibeJam?</p>
                        <p>Listing is free. VibeJam charges a flat 3% success commission only if your startup is acquired. Optional paid boosts may be available for extra visibility.</p>
                      </div>
                      <div>
                        <p className="text-white font-semibold">How do you calculate profit margin?</p>
                        <p>We fetch verified gross MRR from your connected provider and combine it with your declared trailing 30-day operating expenses. VibeJam computes and displays net profit margin as a listing signal.</p>
                      </div>
                      <div>
                        <p className="text-white font-semibold">What happens if I reject an offer?</p>
                        <p>You keep full control. You can reject, counter, or continue negotiating through the in-platform inbox, and your listing remains active for other buyers.</p>
                      </div>
                    </div>
                  </section>

                  <section>
                    <h3 className="text-white font-bold text-lg mb-4">For Buyers</h3>

                    <div className="space-y-4">
                      <div>
                        <p className="text-white font-semibold">How do I know the financial numbers are real?</p>
                        <p>Core metrics are pulled directly from payment processors via API, rather than uploaded screenshots or spreadsheets.</p>
                      </div>
                      <div>
                        <p className="text-white font-semibold">How do I make an offer?</p>
                        <p>Open a listing, click Make Offer, submit amount and message, and the seller is notified instantly. Once accepted, both parties move into a private Deal Room.</p>
                      </div>
                      <div>
                        <p className="text-white font-semibold">Can I set up alerts for specific startup criteria?</p>
                        <p>Yes. Create alerts from Marketplace filters (MRR, price, margin, churn, traffic). You will receive email notifications for matching new listings.</p>
                      </div>
                    </div>
                  </section>

                  <section>
                    <h3 className="text-white font-bold text-lg mb-4">Deal Room & Escrow</h3>

                    <div className="space-y-4">
                      <div>
                        <p className="text-white font-semibold">What happens after an offer is accepted?</p>
                        <p>The workflow is guided in stages: LOI, due diligence, APA, escrow funding, and asset transfer/close. Each stage is progressively unlocked in the Deal Room.</p>
                      </div>
                      <div>
                        <p className="text-white font-semibold">How are funds secured? Do I pay the seller directly?</p>
                        <p>Do not wire funds directly. VibeJam integrates with Escrow.com so funds are secured in escrow and released only after transfer conditions are met.</p>
                      </div>
                      <div>
                        <p className="text-white font-semibold">Who pays escrow fees?</p>
                        <p>Standard Escrow.com fees are typically split 50/50 between buyer and seller. This is separate from VibeJam&apos;s success commission.</p>
                      </div>
                      <div>
                        <p className="text-white font-semibold">Do I need a lawyer to draft contracts?</p>
                        <p>VibeJam provides LOI and APA templates in the Deal Room to reduce setup friction, but both parties should consult independent legal counsel for final agreement review.</p>
                      </div>
                    </div>
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
