import React, { useEffect, useMemo, useState } from 'react';
import type { CanvasDashboardSession } from '../types';
import { fetchPublicCanvasSession } from '../lib/api';
import MidnightZenithApp from './midnightZenith/App';
import EditorialKineticProfile from './editorialKinetic/EditorialKineticProfile';
import CreatorHubApp from './creatorHub/App';
import EtherealLiquidApp from './etherealLiquid/App';
import GlassArtifactApp from './glassArtifact/App';
import IsometricLoftApp from './isometricLoft/App';
import KineticVariableApp from './kineticVariable/App';
import OrbitalLensApp from './orbitalLens/App';
import VaporOsApp from './vaporOs/App';
import GoldStandardCollectionApp from './collection/goldStandard/App';
import AccordionDeckCollectionApp from './collection/accordionDeck/App';
import CollageOsCollectionApp from './collection/collageOs/App';
import TerrariumCollectionApp from './collection/terrarium/App';
import PrismOsCollectionApp from './collection/prismOs/App';
import AeroCanvasCollectionApp from './collection/aeroCanvas/App';
import ThemeMonetizationOverlay from './monetization/ThemeMonetizationOverlay';

interface CanvasPublicPageProps {
  slug: string;
}

const getThemeFamily = (themeId: string): 'midnight' | 'editorial' | 'creator' | 'aurora' | 'glass' => {
  const id = themeId.toLowerCase();
  if (id.includes('editorial') || id.includes('monarch') || id.includes('newsroom') || id.includes('press')) {
    return 'editorial';
  }
  if (id.includes('concrete') || id.includes('brutal') || id.includes('carbon') || id.includes('blacksmith')) {
    return 'creator';
  }
  if (id.includes('aurora') || id.includes('halo') || id.includes('atlas') || id.includes('sonic')) {
    return 'aurora';
  }
  if (id.includes('glass') || id.includes('prism') || id.includes('sapphire') || id.includes('opal') || id.includes('obsidian')) {
    return 'glass';
  }
  return 'midnight';
};

