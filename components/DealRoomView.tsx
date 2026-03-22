import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  BadgeCheck,
  CircleDollarSign,
  ClipboardCheck,
  Download,
  FileCheck,
  FolderSearch,
  Mail,
  Shield,
  Banknote,
  Rocket,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Loader2,
  Lock,
} from 'lucide-react';
import { DealEscrowCreateResponse, DealRoomData, DealRoomStatus } from '../types';
import { fetchDealRoom, initiateDealRoomEscrow, updateDealRoomStatus } from '../lib/api';

interface DealRoomViewProps {
  offerId: string;
  authUserId: string | null;
  onRequireAuth: () => void;
}

interface LoiDraft {
  offerId: string;
  date: string;
  buyerName: string;
  sellerName: string;
  projectName: string;
  domains: string;
  totalPurchasePriceUsd: string;
  dueDiligenceDays: string;
  exclusivityDays: string;
  transitionDays: string;
  nonCompeteYears: string;
}

interface ApaDraft {
  offerId: string;
  date: string;
  sellerName: string;
  sellerAddress: string;
  buyerName: string;
  buyerAddress: string;
  projectName: string;
  totalPurchasePriceUsd: string;
  escrowFundingDays: string;
  inspectionDays: string;
  transitionSupportHours: string;
  transitionSupportDays: string;
  nonCompeteYears: string;
  governingLaw: string;
  primaryDomain: string;
  codeRepositories: string;
  paymentProcessorAccount: string;
  hostingProviderAccount: string;
  socialHandles: string;
  otherAccounts: string;
}

const formatUsd = (cents: number): string =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format((Number(cents) || 0) / 100);

const guessNameFromEmail = (email: string | null | undefined): string => {
  const value = String(email ?? '').trim();
  if (!value || !value.includes('@')) {
    return '';
  }
  return value.split('@')[0].replace(/[._-]+/g, ' ').trim();
};

const escapeHtml = (value: string): string =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

const toFileToken = (value: string): string =>
  String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'deal-document';

const isVerificationPendingResponse = (response: DealEscrowCreateResponse): boolean => {
  if (response.paymentBlockedCode === 'VERIFICATION_REQUIRED') {
    return true;
  }
  const blockedReason = String(response.paymentBlockedReason ?? '').trim().toLowerCase();
  return blockedReason.includes('verification review') || blockedReason.includes('requires buyer verification');
};

const buildVerificationPendingMessage = (response: DealEscrowCreateResponse): string => {
  const note = String(response.sandboxNextStep?.note ?? '').trim();
  if (note) {
    return `Escrow sandbox is waiting for buyer verification review before payment can be approved. ${note}`;
  }
  return 'Escrow sandbox is waiting for buyer verification review before payment can be approved. '
    + 'Approve the buyer verification in Integration Helper or Partner Dashboard, then retry funding.';
};

const loiBodyText = (draft: LoiDraft): string => `LETTER OF INTENT (LOI)
Facilitated via VibeJam Marketplace
Date: ${draft.date || '[DATE]'}
Buyer Name / Entity: ${draft.buyerName || '[BUYER NAME]'}
Seller Name / Entity: ${draft.sellerName || '[SELLER NAME]'}
Asset / Project Name: ${draft.projectName || '[PROJECT NAME]'} (the "Asset")

1. The Objective
This Letter of Intent (LOI) outlines the proposed terms for the Buyer to acquire 100% of the assets, intellectual property, and associated revenue of the Asset from the Seller.
While the purchase terms in this document are non-binding, the sections regarding Exclusivity and Confidentiality are legally binding upon signature.

2. The Target Asset
The acquisition includes all properties required to operate the Asset, specifically including but not limited to:
Domains: ${draft.domains || '[e.g., myapp.com]'}
Codebase: All source code, Git repositories (e.g., GitHub/GitLab), and technical documentation.
Customer & Financial Data: Transfer of the active Stripe / LemonSqueezy / Merchant of Record account, including all active subscriptions and customer lists.
Brand & Intellectual Property: Logos, trademarks, UI/UX designs, and marketing assets.
Accounts & Hosting: Social media accounts (X/Twitter, LinkedIn), email lists, and server hosting accounts (AWS, Vercel, Heroku, etc.).

3. Purchase Price & Payment Terms
The Buyer agrees to acquire the Asset for a total purchase price of $${draft.totalPurchasePriceUsd || '[TOTAL PURCHASE PRICE]'} USD.
Payment Schedule:
100% of the purchase price will be paid in cash at Closing.
All funds will be routed securely through Escrow.com (or an agreed-upon third-party escrow service). The funds will only be released to the Seller once the Buyer confirms full receipt and control of the Target Assets.
Escrow fees will be split 50/50 between the Buyer and Seller.

4. Due Diligence Period
Following the signing of this LOI, the Seller agrees to grant the Buyer read-only access to verify the financial, technical, and operational health of the Asset.
Timeframe: The Buyer has ${draft.dueDiligenceDays || '[7 or 14]'} days from the date of signing to complete Due Diligence.
Access: The Seller will provide read-only access to analytics (e.g., Google Analytics/Plausible), financial dashboards, and the codebase.

5. Exclusivity ("No-Shop" Clause) - [Binding]
In consideration of the time and expense the Buyer will incur during Due Diligence, the Seller agrees to a strict period of exclusivity for ${draft.exclusivityDays || '[14]'} days following the signing of this LOI.
During this period, the Seller will not solicit, negotiate, or accept any other offers to sell the Asset.
The Seller will pause their listing on VibeJam and any other marketplaces.

6. Confidentiality - [Binding]
Both parties agree to keep all shared financial data, source code, and the terms of this LOI strictly confidential. Neither party will publicly announce the acquisition until the deal is successfully closed and funds are released.

7. Transition & Non-Compete (To be detailed in the APA)
Upon closing, the Seller agrees to provide ${draft.transitionDays || '[30]'} days of reasonable email support to help the Buyer transition the codebase and servers. Furthermore, the Seller agrees not to build or launch a direct competitor to the Asset for a period of ${draft.nonCompeteYears || '[2]'} years.

8. Closing & The APA
If Due Diligence is satisfactory, both parties will proceed to draft and sign a definitive legally binding Asset Purchase Agreement (APA), which will supersede this LOI and initiate the Escrow process.

Signatures
By signing below, both parties acknowledge their intent to proceed with the transaction under the terms outlined above, and agree to be legally bound by Sections 5 (Exclusivity) and Section 6 (Confidentiality).

THE SELLER
Name: ___________________________________
Signature: ________________________________
Date: ____________________________________

THE BUYER
Name: ___________________________________
Signature: ________________________________
Date: ____________________________________

Disclaimer: This template is provided by VibeJam for educational and convenience purposes. It does not constitute formal legal advice. Both parties are encouraged to consult their own legal counsel before entering into financial agreements.`;

