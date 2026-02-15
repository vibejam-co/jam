
import React from 'react';
import DigitalTerrarium from './components/DigitalTerrarium';

interface TerrariumAppProps {
  forcedViewport?: 'mobile' | 'desktop';
}

const App: React.FC<TerrariumAppProps> = ({ forcedViewport }) => {
  return (
    <div className="w-full h-screen overflow-hidden">
      <DigitalTerrarium forcedViewport={forcedViewport} />
    </div>
  );
};

export default App;