const CanvasPublicPage: React.FC<CanvasPublicPageProps> = ({ slug }) => {
  const [session, setSession] = useState<CanvasDashboardSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isProductsOpen, setIsProductsOpen] = useState(false);
  const [isBrandCollabsOpen, setIsBrandCollabsOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const hydrate = async () => {
      try {
        const data = await fetchPublicCanvasSession(slug);
        if (cancelled) {
          return;
        }
        setSession(data.session);
        setError(null);
      } catch (nextError) {
        if (!cancelled) {
          setError(nextError instanceof Error ? nextError.message : 'Failed to load page.');
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    hydrate();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const selectedThemeId = session?.onboarding.selectedTheme ?? 'midnight-zenith';
  const previewLinks = useMemo(() => session?.onboarding.links ?? {}, [session?.onboarding.links]);
  const monetization = session?.onboarding.monetization ?? {
    tipJarEnabled: false,
    tipJarUrl: '',
    products: [],
    brandCollabs: {
      enabled: false,
      contactEmail: '',
      rateCardUrl: '',
      minBudgetUsd: 500,
      inbox: [],
    },
  };
  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <span className="text-xs tracking-[0.3em] uppercase text-white/50">Loading Live Page</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center px-6 text-center">
        <div>
          <h1 className="text-2xl font-black mb-3">Unable to load this page</h1>
          <p className="text-white/50 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center px-6 text-center">
        <div>
          <h1 className="text-3xl font-black mb-3">Page not found</h1>
          <p className="text-white/50 text-sm">No live Canvas is published for @{slug}.</p>
        </div>
      </div>
    );
  }

  const renderThemeContent = (): React.ReactNode => {
    if (selectedThemeId === 'isometric-loft-profile') {
      return <IsometricLoftApp />;
    }
    if (selectedThemeId === 'kinetic-variable-profile') {
      return <KineticVariableApp />;
    }
    if (selectedThemeId === 'orbital-lens-spatial-link-in-bio') {
      return (
        <OrbitalLensApp
          profileOverride={{
            name: session.onboarding.profile.name,
            avatar: session.onboarding.profile.avatar,
            handle: `@${session.publish.slug}`,
          }}
        />
      );
    }
    if (selectedThemeId === 'vapor-os') {
      return <VaporOsApp />;
    }
    if (selectedThemeId.startsWith('collection-')) {
      const collectionId = selectedThemeId.replace('collection-', '');
      switch (collectionId) {
        case 'gold-standard':
          return <GoldStandardCollectionApp />;
        case 'accordion-deck':
          return <AccordionDeckCollectionApp />;
        case 'collage-os':
          return <CollageOsCollectionApp />;
        case 'terrarium':
          return <TerrariumCollectionApp />;
        case 'prism-os':
          return <PrismOsCollectionApp />;
        case 'aero-canvas':
          return <AeroCanvasCollectionApp />;
        default:
          return <MidnightZenithApp />;
      }
    }

    const family = getThemeFamily(selectedThemeId);
    switch (family) {
      case 'editorial':
        return <EditorialKineticProfile />;
      case 'creator':
        return (
          <CreatorHubApp
            profileOverride={{
              name: session.onboarding.profile.name,
              bio: session.onboarding.profile.bio,
              avatar: session.onboarding.profile.avatar,
            }}
            linksOverride={previewLinks}
            slugOverride={session.publish.slug}
          />
        );
      case 'aurora':
        return (
          <EtherealLiquidApp
            profileOverride={{
              name: session.onboarding.profile.name,
              bio: session.onboarding.profile.bio,
              avatar: session.onboarding.profile.avatar,
              handle: `@${session.publish.slug}`,
            }}
          />
        );
      case 'glass':
        return (
          <GlassArtifactApp
            profileOverride={{
              name: session.onboarding.profile.name,
              bio: session.onboarding.profile.bio,
              avatar: session.onboarding.profile.avatar,
              handle: `@${session.publish.slug}`,
            }}
          />
        );
      case 'midnight':
      default:
        return (
          <MidnightZenithApp
            profileOverride={{
              name: session.onboarding.profile.name,
              bio: session.onboarding.profile.bio,
              avatar: session.onboarding.profile.avatar,
              handle: `@${session.publish.slug}`,
            }}
          />
        );
    }
  };

  return (
    <div className="relative min-h-screen">
      {renderThemeContent()}
      <ThemeMonetizationOverlay
        tipJarEnabled={Boolean(monetization.tipJarEnabled)}
        tipJarUrl={monetization.tipJarUrl}
        products={monetization.products}
        brandCollabsEnabled={Boolean(monetization.brandCollabs?.enabled)}
        fixed
        onOpenProducts={() => setIsProductsOpen(true)}
        onOpenBrandCollabs={() => setIsBrandCollabsOpen(true)}
      />

      {isProductsOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <button
            type="button"
            onClick={() => setIsProductsOpen(false)}
            className="absolute inset-0"
            aria-label="Close products"
          />
          <div className="relative w-full max-w-lg rounded-3xl border border-white/10 bg-[#0A0A0A] p-5 sm:p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg sm:text-xl font-black tracking-tight">Digital Drops</h2>
              <button
                type="button"
                onClick={() => setIsProductsOpen(false)}
                className="w-8 h-8 rounded-full border border-white/10 hover:bg-white/10"
              >
                ×
              </button>
            </div>
            <div className="space-y-3 max-h-[50vh] overflow-auto pr-1">
              {monetization.products.length === 0 && (
                <p className="text-sm text-white/50">No products listed yet.</p>
              )}
              {monetization.products.map((product) => (
                <div key={product.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-bold text-sm sm:text-base">{product.title}</h3>
                      {product.description && <p className="text-xs text-white/50 mt-1">{product.description}</p>}
                      <span className="mt-2 inline-flex px-2 py-1 rounded-full bg-white/10 text-[10px] uppercase tracking-wider">
                        {product.category}
                      </span>
                    </div>
                    <span className="font-black text-emerald-300">${product.priceUsd.toFixed(2)}</span>
                  </div>
                  <a
                    href={product.url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-flex px-3 py-2 rounded-xl bg-white text-black text-xs font-bold hover:bg-white/90"
                  >
                    Buy Now
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {isBrandCollabsOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <button
            type="button"
            onClick={() => setIsBrandCollabsOpen(false)}
            className="absolute inset-0"
            aria-label="Close collabs"
          />
          <div className="relative w-full max-w-lg rounded-3xl border border-white/10 bg-[#0A0A0A] p-5 sm:p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg sm:text-xl font-black tracking-tight">Work With {session.onboarding.profile.name}</h2>
              <button
                type="button"
                onClick={() => setIsBrandCollabsOpen(false)}
                className="w-8 h-8 rounded-full border border-white/10 hover:bg-white/10"
              >
                ×
              </button>
            </div>
            <div className="space-y-3 text-sm text-white/80">
              <p>Brand collabs are open for inbound sponsorship campaigns.</p>
              <p>
                Contact:{' '}
                <a
                  href={`mailto:${monetization.brandCollabs?.contactEmail || 'collabs@vibejam.co'}`}
                  className="text-emerald-300 font-semibold"
                >
                  {monetization.brandCollabs?.contactEmail || 'collabs@vibejam.co'}
                </a>
              </p>
              {Number.isFinite(monetization.brandCollabs?.minBudgetUsd) && (
                <p>Minimum campaign budget: ${Number(monetization.brandCollabs?.minBudgetUsd).toFixed(0)}</p>
              )}
              {monetization.brandCollabs?.rateCardUrl && (
                <a
                  href={monetization.brandCollabs.rateCardUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex px-3 py-2 rounded-xl bg-white text-black text-xs font-bold hover:bg-white/90"
                >
                  View Rate Card
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CanvasPublicPage;
