
import React from 'react';
import { GlassOSProfile } from './components/GlassOSProfile';

const App: React.FC = () => {
  return (
    <div className="min-h-screen w-full mesh-gradient relative overflow-hidden flex items-start md:items-center justify-center p-3 md:p-8 pt-6 md:pt-8">
      {/* Background Motion Elements */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-500/10 blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-500/10 blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
      </div>
      
      <div className="relative z-10 w-full max-w-7xl mx-auto">
        <GlassOSProfile />
      </div>
    </div>
  );
};

export default App;