const apaBodyText = (draft: ApaDraft): string => `ASSET PURCHASE AGREEMENT (APA)
Facilitated via VibeJam Marketplace

This Asset Purchase Agreement (the "Agreement") is entered into on ${draft.date || '[DATE]'} (the "Effective Date"), by and between:
SELLER: ${draft.sellerName || '[Seller Full Name / Company Name]'}, located at ${draft.sellerAddress || '[Seller Address / Country]'}
BUYER: ${draft.buyerName || '[Buyer Full Name / Company Name]'}, located at ${draft.buyerAddress || '[Buyer Address / Country]'}

1. Purchase and Sale of Assets
Subject to the terms and conditions of this Agreement, the Seller agrees to sell, transfer, and assign to the Buyer, and the Buyer agrees to purchase, 100% of the Seller's rights, title, and interest in the digital business known as ${draft.projectName || '[PROJECT/APP NAME]'} (the "Business").

The "Assets" being transferred include, but are not limited to:
Domains: All domain names associated with the Business.
Source Code & IP: All proprietary software, source code (e.g., GitHub repositories), databases, algorithms, logos, designs, and branding.
Customer & Financial Data: All active subscriptions, customer lists, and the associated payment processor accounts (e.g., Stripe, LemonSqueezy, Dodo Payments).
Third-Party Accounts: All social media handles, email lists, web hosting (e.g., Vercel, AWS), and associated third-party SaaS accounts used to run the Business.
(A full checklist is provided in Exhibit A).
Excluded Assets: The Seller is not assuming any of the Seller’s prior debts, unpaid taxes, or liabilities created before the Effective Date.

2. Purchase Price and Escrow Mechanism
The total purchase price for the Assets is $${draft.totalPurchasePriceUsd || '[TOTAL PURCHASE PRICE]'} USD (the "Purchase Price").
Payment Flow:
Escrow Funding: Within ${draft.escrowFundingDays || '[3]'} business days of signing this Agreement, the Buyer will deposit 100% of the Purchase Price into a secure transaction via Escrow.com.
Asset Transfer: Upon Escrow confirming the funds are secured, the Seller will immediately transfer all Assets (Domain, GitHub, Stripe, etc.) to the Buyer.
Inspection Period: The Buyer will have ${draft.inspectionDays || '[3 to 5]'} days (the "Inspection Period") to verify they have full administrative control of the Assets and that the code functions as advertised.
Release of Funds: Upon Buyer’s approval in Escrow.com, the funds will be released to the Seller’s bank account.

3. Representations and Warranties of the Seller
To protect the Buyer, the Seller legally promises and guarantees the following:
Ownership: The Seller is the sole owner of the Assets and has the absolute right to sell them. No other developers or third parties hold uncredited equity or ownership.
No Infringement: The source code and branding do not infringe on the copyrights, trademarks, or intellectual property of any third party.
Accurate Metrics: All financial metrics (MRR, revenue) and traffic data presented on VibeJam prior to this Agreement are true and accurate.
No Lawsuits: There are no pending lawsuits, claims, or legal disputes against the Business.

4. Handover and Transition Support
To ensure a smooth handover, the Seller agrees to provide transition assistance to the Buyer at no additional cost.
The Seller will provide up to ${draft.transitionSupportHours || '[10]'} hours of support via email, Slack, or Zoom over a period of ${draft.transitionSupportDays || '[30]'} days following the close of Escrow.
This support is strictly limited to explaining the codebase, assisting with server migration, and introducing the Buyer to the software architecture. It does not include writing new features.

5. Non-Compete and Non-Solicitation
To protect the value of the Business the Buyer is purchasing, the Seller agrees to the following restrictions for a period of ${draft.nonCompeteYears || '[2]'} years following the Effective Date:
Non-Compete: The Seller will not build, launch, or advise any new software, app, or business that directly competes with the core functionality of the Business sold today.
Non-Solicitation: The Seller will not intentionally contact the Business's existing customers to persuade them to cancel their subscriptions or move to a competing service.

6. Governing Law
This Agreement shall be governed by and construed in accordance with the laws of ${draft.governingLaw || '[The State of Delaware, USA / Your Jurisdiction]'}, without regard to its conflict of law principles.

Signatures
By signing below, the parties agree to be legally bound by all terms and conditions of this Asset Purchase Agreement.

THE SELLER
Printed Name: ___________________________________
Signature: _____________________________________
Date: _________________________________________

THE BUYER
Printed Name: ___________________________________
Signature: _____________________________________
Date: _________________________________________

EXHIBIT A: The Asset Schedule
(To be filled out by Buyer & Seller before signing)
Primary Domain: ${draft.primaryDomain || '_________________________'}
Code Repositories: ${draft.codeRepositories || '_________________________'}
Payment Processor (e.g., Stripe Email): ${draft.paymentProcessorAccount || '_________________________'}
Hosting Provider (e.g., Vercel/AWS Email): ${draft.hostingProviderAccount || '_________________________'}
Social Media Handles (X, LinkedIn): ${draft.socialHandles || '_________________________'}
Other Key Software Accounts: ${draft.otherAccounts || '_________________________'}

Disclaimer: This template is provided by VibeJam for educational and convenience purposes. It does not constitute formal legal advice. Both parties are strongly encouraged to consult their own legal counsel prior to executing this agreement.`;

