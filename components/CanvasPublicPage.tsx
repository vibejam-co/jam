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

  if (selectedThemeId === 'isometric-loft-profile') {
    return <IsometricLoftApp />;
  }
  if (selectedThemeId === 'kinetic-variable-profile') {
    return <KineticVariableApp />;
  }
  if (selectedThemeId === 'orbital-lens-spatial-link-in-bio') {
    return <OrbitalLensApp />;
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
      return <EtherealLiquidApp />;
    case 'glass':
      return <GlassArtifactApp />;
    case 'midnight':
    default:
      return <MidnightZenithApp />;
  }
};

export default CanvasPublicPage;
