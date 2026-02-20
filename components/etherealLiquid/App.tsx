
import React from 'react';
import VibeJamProfile from './VibeJamProfile';

interface EtherealLiquidAppProps {
  forcedViewport?: 'mobile' | 'desktop';
  profileOverride?: {
    name?: string;
    bio?: string;
    avatar?: string;
    handle?: string;
  };
}

const App: React.FC<EtherealLiquidAppProps> = ({ forcedViewport, profileOverride }) => {
  return (
    <div className="min-h-screen">
      <VibeJamProfile forcedViewport={forcedViewport} profileOverride={profileOverride} />
    </div>
  );
};

export default App;