const stepperFlow: Array<{
  status: DealRoomStatus;
  title: string;
  detail: string;
  Icon: React.ComponentType<{ className?: string }>;
}> = [
  { status: 'ACCEPTED', title: 'Accepted', detail: 'Offer accepted and LOI preparation started.', Icon: BadgeCheck },
  { status: 'LOI_SIGNED', title: 'LOI Signed', detail: 'Intent terms acknowledged by both sides.', Icon: FileCheck },
  { status: 'DUE_DILIGENCE', title: 'Due Diligence', detail: 'Financial, analytics, and codebase review.', Icon: FolderSearch },
  { status: 'APA_SIGNED', title: 'APA Signed', detail: 'Asset Purchase Agreement executed.', Icon: ClipboardCheck },
  { status: 'ESCROW_FUNDED', title: 'Escrow Funded', detail: 'Funds secured on escrow platform.', Icon: Banknote },
  { status: 'ASSETS_TRANSFERRED', title: 'Assets Transferred', detail: 'Domain, code, and accounts transferred.', Icon: Rocket },
  { status: 'CLOSED', title: 'Closed', detail: 'Deal completed successfully.', Icon: CheckCircle2 },
];

const lockedStepCopy = 'Locked (Requires previous step completion)';

const actionForStatus = (status: DealRoomStatus, role: 'buyer' | 'seller') => {
  if (status === 'PENDING') {
    return {
      step: 'Pre-Step: Offer Decision',
      title: role === 'seller' ? 'Accept Offer to Open Deal Flow' : 'Waiting for Seller Acceptance',
      instructions:
        role === 'seller'
          ? 'Review terms, then accept to begin the guided acquisition workflow.'
          : 'The seller has not accepted this offer yet. Once accepted, this vault unlocks LOI and diligence actions.',
      buttonLabel: role === 'seller' ? 'Accept Offer' : null,
      nextStatus: role === 'seller' ? ('ACCEPTED' as DealRoomStatus) : null,
      href: null,
      externalHref: null,
    };
  }

  if (status === 'ACCEPTED') {
    return {
      step: 'Step 1: Letter of Intent',
      title: 'Confirm Deal Intent',
      instructions: 'Download the LOI template, align on terms, then record that the LOI is signed.',
      buttonLabel: 'Mark LOI as Signed',
      nextStatus: 'LOI_SIGNED' as DealRoomStatus,
      href: '/templates/loi-template.pdf',
      externalHref: null,
    };
  }

  if (status === 'LOI_SIGNED') {
    return {
      step: 'Step 2: Due Diligence',
      title: 'Run Due Diligence',
      instructions:
        'Seller should share analytics and repository access (Google Analytics/Plausible, Stripe metrics, GitHub). Validate KPIs before proceeding.',
      buttonLabel: 'Proceed to Purchase Agreement',
      nextStatus: 'DUE_DILIGENCE' as DealRoomStatus,
      href: null,
      externalHref: null,
    };
  }

  if (status === 'DUE_DILIGENCE') {
    return {
      step: 'Step 3: Asset Purchase Agreement',
      title: 'Execute APA',
      instructions: 'Use the APA template to finalize transfer terms, liabilities, and representations.',
      buttonLabel: 'Mark APA as Signed',
      nextStatus: 'APA_SIGNED' as DealRoomStatus,
      href: '/templates/apa-template.pdf',
      externalHref: null,
    };
  }

  if (status === 'APA_SIGNED') {
    if (role === 'buyer') {
      return {
        step: 'Step 4: Secure Funds',
        title: 'Initiate Escrow.com Vault',
        instructions:
          'Create a 3-party Escrow.com transaction (Buyer, Seller, Broker) and continue from the buyer landing page to wire funds.',
        buttonLabel: 'Initiate Escrow.com Vault',
        nextStatus: null,
        href: null,
        externalHref: null,
      };
    }

    return {
      step: 'Step 4: Secure Funds',
      title: 'Waiting for Buyer Funding',
      instructions:
        'The buyer is responsible for initiating and funding the Escrow.com vault. You will be notified when funds are secured.',
      buttonLabel: null,
      nextStatus: null,
      href: null,
      externalHref: null,
    };
  }

  if (status === 'ESCROW_FUNDED') {
    return {
      step: 'Step 5: Transfer Assets',
      title: 'Transfer Operational Control',
      instructions:
        'Seller should transfer domain, repositories, cloud credentials, and key third-party accounts to the buyer.',
      buttonLabel: 'Confirm Assets Transferred',
      nextStatus: 'ASSETS_TRANSFERRED' as DealRoomStatus,
      href: null,
      externalHref: null,
    };
  }

  if (status === 'ASSETS_TRANSFERRED') {
    return {
      step: 'Step 6: Release Funds',
      title: 'Finalize Settlement',
      instructions: 'Buyer should release funds in Escrow.com after validating all transferred assets.',
      buttonLabel: 'Close Deal',
      nextStatus: 'CLOSED' as DealRoomStatus,
      href: null,
      externalHref: 'https://www.escrow.com',
    };
  }

  if (status === 'CLOSED') {
    return {
      step: 'Completed',
      title: 'Deal Closed',
      instructions: 'This acquisition is complete. Audit logs and message history remain available for reference.',
      buttonLabel: null,
      nextStatus: null,
      href: null,
      externalHref: null,
    };
  }

  return {
    step: 'Terminated',
    title: 'Deal Rejected',
    instructions: 'This deal has been marked rejected. Start a new conversation for revised terms if needed.',
    buttonLabel: null,
    nextStatus: null,
    href: null,
    externalHref: null,
  };
};

