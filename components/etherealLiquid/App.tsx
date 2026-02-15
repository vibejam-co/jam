
import React from 'react';
import VibeJamProfile from './VibeJamProfile';

interface EtherealLiquidAppProps {
  forcedViewport?: 'mobile' | 'desktop';
}

const App: React.FC<EtherealLiquidAppProps> = ({ forcedViewport }) => {
  return (
    <div className="min-h-screen">
      <VibeJamProfile forcedViewport={forcedViewport} />
    </div>
  );
};

export default App;
