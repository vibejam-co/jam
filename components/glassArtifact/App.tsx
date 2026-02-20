
import React from 'react';
import { GlassOSProfile } from './components/GlassOSProfile';

interface GlassArtifactAppProps {
  forcedViewport?: 'mobile' | 'desktop';
  profileOverride?: {
    name?: string;
    bio?: string;
    avatar?: string;
    handle?: string;
  };
}

const App: React.FC<GlassArtifactAppProps> = ({ forcedViewport, profileOverride }) => {
  const isCompact = forcedViewport === 'mobile';
  return (
    <div className={`min-h-screen w-full mesh-gradient relative overflow-hidden flex justify-center ${isCompact ? 'items-start p-2 pt-4' : 'items-start md:items-center p-3 md:p-8 pt-6 md:pt-8'}`}>
      {/* Background Motion Elements */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-500/10 blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-500/10 blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
      </div>
      
      <div className={`relative z-10 w-full mx-auto ${isCompact ? 'max-w-5xl' : 'max-w-7xl'}`}>
        <GlassOSProfile forcedViewport={forcedViewport} profileOverride={profileOverride} />
      </div>
    </div>
  );
};

export default App;
