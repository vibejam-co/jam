
import React from 'react';
import { Canvas } from './components/Canvas';

interface AeroCanvasAppProps {
  forcedViewport?: 'mobile' | 'desktop';
}

const App: React.FC<AeroCanvasAppProps> = ({ forcedViewport }) => {
  return (
    <div className="w-full h-full overflow-hidden">
      <Canvas forcedViewport={forcedViewport} />
    </div>
  );
};

export default App;