const DealRoomView: React.FC<DealRoomViewProps> = ({ offerId, authUserId, onRequireAuth }) => {
  const [deal, setDeal] = useState<DealRoomData | null>(null);
  const [loiDraft, setLoiDraft] = useState<LoiDraft | null>(null);
  const [apaDraft, setApaDraft] = useState<ApaDraft | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isInitiatingEscrow, setIsInitiatingEscrow] = useState(false);
  const [escrowNotice, setEscrowNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authUserId) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    const load = async () => {
      setIsLoading(true);
      setEscrowNotice(null);
      setError(null);
      try {
        const response = await fetchDealRoom(offerId);
        if (!cancelled) {
          setDeal(response.deal);
        }
      } catch (nextError) {
        if (!cancelled) {
          setError(nextError instanceof Error ? nextError.message : 'Failed to load deal room.');
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [authUserId, offerId]);

  const action = useMemo(
    () => (deal ? actionForStatus(deal.status, deal.viewerRole) : null),
    [deal],
  );

  const activeIndex = useMemo(() => {
    if (!deal) return -1;
    return stepperFlow.findIndex((item) => item.status === deal.status);
  }, [deal]);

  const showAcceptedDisclosure = deal?.status === 'ACCEPTED';
  const showDueDiligenceChecklist = deal?.status === 'LOI_SIGNED';
  const showApaDownload = deal?.status === 'DUE_DILIGENCE';
  const showEscrowFundingAction = deal?.status === 'APA_SIGNED' && deal?.viewerRole === 'buyer';
  const showTransferChecklist = deal?.status === 'ESCROW_FUNDED';

  useEffect(() => {
    if (!deal) {
      setLoiDraft(null);
      return;
    }

    setLoiDraft((previous) => {
      if (previous && previous.offerId === deal.offerId) {
        return previous;
      }

      const now = new Date();
      const yyyy = now.getUTCFullYear();
      const mm = String(now.getUTCMonth() + 1).padStart(2, '0');
      const dd = String(now.getUTCDate()).padStart(2, '0');

      return {
        offerId: deal.offerId,
        date: `${yyyy}-${mm}-${dd}`,
        buyerName: guessNameFromEmail(deal.buyer.email),
        sellerName: guessNameFromEmail(deal.seller.email),
        projectName: deal.asset.name,
        domains: deal.asset.slug ? `${deal.asset.slug}` : '',
        totalPurchasePriceUsd: String(Math.max(0, Math.round(deal.agreedPriceCents / 100))),
        dueDiligenceDays: '14',
        exclusivityDays: '14',
        transitionDays: '30',
        nonCompeteYears: '2',
      };
    });
  }, [deal]);

  useEffect(() => {
    if (!deal) {
      setApaDraft(null);
      return;
    }

    setApaDraft((previous) => {
      if (previous && previous.offerId === deal.offerId) {
        return previous;
      }

      const now = new Date();
      const yyyy = now.getUTCFullYear();
      const mm = String(now.getUTCMonth() + 1).padStart(2, '0');
      const dd = String(now.getUTCDate()).padStart(2, '0');

      return {
        offerId: deal.offerId,
        date: `${yyyy}-${mm}-${dd}`,
        sellerName: guessNameFromEmail(deal.seller.email),
        sellerAddress: '',
        buyerName: guessNameFromEmail(deal.buyer.email),
        buyerAddress: '',
        projectName: deal.asset.name,
        totalPurchasePriceUsd: String(Math.max(0, Math.round(deal.agreedPriceCents / 100))),
        escrowFundingDays: '3',
        inspectionDays: '5',
        transitionSupportHours: '10',
        transitionSupportDays: '30',
        nonCompeteYears: '2',
        governingLaw: 'The State of Delaware, USA',
        primaryDomain: deal.asset.slug ?? '',
        codeRepositories: '',
        paymentProcessorAccount: '',
        hostingProviderAccount: '',
        socialHandles: '',
        otherAccounts: '',
      };
    });
  }, [deal]);

  const handleAdvance = async () => {
    if (!deal || !action?.nextStatus || isUpdating) {
      return;
    }

    setIsUpdating(true);
    setEscrowNotice(null);
    setError(null);

    try {
      const response = await updateDealRoomStatus(deal.offerId, action.nextStatus);
      setDeal(response.deal);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Unable to update deal status.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleInitiateEscrow = async () => {
    if (!deal || isInitiatingEscrow) {
      return;
    }

    setIsInitiatingEscrow(true);
    setEscrowNotice(null);
    setError(null);

    try {
      const response = await initiateDealRoomEscrow(deal.offerId);
      if (response.deal) {
        setDeal(response.deal);
      }

      if (response.paymentReady === false) {
        if (isVerificationPendingResponse(response)) {
          setEscrowNotice(buildVerificationPendingMessage(response));
          return;
        }

        const blockedMessage = String(
          response.paymentBlockedReason
          ?? 'Escrow payment cannot proceed yet. Please review transaction diagnostics.',
        ).trim();
        const sandboxNote = String(response.sandboxNextStep?.note ?? '').trim();
        setError(sandboxNote ? `${blockedMessage} ${sandboxNote}` : blockedMessage);
        return;
      }

      const redirectUrl = String(response.landingPage ?? response.transactionPortalUrl ?? '').trim();
      if (redirectUrl && typeof window !== 'undefined') {
        window.location.href = redirectUrl;
        return;
      }

      if (response.transactionId) {
        setError(
          `Escrow transaction ${response.transactionId} was created, but redirect URL was not available yet. ` +
          'Try again in a moment or open your Escrow dashboard directly.',
        );
        return;
      }

      setError('Escrow transaction was created but no landing page was returned. Try again in a moment.');
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Failed to initiate Escrow transaction.');
    } finally {
      setIsInitiatingEscrow(false);
    }
  };

  const openAgreementPrintDialog = (title: string, body: string, projectName: string) => {
    if (typeof window === 'undefined') {
      return;
    }

    const popup = window.open('', '_blank', 'noopener,noreferrer,width=960,height=1200');
    if (!popup) {
      setError('Pop-up blocked. Please allow pop-ups to download the agreement PDF.');
      return;
    }

    const fileLabel = `${toFileToken(projectName)}-${toFileToken(title)}.pdf`;
    const html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(fileLabel)}</title>
    <style>
      @page { size: A4; margin: 24mm; }
      html, body { margin: 0; padding: 0; background: #fff; color: #111; }
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.55; }
      h1 { margin: 0 0 10px; font-size: 22px; }
      .meta { margin-bottom: 16px; color: #444; font-size: 12px; }
      .doc { white-space: pre-wrap; font-family: inherit; font-size: 13px; }
    </style>
  </head>
  <body>
    <h1>${escapeHtml(title)}</h1>
    <div class="meta">Generated by VibeJam Deal Room. Use browser "Save as PDF" to download and sign.</div>
    <div class="doc">${escapeHtml(body)}</div>
    <script>
      window.addEventListener('load', function () {
        setTimeout(function () { window.print(); }, 150);
      });
    </script>
  </body>
</html>`;

    popup.document.open();
    popup.document.write(html);
    popup.document.close();
  };

  if (!authUserId) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center px-6">
        <div className="w-full max-w-xl rounded-[32px] border border-white/10 bg-[#080808] p-10 text-center space-y-5">
          <Shield className="w-10 h-10 text-cyan-300 mx-auto" />
          <h1 className="text-3xl font-black tracking-tight">Secure Deal Room</h1>
          <p className="text-zinc-400">Sign in to access this private post-offer vault.</p>
          <button
            type="button"
            onClick={onRequireAuth}
            className="h-12 px-8 rounded-full bg-white text-black text-xs font-black uppercase tracking-widest hover:bg-zinc-200 transition-all"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-6xl mx-auto px-6 py-10 space-y-7">
        <a
          href="/marketplace"
          className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Marketplace
        </a>

        <div className="rounded-[34px] border border-white/10 bg-gradient-to-br from-white/[0.05] to-transparent p-7 md:p-9 shadow-[0_40px_120px_rgba(0,0,0,0.65)]">
          {isLoading && (
            <div className="text-sm text-zinc-400">Loading deal room...</div>
          )}

          {!isLoading && !deal && (
            <div className="space-y-3">
              <h1 className="text-2xl font-black tracking-tight">Deal Room Unavailable</h1>
              <p className="text-sm text-zinc-400">{error ?? 'Deal not found.'}</p>
            </div>
          )}

          {!isLoading && deal && action && (
            <div className="space-y-8">
              <header className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                <div className="space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-500">Private Acquisition Vault</p>
                  <h1 className="text-3xl md:text-4xl font-black tracking-tight">Deal Room: {deal.asset.name}</h1>
                  <p className="text-zinc-500">{deal.asset.tagline || 'Guided manual closing flow for both parties.'}</p>
                </div>

                <div className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-5 py-4 min-w-[220px]">
                  <p className="text-[10px] font-black uppercase tracking-widest text-emerald-200">Agreed Price</p>
                  <p className="text-2xl font-mono-data font-bold text-emerald-100 mt-1">{formatUsd(deal.agreedPriceCents)}</p>
                </div>
              </header>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <section className="lg:col-span-2 rounded-2xl border border-white/10 bg-[#050505] p-5 md:p-6">
                  <div className="flex items-center gap-2 mb-5">
                    <CircleDollarSign className="w-4 h-4 text-cyan-300" />
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Deal Progress</p>
                  </div>

                  <div className="space-y-4">
                    {stepperFlow.map((step, index) => {
                      const completed = activeIndex >= index && activeIndex >= 0;
                      const active = deal.status === step.status;
                      const locked = activeIndex === -1 ? true : index > activeIndex;
                      return (
                        <div key={step.status} className="flex items-start gap-4">
                          <div className={`mt-0.5 w-9 h-9 rounded-xl border flex items-center justify-center ${completed ? 'border-cyan-400/50 bg-cyan-500/20 text-cyan-200' : 'border-white/10 bg-white/[0.02] text-zinc-500'}`}>
                            <step.Icon className="w-4 h-4" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className={`text-sm font-bold ${completed ? 'text-white' : 'text-zinc-400'}`}>{step.title}</p>
                              {active && <span className="text-[9px] font-black uppercase tracking-widest text-cyan-300">Current</span>}
                              {locked && !active && (
                                <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-zinc-500">
                                  <Lock className="w-3 h-3" /> Locked
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-zinc-500 mt-1">
                              {locked && !active ? lockedStepCopy : step.detail}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {deal.status === 'REJECTED' && (
                    <div className="mt-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs text-red-200 inline-flex items-center gap-2">
                      <XCircle className="w-4 h-4" /> Deal marked as rejected.
                    </div>
                  )}
                </section>

                <aside className="space-y-4">
                  <div className="rounded-2xl border border-white/10 bg-[#050505] p-5">
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-3">Counterparty Contact</p>
                    <p className="text-sm text-zinc-300">{deal.viewerRole === 'buyer' ? 'Seller' : 'Buyer'} Email</p>
                    {deal.counterparty.email ? (
                      <a
                        href={`mailto:${deal.counterparty.email}`}
                        className="mt-2 inline-flex items-center gap-2 text-sm text-cyan-300 hover:text-cyan-200 transition-colors"
                      >
                        <Mail className="w-4 h-4" /> {deal.counterparty.email}
                      </a>
                    ) : (
                      <p className="text-xs text-zinc-500 mt-2">Email unavailable. Use platform inbox as fallback.</p>
                    )}
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-[#050505] p-5 space-y-4">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{action.step}</p>
                      <h3 className="text-xl font-black tracking-tight text-white mt-1">{action.title}</h3>
                      <p className="text-sm text-zinc-400 mt-2 leading-relaxed">{action.instructions}</p>
                      {deal.escrowTransactionId && (
                        <div className="mt-3 rounded-xl border border-cyan-500/20 bg-cyan-500/5 px-3 py-2">
                          <p className="text-[10px] font-black uppercase tracking-widest text-cyan-300">Escrow Transaction</p>
                          <p className="text-xs text-cyan-100 mt-1 break-all">{deal.escrowTransactionId}</p>
                          {deal.escrowStatus && (
                            <p className="text-[11px] text-cyan-200/80 mt-1">Status: {deal.escrowStatus}</p>
                          )}
                        </div>
                      )}
                    </div>

                    {showAcceptedDisclosure && (
                      <>
                        <a
                          href="/templates/loi-template.pdf"
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/[0.03] px-4 py-2 text-xs font-black uppercase tracking-widest text-zinc-200 hover:border-white/30 transition-all"
                        >
                          <FileCheck className="w-4 h-4" /> Download LOI
                        </a>
                        <div className="rounded-xl border border-white/10 bg-black/30 px-3 py-3 space-y-2">
                          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Buyer & Seller Emails</p>
                          <p className="text-xs text-zinc-300 break-all">Buyer: {deal.buyer.email ?? 'Not available yet'}</p>
                          <p className="text-xs text-zinc-300 break-all">Seller: {deal.seller.email ?? 'Not available yet'}</p>
                        </div>
                        <div className="rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-xs text-zinc-400 inline-flex items-center gap-2">
                          <Lock className="w-4 h-4 text-zinc-500" />
                          APA Step Locked (Requires previous step completion)
                        </div>
                        <div className="rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-xs text-zinc-400 inline-flex items-center gap-2">
                          <Lock className="w-4 h-4 text-zinc-500" />
                          Escrow Step Locked (Requires previous step completion)
                        </div>
                      </>
                    )}

                    {showDueDiligenceChecklist && (
                      <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 px-4 py-3 space-y-2">
                        <p className="text-[10px] font-black uppercase tracking-widest text-cyan-300">Due Diligence Checklist</p>
                        <p className="text-xs text-zinc-300">Seller must share the following read-only access before moving forward:</p>
                        <p className="text-xs text-zinc-400">1. GitHub repository (read-only collaborator access).</p>
                        <p className="text-xs text-zinc-400">2. Analytics dashboard (Plausible/GA read-only).</p>
                        <p className="text-xs text-zinc-400">3. Revenue dashboards and subscription metrics (read-only).</p>
                      </div>
                    )}

                    {showApaDownload && (
                      <a
                        href="/templates/apa-template.pdf"
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/[0.03] px-4 py-2 text-xs font-black uppercase tracking-widest text-zinc-200 hover:border-white/30 transition-all"
                      >
                        <FileCheck className="w-4 h-4" /> Download APA
                      </a>
                    )}

                    {action.externalHref && (
                      <a
                        href={action.externalHref}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-xs font-black uppercase tracking-widest text-cyan-200 hover:border-cyan-400/40 transition-all"
                      >
                        <Shield className="w-4 h-4" /> Open Escrow.com
                      </a>
                    )}

                    {showEscrowFundingAction && action.buttonLabel && (
                      <button
                        type="button"
                        disabled={isInitiatingEscrow}
                        onClick={() => void handleInitiateEscrow()}
                        className="w-full h-11 rounded-full bg-white text-black text-xs font-black uppercase tracking-widest hover:bg-zinc-200 transition-all disabled:opacity-60 inline-flex items-center justify-center gap-2"
                      >
                        {isInitiatingEscrow ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Initiating Escrow...
                          </>
                        ) : (
                          action.buttonLabel
                        )}
                      </button>
                    )}

                    {showTransferChecklist && (
                      <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 space-y-2">
                        <p className="text-[10px] font-black uppercase tracking-widest text-emerald-300">Transfer Checklist</p>
                        <p className="text-xs text-zinc-300">Seller transfer requirements:</p>
                        <p className="text-xs text-zinc-400">1. Domain transfer with EPP/Auth codes.</p>
                        <p className="text-xs text-zinc-400">2. GitHub admin ownership transfer.</p>
                        <p className="text-xs text-zinc-400">3. Stripe ownership transfer to buyer account.</p>
                      </div>
                    )}

                    {action.buttonLabel && action.nextStatus && (
                      <button
                        type="button"
                        disabled={isUpdating}
                        onClick={() => void handleAdvance()}
                        className="w-full h-11 rounded-full bg-white text-black text-xs font-black uppercase tracking-widest hover:bg-zinc-200 transition-all disabled:opacity-60"
                      >
                        {isUpdating ? 'Updating…' : action.buttonLabel}
                      </button>
                    )}

                    {!action.buttonLabel && deal.status !== 'CLOSED' && deal.status !== 'REJECTED' && (
                      <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/10 px-3 py-2 text-xs text-yellow-100 inline-flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" /> Awaiting the next participant action.
                      </div>
                    )}
                  </div>
                </aside>
              </div>

              {deal.status === 'ACCEPTED' && loiDraft && (
                <section className="rounded-2xl border border-white/10 bg-[#050505] p-5 md:p-6 space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">LOI Field Editor</p>
                      <h3 className="text-xl font-black tracking-tight text-white mt-1">Editable Deal Fields</h3>
                      <p className="text-sm text-zinc-400 mt-1">
                        Only placeholders are editable. Legal body text below is locked for consistency.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <label className="space-y-1">
                      <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Date</span>
                      <input
                        value={loiDraft.date}
                        onChange={(event) => setLoiDraft({ ...loiDraft, date: event.target.value })}
                        className="w-full h-10 rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white focus:outline-none focus:border-white/30"
                      />
                    </label>
                    <label className="space-y-1">
                      <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Project Name</span>
                      <input
                        value={loiDraft.projectName}
                        onChange={(event) => setLoiDraft({ ...loiDraft, projectName: event.target.value })}
                        className="w-full h-10 rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white focus:outline-none focus:border-white/30"
                      />
                    </label>
                    <label className="space-y-1">
                      <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Buyer Name / Entity</span>
                      <input
                        value={loiDraft.buyerName}
                        onChange={(event) => setLoiDraft({ ...loiDraft, buyerName: event.target.value })}
                        className="w-full h-10 rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white focus:outline-none focus:border-white/30"
                      />
                    </label>
                    <label className="space-y-1">
                      <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Seller Name / Entity</span>
                      <input
                        value={loiDraft.sellerName}
                        onChange={(event) => setLoiDraft({ ...loiDraft, sellerName: event.target.value })}
                        className="w-full h-10 rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white focus:outline-none focus:border-white/30"
                      />
                    </label>
                    <label className="space-y-1">
                      <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Domains</span>
                      <input
                        value={loiDraft.domains}
                        onChange={(event) => setLoiDraft({ ...loiDraft, domains: event.target.value })}
                        placeholder="e.g. myapp.com"
                        className="w-full h-10 rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white focus:outline-none focus:border-white/30"
                      />
                    </label>
                    <label className="space-y-1">
                      <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Total Purchase Price (USD)</span>
                      <input
                        value={loiDraft.totalPurchasePriceUsd}
                        onChange={(event) => setLoiDraft({ ...loiDraft, totalPurchasePriceUsd: event.target.value.replace(/[^\d.]/g, '') })}
                        className="w-full h-10 rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white focus:outline-none focus:border-white/30"
                      />
                    </label>
                    <label className="space-y-1">
                      <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Due Diligence Days</span>
                      <input
                        value={loiDraft.dueDiligenceDays}
                        onChange={(event) => setLoiDraft({ ...loiDraft, dueDiligenceDays: event.target.value.replace(/[^\d]/g, '') })}
                        className="w-full h-10 rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white focus:outline-none focus:border-white/30"
                      />
                    </label>
                    <label className="space-y-1">
                      <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Exclusivity Days</span>
                      <input
                        value={loiDraft.exclusivityDays}
                        onChange={(event) => setLoiDraft({ ...loiDraft, exclusivityDays: event.target.value.replace(/[^\d]/g, '') })}
                        className="w-full h-10 rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white focus:outline-none focus:border-white/30"
                      />
                    </label>
                    <label className="space-y-1">
                      <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Transition Support Days</span>
                      <input
                        value={loiDraft.transitionDays}
                        onChange={(event) => setLoiDraft({ ...loiDraft, transitionDays: event.target.value.replace(/[^\d]/g, '') })}
                        className="w-full h-10 rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white focus:outline-none focus:border-white/30"
                      />
                    </label>
                    <label className="space-y-1">
                      <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Non-Compete (Years)</span>
                      <input
                        value={loiDraft.nonCompeteYears}
                        onChange={(event) => setLoiDraft({ ...loiDraft, nonCompeteYears: event.target.value.replace(/[^\d]/g, '') })}
                        className="w-full h-10 rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white focus:outline-none focus:border-white/30"
                      />
                    </label>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">LOI Main Body (Read-Only)</p>
                    <pre className="max-h-[520px] overflow-auto whitespace-pre-wrap text-xs leading-relaxed text-zinc-300 font-sans">
                      {loiBodyText(loiDraft)}
                    </pre>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        openAgreementPrintDialog(
                          'Letter of Intent (LOI)',
                          loiBodyText(loiDraft),
                          loiDraft.projectName || deal.asset.name,
                        )
                      }
                      className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-xl border border-cyan-400/35 bg-cyan-500/10 text-cyan-100 text-[11px] font-black uppercase tracking-widest hover:bg-cyan-500/20 transition-all"
                    >
                      <Download className="w-4 h-4" /> Download LOI PDF
                    </button>
                    <p className="text-[11px] text-zinc-500">Opens print dialog. Select "Save as PDF", then sign and email the counterparty.</p>
                  </div>
                </section>
              )}

              {deal.status === 'DUE_DILIGENCE' && apaDraft && (
                <section className="rounded-2xl border border-white/10 bg-[#050505] p-5 md:p-6 space-y-4">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">APA Field Editor</p>
                    <h3 className="text-xl font-black tracking-tight text-white mt-1">Editable Agreement Fields</h3>
                    <p className="text-sm text-zinc-400 mt-1">
                      Placeholder fields are editable. Core legal body text remains read-only.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <label className="space-y-1">
                      <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Date</span>
                      <input
                        value={apaDraft.date}
                        onChange={(event) => setApaDraft({ ...apaDraft, date: event.target.value })}
                        className="w-full h-10 rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white focus:outline-none focus:border-white/30"
                      />
                    </label>
                    <label className="space-y-1">
                      <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Project / App Name</span>
                      <input
                        value={apaDraft.projectName}
                        onChange={(event) => setApaDraft({ ...apaDraft, projectName: event.target.value })}
                        className="w-full h-10 rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white focus:outline-none focus:border-white/30"
                      />
                    </label>
                    <label className="space-y-1">
                      <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Seller Name / Entity</span>
                      <input
                        value={apaDraft.sellerName}
                        onChange={(event) => setApaDraft({ ...apaDraft, sellerName: event.target.value })}
                        className="w-full h-10 rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white focus:outline-none focus:border-white/30"
                      />
                    </label>
                    <label className="space-y-1">
                      <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Seller Address / Country</span>
                      <input
                        value={apaDraft.sellerAddress}
                        onChange={(event) => setApaDraft({ ...apaDraft, sellerAddress: event.target.value })}
                        className="w-full h-10 rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white focus:outline-none focus:border-white/30"
                      />
                    </label>
                    <label className="space-y-1">
                      <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Buyer Name / Entity</span>
                      <input
                        value={apaDraft.buyerName}
                        onChange={(event) => setApaDraft({ ...apaDraft, buyerName: event.target.value })}
                        className="w-full h-10 rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white focus:outline-none focus:border-white/30"
                      />
                    </label>
                    <label className="space-y-1">
                      <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Buyer Address / Country</span>
                      <input
                        value={apaDraft.buyerAddress}
                        onChange={(event) => setApaDraft({ ...apaDraft, buyerAddress: event.target.value })}
                        className="w-full h-10 rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white focus:outline-none focus:border-white/30"
                      />
                    </label>
                    <label className="space-y-1">
                      <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Total Purchase Price (USD)</span>
                      <input
                        value={apaDraft.totalPurchasePriceUsd}
                        onChange={(event) => setApaDraft({ ...apaDraft, totalPurchasePriceUsd: event.target.value.replace(/[^\d.]/g, '') })}
                        className="w-full h-10 rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white focus:outline-none focus:border-white/30"
                      />
                    </label>
                    <label className="space-y-1">
                      <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Escrow Funding Days</span>
                      <input
                        value={apaDraft.escrowFundingDays}
                        onChange={(event) => setApaDraft({ ...apaDraft, escrowFundingDays: event.target.value.replace(/[^\d]/g, '') })}
                        className="w-full h-10 rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white focus:outline-none focus:border-white/30"
                      />
                    </label>
                    <label className="space-y-1">
                      <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Inspection Period (Days)</span>
                      <input
                        value={apaDraft.inspectionDays}
                        onChange={(event) => setApaDraft({ ...apaDraft, inspectionDays: event.target.value.replace(/[^\d]/g, '') })}
                        className="w-full h-10 rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white focus:outline-none focus:border-white/30"
                      />
                    </label>
                    <label className="space-y-1">
                      <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Transition Support Hours</span>
                      <input
                        value={apaDraft.transitionSupportHours}
                        onChange={(event) => setApaDraft({ ...apaDraft, transitionSupportHours: event.target.value.replace(/[^\d]/g, '') })}
                        className="w-full h-10 rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white focus:outline-none focus:border-white/30"
                      />
                    </label>
                    <label className="space-y-1">
                      <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Transition Support Days</span>
                      <input
                        value={apaDraft.transitionSupportDays}
                        onChange={(event) => setApaDraft({ ...apaDraft, transitionSupportDays: event.target.value.replace(/[^\d]/g, '') })}
                        className="w-full h-10 rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white focus:outline-none focus:border-white/30"
                      />
                    </label>
                    <label className="space-y-1">
                      <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Non-Compete (Years)</span>
                      <input
                        value={apaDraft.nonCompeteYears}
                        onChange={(event) => setApaDraft({ ...apaDraft, nonCompeteYears: event.target.value.replace(/[^\d]/g, '') })}
                        className="w-full h-10 rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white focus:outline-none focus:border-white/30"
                      />
                    </label>
                    <label className="space-y-1 md:col-span-2">
                      <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Governing Law</span>
                      <input
                        value={apaDraft.governingLaw}
                        onChange={(event) => setApaDraft({ ...apaDraft, governingLaw: event.target.value })}
                        className="w-full h-10 rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white focus:outline-none focus:border-white/30"
                      />
                    </label>
                    <label className="space-y-1 md:col-span-2">
                      <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Primary Domain</span>
                      <input
                        value={apaDraft.primaryDomain}
                        onChange={(event) => setApaDraft({ ...apaDraft, primaryDomain: event.target.value })}
                        className="w-full h-10 rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white focus:outline-none focus:border-white/30"
                      />
                    </label>
                    <label className="space-y-1 md:col-span-2">
                      <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Code Repositories</span>
                      <input
                        value={apaDraft.codeRepositories}
                        onChange={(event) => setApaDraft({ ...apaDraft, codeRepositories: event.target.value })}
                        className="w-full h-10 rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white focus:outline-none focus:border-white/30"
                      />
                    </label>
                    <label className="space-y-1 md:col-span-2">
                      <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Payment Processor Account</span>
                      <input
                        value={apaDraft.paymentProcessorAccount}
                        onChange={(event) => setApaDraft({ ...apaDraft, paymentProcessorAccount: event.target.value })}
                        className="w-full h-10 rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white focus:outline-none focus:border-white/30"
                      />
                    </label>
                    <label className="space-y-1 md:col-span-2">
                      <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Hosting Provider Account</span>
                      <input
                        value={apaDraft.hostingProviderAccount}
                        onChange={(event) => setApaDraft({ ...apaDraft, hostingProviderAccount: event.target.value })}
                        className="w-full h-10 rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white focus:outline-none focus:border-white/30"
                      />
                    </label>
                    <label className="space-y-1 md:col-span-2">
                      <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Social Media Handles</span>
                      <input
                        value={apaDraft.socialHandles}
                        onChange={(event) => setApaDraft({ ...apaDraft, socialHandles: event.target.value })}
                        className="w-full h-10 rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white focus:outline-none focus:border-white/30"
                      />
                    </label>
                    <label className="space-y-1 md:col-span-2">
                      <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Other Key Software Accounts</span>
                      <input
                        value={apaDraft.otherAccounts}
                        onChange={(event) => setApaDraft({ ...apaDraft, otherAccounts: event.target.value })}
                        className="w-full h-10 rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white focus:outline-none focus:border-white/30"
                      />
                    </label>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">APA Main Body (Read-Only)</p>
                    <pre className="max-h-[520px] overflow-auto whitespace-pre-wrap text-xs leading-relaxed text-zinc-300 font-sans">
                      {apaBodyText(apaDraft)}
                    </pre>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        openAgreementPrintDialog(
                          'Asset Purchase Agreement (APA)',
                          apaBodyText(apaDraft),
                          apaDraft.projectName || deal.asset.name,
                        )
                      }
                      className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-xl border border-cyan-400/35 bg-cyan-500/10 text-cyan-100 text-[11px] font-black uppercase tracking-widest hover:bg-cyan-500/20 transition-all"
                    >
                      <Download className="w-4 h-4" /> Download APA PDF
                    </button>
                    <p className="text-[11px] text-zinc-500">Opens print dialog. Select "Save as PDF", then sign and email the counterparty.</p>
                  </div>
                </section>
              )}

              {error && (
                <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs text-red-200">
                  {error}
                </div>
              )}

              {escrowNotice && (
                <div className="rounded-2xl border border-amber-400/40 bg-amber-500/10 px-4 py-3 text-xs text-amber-100">
                  {escrowNotice}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DealRoomView;
